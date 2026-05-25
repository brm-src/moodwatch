// moodwatch-api · Cloudflare Worker
// Endpoint: GET /recommend?country=CL&lang=es&mood=<base64json>&user=<lb_user>?
// Returns:  { films: [{title, year, director, runtime, genres, poster, justwatch, tmdb, curated_note?}] }

import { discoverByMood } from "./mood.js";
import { tmdbDetails, tmdbProviders, tmdbCredits, tmdbImageBase, tmdbDiscover } from "./tmdb.js";
import { fetchWatchlistTmdbIds } from "./letterboxd.js";
import { CURATED, curatedFor } from "./curated.js";
import { matchLists } from "./lists.js";

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim());
  const ok = allowed.includes(origin) || allowed.includes("*");
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0] || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, init = {}, headers = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function decodeMood(b64) {
  try {
    const s = atob(b64);
    return JSON.parse(decodeURIComponent(escape(s)));
  } catch { return {}; }
}

function justwatchUrl(film, country) {
  // Always use JustWatch search — TMDb's providers_link and locale paths 404 often.
  const c = (country || "us").toLowerCase();
  // Spanish-locale JustWatch uses /buscar, not /search. CL was the reported 404.
  const spanishSearch = new Set(["cl", "es", "mx", "ar", "co", "pe", "uy", "ec"]);
  const searchPath = spanishSearch.has(c) ? "buscar" : "search";
  // Use title + year for better matching; strip special chars but preserve unicode letters.
  const title = (film.title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim();
  const year = film.release_date ? new Date(film.release_date).getFullYear() : "";
  const query = year ? `${title} ${year}` : title;
  const q = encodeURIComponent(query);
  return `https://www.justwatch.com/${c}/${searchPath}?content_type=movie&q=${q}`;
}

function fitScore(film, mood = {}) {
  const genres = new Set([...(film.genres || []), ...(film.genre_ids || [])].map(x => String(x).toLowerCase()));
  let s = 0;
  const has = (...xs) => xs.some(x => genres.has(String(x).toLowerCase()));
  if (mood.tone === "dark" && has("27", "53", "9648", "80", "horror", "thriller", "mystery", "crime")) s += 2;
  if (mood.tone === "light" && has("35", "10749", "12", "16", "14", "comedy", "romance", "adventure", "animation", "fantasy")) s += 2;
  if (mood.energy === "engage" && has("28", "53", "9648", "12", "action", "thriller", "mystery", "adventure")) s += 1.5;
  if (mood.energy === "unwind" && has("35", "10749", "18", "16", "comedy", "romance", "drama", "animation")) s += 1;
  if (mood.first_act === "thriller_horror" && has("27", "53", "9648", "horror", "thriller", "mystery")) s += 2;
  if ((mood.trust === "horror" || mood.first_act === "thriller_horror") && !has("27", "53", "9648", "horror", "thriller", "mystery")) s -= 4;
  if ((mood.trust === "horror" || mood.tone === "dark") && has("10751", "16", "family", "animation")) s -= 2.5;
  if (mood.first_act === "drama_romance" && has("18", "10749", "drama", "romance")) s += 2;
  if (mood.first_act === "action_adventure" && has("28", "12", "action", "adventure")) s += 2;
  if (mood.first_act === "fantasy_scifi" && has("14", "878", "fantasy", "scifi", "science fiction")) s += 2;
  if (mood.runtime === "short" && film.runtime && film.runtime <= 95) s += 1.5;
  if (mood.runtime === "medium" && film.runtime && film.runtime >= 90 && film.runtime <= 125) s += 1;
  if (mood.popularity === "low") s += Math.max(0, 1.4 - Math.min((film.popularity || 0) / 70, 1.4));
  return s;
}

function moodSummary(mood, lang = "en") {
  const es = String(lang || "").startsWith("es");
  const labels = {
    tone: { dark: ["dark", "oscuro"], light: ["light", "luminoso"] },
    energy: { engage: ["engaged", "con tensión"], unwind: ["unwinding", "para bajar revoluciones"] },
    risk: { safe: ["safe", "seguro"], discover: ["discovery", "descubrimiento"] },
    depth: { thoughtful: ["thoughtful", "reflexivo"], uneasy: ["uneasy", "incómodo"], ruined: ["devastating", "devastador"], fun: ["fun", "liviano"], warm: ["warm", "cálido"] },
    runtime: { short: ["under 90 min", "menos de 90 min"], medium: ["90–120 min", "90–120 min"], long: ["long", "larga"], epic: ["epic", "épica"] },
    popularity: { low: ["less obvious", "menos obvio"], high: ["recognizable", "reconocible"], mid: ["balanced", "equilibrado"] },
    first_act: { thriller_horror: ["thriller/horror", "thriller/terror"], drama_romance: ["drama/romance", "drama/romance"], action_adventure: ["action/adventure", "acción/aventura"], fantasy_scifi: ["fantasy/sci-fi", "fantasía/sci-fi"] },
    trust: { horror: ["horror", "terror"], thriller: ["thriller", "thriller"], comedy: ["comedy", "comedia"], animation: ["animation", "animación"], weird: ["weird", "raro"], drama: ["drama", "drama"] },
  };
  const chips = [];
  for (const [axis, vals] of Object.entries(labels)) {
    const v = mood?.[axis];
    if (v && vals[v]) chips.push(vals[v][es ? 1 : 0]);
  }
  const headline = chips.length
    ? (es ? `Tu mood: ${chips.slice(0, 5).join(" · ")}.` : `Your mood: ${chips.slice(0, 5).join(" · ")}.`)
    : (es ? "Sin mood fijo: fui por calidad y sorpresa." : "No fixed mood: I went for quality and surprise.");
  return { headline, chips: chips.slice(0, 8) };
}

function pickReason(film, mood, lang = "en") {
  const es = String(lang || "").startsWith("es");
  const bits = [];
  if (film._curated) bits.push(es ? "tiene nota editorial" : "has an editor note");
  if (film._list) bits.push(es ? `calza con ${film._list}` : `matches ${film._list}`);
  if (mood?.runtime && film.runtime) bits.push(es ? `${film.runtime} min dentro del tiempo` : `${film.runtime} min fits the runtime`);
  if (mood?.trust === "horror") bits.push(es ? "viene del eje terror/atmósfera" : "comes from the horror/atmosphere axis");
  if (mood?.risk === "discover") bits.push(es ? "privilegié descubrimiento sobre obviedad" : "leans discovery over obvious picks");
  if (mood?.popularity === "low") bits.push(es ? "evité solo blockbusters" : "avoids only-blockbuster picks");
  if (!bits.length) bits.push(es ? "salió por mezcla de rating, mood y variedad" : "picked by rating, mood fit and variety");
  return (es ? "Por qué: " : "Why: ") + bits.slice(0, 3).join("; ") + ".";
}

function surpriseMoodForProfile(profile) {
  const p = (profile || "quality").toLowerCase();
  const presets = {
    weird:     { trust: "weird", risk: "discover", popularity: "low" },
    short:     { runtime: "short", risk: "safe" },
    beautiful: { tone: "light", energy: "unwind", want: "soothed", quality: "high" },
    hurt:      { memory: "heartbreak", want: "haunted", depth: "ruined" },
    pace:      { energy: "engage", first_act: "action_adventure", popularity: "mid" },
    horror:    { trust: "horror", tone: "dark", first_act: "thriller_horror" },
    classic:   { decade: "old", quality: "high" },
    quality:   { quality: "high" },
    rainy:     { weather: "rain", window: "rain", light: "neon", tone: "dark", temperature: "cool" },
    lonely:    { company: "alone", state: "pensive", depth: "thoughtful", temperature: "cool" },
    trip:      { trust: "weird", risk: "discover", appetite: "weird", depth: "uneasy" },
    neon:      { color: "neon", light: "neon", tone: "dark", energy: "engage" },
    warm:      { tone: "light", energy: "unwind", depth: "warm", want: "soothed" },
    cult:      { trust: "weird", risk: "discover", popularity: "low", depth: "uneasy" },
    latam:     { language_pref: "spanish", risk: "discover" },
    asian:     { language_pref: "asian", quality: "high" },
    noir:      { tone: "dark", first_act: "thriller_horror", trust: "thriller", quality: "high" },
    "lost-20s":{ appetite: "lost-20s", depth: "thoughtful", state: "pensive", memory: "regret" },
  };
  return presets[p] || presets.quality;
}

async function recommend(req, env, ctx) {
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") || "US").toUpperCase();
  const lang    = (url.searchParams.get("lang") || "en").startsWith("es") ? "es-ES" : "en-US";
  const moodB64 = url.searchParams.get("mood") || "";
  const user    = (url.searchParams.get("user") || "").trim().toLowerCase();
  const exclude = (url.searchParams.get("exclude") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n));
  const excludeSet = new Set(exclude);
  const mood    = decodeMood(moodB64);

  if (!env.TMDB_API_KEY) {
    return { error: "config", message: "TMDB_API_KEY not set" };
  }

  // 1. Get candidate pool from TMDb /discover (multi-page if discoverable)
  const candidates = await discoverByMood(env, mood, lang);

  // 1b. Merge mood-matched editorial list seeds into the candidate pool.
  // This replaces live Letterboxd scraping: LB blocks Workers and list URLs rot.
  // List hits get tagged with `from_list` and a soft score boost.
  const matched = matchLists(mood);
  const listIds = new Map();
  for (const m of matched) {
    for (const id of (m.list.ids || [])) {
      if (!listIds.has(id)) listIds.set(id, m.list.name);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const candidateIds = new Set(candidates.map(c => c.id));
  const missingListIds = [...listIds.keys()].filter(id => !candidateIds.has(id));
  for (let i = missingListIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [missingListIds[i], missingListIds[j]] = [missingListIds[j], missingListIds[i]];
  }
  const extraFromLists = (await Promise.all(missingListIds.slice(0, 6).map(id =>
    tmdbDetails(env, id, lang).then(d => ({
      id: d.id,
      title: d.title,
      release_date: d.release_date,
      vote_average: d.vote_average,
      vote_count: d.vote_count,
      popularity: d.popularity,
      genre_ids: (d.genres || []).map(g => g.id),
      genres: (d.genres || []).map(g => g.name?.toLowerCase()),
      poster_path: d.poster_path,
      overview: d.overview,
      runtime: d.runtime,
      _list: listIds.get(id) || null,
      _listOnly: true,
    })).catch(() => null)
  ))).filter(f => {
    if (!f) return false;
    if (f.release_date && f.release_date > today) return false;
    if (mood.runtime === "short" && f.runtime && f.runtime > 95) return false;
    if (mood.runtime === "medium" && f.runtime && (f.runtime < 85 || f.runtime > 130)) return false;
    return true;
  });

  const allCandidates = [
    ...candidates.map(c => ({ ...c, _list: listIds.get(c.id) || null })),
    ...extraFromLists,
  ];

  // 2. If LB user provided, intersect with their watchlist TMDb IDs
  let pool = allCandidates;
  let lbUsed = false;
  if (user) {
    if (!/^[a-z0-9_-]{1,30}$/.test(user)) {
      return { error: "invalid_user", status: 400 };
    }
    try {
      const wlIds = await fetchWatchlistTmdbIds(env, user);
      if (!wlIds || wlIds.size === 0) {
        return { error: "empty_watchlist", status: 404 };
      }
      const filtered = allCandidates.filter(f => wlIds.has(f.id));
      if (filtered.length >= 3) { pool = filtered; lbUsed = true; }
    } catch (e) {
      console.log("LB fail:", e?.message);
    }
  }

  // Drop excluded ids (re-roll case) and future releases
  pool = pool.filter(f => !excludeSet.has(f.id) && (!f.release_date || f.release_date <= today));

  // 3. Score with curated + list boost
  const ranked = pool.map(f => {
    const cur = curatedFor(f.id);
    const listName = f._list;
    const score =
      (f.vote_average || (f._listOnly ? 7 : 0)) * 1.5 +
      Math.min((f.popularity || 0) / 35, 3.2) +
      fitScore(f, mood) +
      (cur ? 6 : 0) +
      (listName ? 3 : 0) -
      (mood.popularity === "low" ? Math.min((f.popularity || 0) / 42, 3) : 0) +
      (Math.random() * 0.9);
    return { ...f, _score: score, _curated: cur || null, _list: listName };
  }).sort((a, b) => b._score - a._score);

  // Prefer editorial list hits when a mood clearly matches a list; TMDb discover fills gaps.
  const curatedHits = ranked.filter(f => f._curated && (!matched.length || f._list));
  const listHits = ranked.filter(f => f._list && !f._curated);
  const otherHits = ranked.filter(f => !f._curated && !f._list);

  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const top = [];
  const pushUnique = (items, max) => {
    for (const item of items) {
      if (top.length >= max) break;
      if (!top.some(x => x.id === item.id)) top.push(item);
    }
  };
  pushUnique(curatedHits.slice(0, 4), 3);
  pushUnique(listHits.slice(0, 24), matched.length ? 8 : 3);
  pushUnique(otherHits.slice(0, 40), 10);
  const enrichedPool = await Promise.all(top.slice(0, 9).map(async (f) => {
    const [providers, credits, details] = await Promise.all([
      tmdbProviders(env, f.id, country),
      tmdbCredits(env, f.id),
      tmdbDetails(env, f.id, lang),
    ]);
    return {
      id: f.id,
      title: f.title || details.title,
      year: (f.release_date || details.release_date || "").slice(0, 4),
      director: credits.director || null,
      runtime: details.runtime || null,
      genres: f.genres || (details.genres || []).map(g => g.name?.toLowerCase()),
      poster: (f.poster_path || details.poster_path) ? `${tmdbImageBase()}w342${f.poster_path || details.poster_path}` : null,
      overview: f.overview || details.overview || null,
      justwatch: justwatchUrl({ title: f.title || details.title, release_date: f.release_date || details.release_date, providers_link: providers.link }, country),
      tmdb: `https://www.themoviedb.org/movie/${f.id}`,
      curated_note: f._curated?.note || null,
      from_list: f._list || null,
      reason: pickReason({ ...f, runtime: details.runtime || f.runtime }, mood, lang),
    };
  }));

  const enriched = enrichedPool.filter(f => {
    if (mood.runtime === "short" && f.runtime && f.runtime > 95) return false;
    if (mood.runtime === "medium" && f.runtime && (f.runtime < 85 || f.runtime > 130)) return false;
    if (mood.runtime === "long" && f.runtime && f.runtime < 110) return false;
    return true;
  }).slice(0, 4);

  return { films: enriched, lb_used: lbUsed, why: moodSummary(mood, lang), matched_lists: matched.map(m => m.list.name) };
}

async function surprise(req, env, ctx) {
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") || "US").toUpperCase();
  const lang    = (url.searchParams.get("lang") || "en").startsWith("es") ? "es-ES" : "en-US";
  const profile = (url.searchParams.get("profile") || "quality").toLowerCase();
  const surpriseMood = surpriseMoodForProfile(profile);
  const exclude = (url.searchParams.get("exclude") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n));
  const excludeSet = new Set(exclude);

  if (!env.TMDB_API_KEY) return { error: "config" };

  // Random page 1-20 of TMDb top-rated, with quality floor
  const today = new Date().toISOString().slice(0, 10);
  const sorts = ["vote_average.desc", "popularity.desc"];
  const pages = [];
  for (let i = 0; i < 6; i++) {
    pages.push({
      sort_by: sorts[Math.floor(Math.random() * sorts.length)],
      page: 1 + Math.floor(Math.random() * 25),
    });
  }

  const baseParams = {
    "vote_count.gte": profile === "weird" ? 80 : 800,
    "vote_average.gte": profile === "pace" ? 6.3 : 6.8,
    "with_runtime.gte": 75,
    "primary_release_date.lte": today,
    include_adult: "false",
  };
  if (profile === "short") baseParams["with_runtime.lte"] = 95;
  if (profile === "weird") baseParams["vote_count.lte"] = 1500;
  if (profile === "classic") baseParams["primary_release_date.lte"] = "1979-12-31";
  if (profile === "horror") baseParams.with_genres = "27|53|9648";
  if (profile === "pace") baseParams.with_genres = "28|12|53";
  if (profile === "hurt") baseParams["vote_count.gte"] = 120;

  const fetches = pages.map(p =>
    tmdbDiscover(env, { ...baseParams, ...p }, lang).catch(() => ({ results: [] }))
  );
  const all = await Promise.all(fetches);
  let pool = all.flatMap(r => r.results || []);

  const matched = matchLists(surpriseMood);
  const listIds = new Map();
  for (const m of matched) {
    for (const id of (m.list.ids || [])) if (!listIds.has(id)) listIds.set(id, m.list.name);
  }
  const shuffledListIds = [...listIds.keys()];
  for (let i = shuffledListIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledListIds[i], shuffledListIds[j]] = [shuffledListIds[j], shuffledListIds[i]];
  }
  const extraFromLists = (await Promise.all(shuffledListIds.slice(0, 8).map(id =>
    tmdbDetails(env, id, lang).then(d => ({
      id: d.id,
      title: d.title,
      release_date: d.release_date,
      vote_average: d.vote_average,
      vote_count: d.vote_count,
      popularity: d.popularity,
      genre_ids: (d.genres || []).map(g => g.id),
      genres: (d.genres || []).map(g => g.name?.toLowerCase()),
      poster_path: d.poster_path,
      overview: d.overview,
      runtime: d.runtime,
      _list: listIds.get(id) || null,
    })).catch(() => null)
  ))).filter(f => {
    if (!f) return false;
    if (f.release_date && f.release_date > today) return false;
    if (f.runtime && f.runtime < 75) return false;
    if (profile === "short" && f.runtime && f.runtime > 95) return false;
    return true;
  });
  pool = [
    ...pool.map(f => ({ ...f, _list: listIds.get(f.id) || null })),
    ...extraFromLists,
  ];

  // De-dupe + drop excluded/profile leaks
  const seen = new Set();
  pool = pool.filter(f => {
    if (excludeSet.has(f.id)) return false;
    if (seen.has(f.id)) return false;
    if (profile === "short" && f.runtime && f.runtime > 95) return false;
    seen.add(f.id);
    return true;
  });

  pool = pool.map(f => ({
    ...f,
    _score:
      (f.vote_average || 0) * 1.4 +
      Math.min((f.popularity || 0) / 45, 2.5) +
      fitScore(f, surpriseMood) +
      (f._list ? 3 : 0) +
      (curatedFor(f.id) ? 4 : 0) +
      (Math.random() * 1.2),
  })).sort((a, b) => b._score - a._score);
  const listed = pool.filter(f => f._list);
  const unlisted = pool.filter(f => !f._list);
  const top = listed.length >= 6 ? listed.slice(0, 7) : [...listed, ...unlisted].slice(0, 8);

  const enrichedRaw = await Promise.all(top.map(async (f) => {
    const [providers, credits, details] = await Promise.all([
      tmdbProviders(env, f.id, country),
      tmdbCredits(env, f.id),
      tmdbDetails(env, f.id, lang),
    ]);
    const cur = curatedFor(f.id);
    return {
      id: f.id,
      title: f.title,
      year: (f.release_date || "").slice(0, 4),
      director: credits.director || null,
      runtime: details.runtime || null,
      genres: f.genres || (details.genres || []).map(g => g.name),
      poster: f.poster_path ? `${tmdbImageBase()}w342${f.poster_path}` : null,
      overview: f.overview || null,
      justwatch: justwatchUrl({ title: f.title, release_date: f.release_date, providers_link: providers.link }, country),
      tmdb: `https://www.themoviedb.org/movie/${f.id}`,
      curated_note: cur?.note || null,
      from_list: f._list || null,
      reason: pickReason({ ...f, _curated: cur || null, runtime: details.runtime || f.runtime || null }, surpriseMood, lang),
    };
  }));

  const enriched = enrichedRaw.filter(f => {
    if (profile === "short" && f.runtime && f.runtime > 95) return false;
    return true;
  }).slice(0, 6);

  return { films: enriched, mode: "surprise", profile, why: moodSummary(surpriseMood, lang), matched_lists: matched.map(m => m.list.name) };
}
async function verifyCurated(req, env) {
  const url = new URL(req.url);
  const max = Math.min(parseInt(url.searchParams.get("max") || "40", 10), 50);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
  const out = [];
  const seen = new Set();
  const slice = CURATED.slice(offset, offset + max);
  for (const c of slice) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    try {
      const d = await tmdbDetails(env, c.id, "en-US");
      out.push({ id: c.id, title: d.title, original_title: d.original_title, year: (d.release_date || "").slice(0, 4), note: c.note });
    } catch (e) {
      out.push({ id: c.id, error: String(e?.message || e) });
    }
  }
  return { offset, max, count: out.length, total: CURATED.length, items: out };
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, time: Date.now() }, {}, cors);
    }

    if (url.pathname === "/recommend") {
      try {
        const out = await recommend(req, env, ctx);
        if (out.error) return json(out, { status: out.status || 500 }, cors);
        return json(out, {}, cors);
      } catch (e) {
        console.log("recommend err:", e?.stack || e);
        return json({ error: "generic", message: String(e?.message || e) }, { status: 500 }, cors);
      }
    }

    if (url.pathname === "/surprise") {
      try {
        const out = await surprise(req, env, ctx);
        if (out.error) return json(out, { status: out.status || 500 }, cors);
        return json(out, {}, cors);
      } catch (e) {
        console.log("surprise err:", e?.stack || e);
        return json({ error: "generic", message: String(e?.message || e) }, { status: 500 }, cors);
      }
    }

    if (url.pathname === "/verify-curated") {
      try {
        const out = await verifyCurated(req, env);
        return json(out, {}, cors);
      } catch (e) {
        return json({ error: "verify", message: String(e?.message || e) }, { status: 500 }, cors);
      }
    }

    return json({ ok: true, name: "moodwatch-api" }, {}, cors);
  },
};
