// moodwatch-api · Cloudflare Worker
// Endpoint: GET /recommend?country=CL&lang=es&mood=<base64json>&user=<lb_user>?
// Returns:  { films: [{title, year, director, runtime, genres, poster, justwatch, tmdb, curated_note?}] }

import { discoverByMood } from "./mood.js";
import {
  tmdbDetails, tmdbProviders, tmdbCredits, tmdbImageBase, tmdbDiscover,
  tmdbSimilar, tmdbRecommendations,
  tmdbDetailsTV, tmdbProvidersTV, tmdbCreditsTV, tmdbDiscoverTV,
} from "./tmdb.js";
import { fetchWatchlistTmdbIds } from "./letterboxd.js";
import { CURATED, curatedFor, CURATED_TV, curatedTvFor } from "./curated.js";
import { matchLists } from "./lists.js";

// Per-media TMDb helper bundle. Keeps movie path identical when media === "movie".
function mediaApi(media) {
  if (media === "tv") {
    return {
      details: tmdbDetailsTV,
      providers: tmdbProvidersTV,
      credits: tmdbCreditsTV,
      discover: tmdbDiscoverTV,
      curatedFor: curatedTvFor,
      tmdbUrl: id => `https://www.themoviedb.org/tv/${id}`,
      titleOf: x => x.name || x.title,
      dateOf: x => x.first_air_date || x.release_date,
      jwContentType: "tvshow",
    };
  }
  return {
    details: tmdbDetails,
    providers: tmdbProviders,
    credits: tmdbCredits,
    discover: tmdbDiscover,
    curatedFor,
    tmdbUrl: id => `https://www.themoviedb.org/movie/${id}`,
    titleOf: x => x.title,
    dateOf: x => x.release_date,
    jwContentType: "movie",
  };
}

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

// Build the "Where to watch" URL for a film card.
// Strategy:
//   1) If TMDb returned a providers.link (a deep JustWatch URL to the exact title),
//      use it. Best UX, lands on the right page.
//   2) Otherwise, use TMDb's own /watch?locale=XX page — always exists, shows
//      providers in the user's country, no 404. Better than a JustWatch search.
function watchUrl({ providersLink, mediaType, tmdbId, country }) {
  if (providersLink) return providersLink;
  const c = (country || "US").toUpperCase();
  const path = mediaType === "tv" ? "tv" : "movie";
  return `https://www.themoviedb.org/${path}/${tmdbId}/watch?locale=${c}`;
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
  const mediaParam = (url.searchParams.get("media") || "movie").toLowerCase();
  const media = mediaParam === "tv" ? "tv" : "movie";
  const M = mediaApi(media);
  const exclude = (url.searchParams.get("exclude") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n));
  const excludeSet = new Set(exclude);
  const liked = (url.searchParams.get("liked") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n)).slice(0, 30);
  const disliked = (url.searchParams.get("disliked") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n)).slice(0, 30);
  const mood    = decodeMood(moodB64);

  if (!env.TMDB_API_KEY) {
    return { error: "config", message: "TMDB_API_KEY not set" };
  }

  // 1. Get candidate pool from TMDb /discover (multi-page if discoverable)
  const candidates = await discoverByMood(env, mood, lang, media);

  // 1b. Merge mood-matched editorial list seeds into the candidate pool.
  const matched = matchLists(mood, media);
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
  const extraFromLists = (await Promise.all(missingListIds.slice(0, 4).map(id =>
    M.details(env, id, lang).then(d => ({
      id: d.id,
      title: M.titleOf(d),
      release_date: M.dateOf(d),
      vote_average: d.vote_average,
      vote_count: d.vote_count,
      popularity: d.popularity,
      genre_ids: (d.genres || []).map(g => g.id),
      genres: (d.genres || []).map(g => g.name?.toLowerCase()),
      poster_path: d.poster_path,
      overview: d.overview,
      runtime: d.runtime || (d.episode_run_time && d.episode_run_time[0]) || null,
      _list: listIds.get(id) || null,
      _listOnly: true,
      _media: media,
    })).catch(() => null)
  ))).filter(f => {
    if (!f) return false;
    if (f.release_date && f.release_date > today) return false;
    if (media === "movie") {
      if (mood.runtime === "short" && f.runtime && f.runtime > 95) return false;
      if (mood.runtime === "medium" && f.runtime && (f.runtime < 85 || f.runtime > 130)) return false;
    }
    return true;
  });

  const allCandidates = [
    ...candidates.map(c => ({ ...c, _list: listIds.get(c.id) || null })),
    ...extraFromLists,
  ];

  // 2. If LB user provided, fetch their watchlist as TMDb IDs.
  // Letterboxd is movies only — skip for TV requests.
  // Strategy: never use as a hard filter (intersection can be empty for niche moods).
  // Instead: (a) prefer pool items that are in the watchlist, (b) inject high-fit
  // watchlist items the discover pool didn't surface, (c) fall through gracefully.
  let pool = allCandidates;
  let lbUsed = false;
  let watchlistIds = null;
  if (user && media === "movie") {
    if (/^[a-z0-9_-]{1,30}$/.test(user)) {
      try {
        const wlIds = await fetchWatchlistTmdbIds(env, user);
        if (wlIds && wlIds.size > 0) {
          watchlistIds = wlIds;
          lbUsed = true;
          // Inject watchlist items not already in the pool (cap to 24 random
          // picks so we don't blow up TMDb details calls). They'll be scored
          // alongside everything else; if they fit the mood they'll surface.
          const have = new Set(allCandidates.map(c => c.id));
          const missing = [...wlIds].filter(id => !have.has(id) && !excludeSet.has(id));
          for (let i = missing.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [missing[i], missing[j]] = [missing[j], missing[i]];
          }
          const extraFromWl = (await Promise.all(missing.slice(0, 8).map(id =>
            M.details(env, id, lang).then(d => ({
              id: d.id,
              title: M.titleOf(d),
              release_date: M.dateOf(d),
              vote_average: d.vote_average,
              vote_count: d.vote_count,
              popularity: d.popularity,
              genre_ids: (d.genres || []).map(g => g.id),
              genres: (d.genres || []).map(g => g.name?.toLowerCase()),
              poster_path: d.poster_path,
              overview: d.overview,
              runtime: d.runtime || null,
              original_language: d.original_language,
              _list: null,
              _listOnly: true,
              _media: media,
            })).catch(() => null)
          ))).filter(Boolean);
          pool = [...allCandidates, ...extraFromWl];
        }
      } catch (e) {
        console.log("LB fail:", e?.message);
      }
    }
  }

  // Drop excluded ids (re-roll case) and future releases
  pool = pool.filter(f => !excludeSet.has(f.id) && (!f.release_date || f.release_date <= today));

  // 2b. Taste signal from local feedback (liked/disliked)
  // - liked → fetch /similar + /recommendations of recent likes, build boost set
  // - disliked → tally dominant genres + decade + language, build penalty profile
  const likeBoostSet = new Set();
  if (liked.length) {
    const likeSeeds = liked.slice(-3); // last 3 likes (was 6, halved to save subrequests)
    const sims = await Promise.all(likeSeeds.flatMap(id => [
      tmdbSimilar(env, id, media).catch(() => []),
      tmdbRecommendations(env, id, media).catch(() => []),
    ]));
    // Films appearing in ≥2 seed sources get the strong boost; ≥1 gets soft
    const counts = new Map();
    for (const arr of sims) for (const id of arr) counts.set(id, (counts.get(id) || 0) + 1);
    for (const [id, n] of counts) if (n >= 1) likeBoostSet.add(id);
    // Don't recommend things they already liked back
    for (const id of liked) excludeSet.add(id);
  }
  const dislikedSet = new Set(disliked);
  // Penalty signal: fetch genres of disliked items (cached). Tally top genres.
  let dislikeGenres = new Set();
  let dislikeLangs  = new Set();
  if (disliked.length) {
    const details = await Promise.all(disliked.slice(-5).map(id =>
      M.details(env, id, lang).catch(() => null)
    ));
    const gCount = new Map(), lCount = new Map();
    for (const d of details) {
      if (!d) continue;
      for (const g of (d.genres || [])) gCount.set(g.id, (gCount.get(g.id) || 0) + 1);
      if (d.original_language) lCount.set(d.original_language, (lCount.get(d.original_language) || 0) + 1);
    }
    // Genre is "dominant" if it shows up in ≥3 dislikes
    for (const [gid, n] of gCount) if (n >= 3) dislikeGenres.add(gid);
    for (const [lc, n]  of lCount) if (n >= 3) dislikeLangs.add(lc);
    // Always exclude already-disliked
    for (const id of disliked) excludeSet.add(id);
  }
  // Re-apply exclude after taste signals
  pool = pool.filter(f => !excludeSet.has(f.id));

  // 3. Score with curated + list boost + taste signals
  const ranked = pool.map(f => {
    const cur = M.curatedFor(f.id);
    const listName = f._list;
    const likeBoost = likeBoostSet.has(f.id) ? 4 : 0;
    const wlBoost = (watchlistIds && watchlistIds.has(f.id)) ? 5 : 0;
    const genreOverlap = (f.genre_ids || []).some(g => dislikeGenres.has(g)) ? -3 : 0;
    const langPenalty  = f.original_language && dislikeLangs.has(f.original_language) ? -2 : 0;
    const score =
      (f.vote_average || (f._listOnly ? 7 : 0)) * 1.5 +
      Math.min((f.popularity || 0) / 35, 3.2) +
      fitScore(f, mood) +
      (cur ? 6 : 0) +
      (listName ? 3 : 0) +
      likeBoost +
      wlBoost +
      genreOverlap +
      langPenalty -
      (mood.popularity === "low" ? Math.min((f.popularity || 0) / 42, 3) : 0) +
      (Math.random() * 0.9);
    return { ...f, _score: score, _curated: cur || null, _list: listName, _likeBoost: likeBoost > 0, _fromWatchlist: wlBoost > 0 };
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
  const enrichedPool = await Promise.all(top.slice(0, 6).map(async (f) => {
    const [providers, credits, details] = await Promise.all([
      M.providers(env, f.id, country),
      M.credits(env, f.id),
      M.details(env, f.id, lang),
    ]);
    const title = f.title || M.titleOf(details);
    const date = f.release_date || M.dateOf(details);
    const runtime = (media === "tv")
      ? (details.episode_run_time && details.episode_run_time[0]) || f.runtime || null
      : (details.runtime || f.runtime || null);
    return {
      id: f.id,
      title,
      year: (date || "").slice(0, 4),
      director: credits.director || null,
      runtime,
      genres: f.genres || (details.genres || []).map(g => g.name?.toLowerCase()),
      poster: (f.poster_path || details.poster_path) ? `${tmdbImageBase()}w342${f.poster_path || details.poster_path}` : null,
      overview: f.overview || details.overview || null,
      justwatch: watchUrl({ providersLink: providers.link, mediaType: media, tmdbId: f.id, country }),
      tmdb: M.tmdbUrl(f.id),
      curated_note: f._curated?.note || null,
      from_list: f._list || null,
      from_feedback: !!f._likeBoost,
      media,
    };
  }));

  const enriched = enrichedPool.filter(f => {
    if (media === "movie") {
      if (mood.runtime === "short" && f.runtime && f.runtime > 95) return false;
      if (mood.runtime === "medium" && f.runtime && (f.runtime < 85 || f.runtime > 130)) return false;
      if (mood.runtime === "long" && f.runtime && f.runtime < 110) return false;
    }
    return true;
  }).slice(0, 4);

  const matchedLists = matched.map(m => m.list.name);
  if (lbUsed) {
    const wlLabel = lang === "es-ES" ? "tu watchlist de Letterboxd" : "your Letterboxd watchlist";
    matchedLists.unshift(wlLabel);
  }

  return { films: enriched, lb_used: lbUsed, why: moodSummary(mood, lang), matched_lists: matchedLists, media };
}

async function surprise(req, env, ctx) {
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") || "US").toUpperCase();
  const lang    = (url.searchParams.get("lang") || "en").startsWith("es") ? "es-ES" : "en-US";
  const profile = (url.searchParams.get("profile") || "quality").toLowerCase();
  const mediaParam = (url.searchParams.get("media") || "movie").toLowerCase();
  const media = mediaParam === "tv" ? "tv" : "movie";
  const M = mediaApi(media);
  const surpriseMood = surpriseMoodForProfile(profile);
  const exclude = (url.searchParams.get("exclude") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n));
  const excludeSet = new Set(exclude);

  if (!env.TMDB_API_KEY) return { error: "config" };

  // Random pages of TMDb top-rated, with quality floor
  const today = new Date().toISOString().slice(0, 10);
  const sorts = ["vote_average.desc", "popularity.desc"];
  const pages = [];
  for (let i = 0; i < 6; i++) {
    pages.push({
      sort_by: sorts[Math.floor(Math.random() * sorts.length)],
      page: 1 + Math.floor(Math.random() * 25),
    });
  }

  const dateKey = media === "tv" ? "first_air_date" : "primary_release_date";
  const baseParams = {
    "vote_count.gte": profile === "weird" ? 80 : 800,
    "vote_average.gte": profile === "pace" ? 6.3 : 6.8,
    [`${dateKey}.lte`]: today,
    include_adult: "false",
  };
  if (media === "movie") baseParams["with_runtime.gte"] = 75;
  if (profile === "short" && media === "movie") baseParams["with_runtime.lte"] = 95;
  if (profile === "weird") baseParams["vote_count.lte"] = 1500;
  if (profile === "classic") baseParams[`${dateKey}.lte`] = "1979-12-31";
  if (profile === "horror") baseParams.with_genres = media === "tv" ? "9648" : "27|53|9648";
  if (profile === "pace") baseParams.with_genres = media === "tv" ? "10759" : "28|12|53";
  if (profile === "hurt") baseParams["vote_count.gte"] = 120;

  const fetches = pages.map(p =>
    M.discover(env, { ...baseParams, ...p }, lang).catch(() => ({ results: [] }))
  );
  const all = await Promise.all(fetches);
  let pool = all.flatMap(r => (r.results || []).map(x => media === "tv"
    ? { ...x, title: x.name || x.title, release_date: x.first_air_date || x.release_date, _media: "tv" }
    : { ...x, _media: "movie" }
  ));

  const matched = matchLists(surpriseMood, media);
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
    M.details(env, id, lang).then(d => ({
      id: d.id,
      title: M.titleOf(d),
      release_date: M.dateOf(d),
      vote_average: d.vote_average,
      vote_count: d.vote_count,
      popularity: d.popularity,
      genre_ids: (d.genres || []).map(g => g.id),
      genres: (d.genres || []).map(g => g.name?.toLowerCase()),
      poster_path: d.poster_path,
      overview: d.overview,
      runtime: d.runtime || (d.episode_run_time && d.episode_run_time[0]) || null,
      _list: listIds.get(id) || null,
      _media: media,
    })).catch(() => null)
  ))).filter(f => {
    if (!f) return false;
    if (f.release_date && f.release_date > today) return false;
    if (media === "movie") {
      if (f.runtime && f.runtime < 75) return false;
      if (profile === "short" && f.runtime && f.runtime > 95) return false;
    }
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
    if (media === "movie" && profile === "short" && f.runtime && f.runtime > 95) return false;
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
      (M.curatedFor(f.id) ? 4 : 0) +
      (Math.random() * 1.2),
  })).sort((a, b) => b._score - a._score);
  const listed = pool.filter(f => f._list);
  const unlisted = pool.filter(f => !f._list);
  const top = listed.length >= 6 ? listed.slice(0, 7) : [...listed, ...unlisted].slice(0, 8);

  const enrichedRaw = await Promise.all(top.map(async (f) => {
    const [providers, credits, details] = await Promise.all([
      M.providers(env, f.id, country),
      M.credits(env, f.id),
      M.details(env, f.id, lang),
    ]);
    const cur = M.curatedFor(f.id);
    const title = f.title || M.titleOf(details);
    const date = f.release_date || M.dateOf(details);
    const runtime = media === "tv"
      ? (details.episode_run_time && details.episode_run_time[0]) || f.runtime || null
      : (details.runtime || f.runtime || null);
    return {
      id: f.id,
      title,
      year: (date || "").slice(0, 4),
      director: credits.director || null,
      runtime,
      genres: f.genres || (details.genres || []).map(g => g.name),
      poster: f.poster_path ? `${tmdbImageBase()}w342${f.poster_path}` : null,
      overview: f.overview || null,
      justwatch: watchUrl({ providersLink: providers.link, mediaType: media, tmdbId: f.id, country }),
      tmdb: M.tmdbUrl(f.id),
      curated_note: cur?.note || null,
      from_list: f._list || null,
      from_feedback: !!f._likeBoost,
      media,
    };
  }));

  const enriched = enrichedRaw.filter(f => {
    if (media === "movie" && profile === "short" && f.runtime && f.runtime > 95) return false;
    return true;
  }).slice(0, 4);

  return { films: enriched, mode: "surprise", profile, why: moodSummary(surpriseMood, lang), matched_lists: matched.map(m => m.list.name), media };
}
async function alt(req, env) {
  const url = new URL(req.url);
  const seed = parseInt(url.searchParams.get("seed") || "0", 10);
  const kind = url.searchParams.get("kind") === "opposite" ? "opposite" : "similar";
  const country = (url.searchParams.get("country") || "US").toUpperCase();
  const lang    = (url.searchParams.get("lang") || "en").startsWith("es") ? "es-ES" : "en-US";
  const mediaParam = (url.searchParams.get("media") || "movie").toLowerCase();
  const media = mediaParam === "tv" ? "tv" : "movie";
  const M = mediaApi(media);
  const exclude = (url.searchParams.get("exclude") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n));
  const excludeSet = new Set(exclude);
  excludeSet.add(seed);

  if (!Number.isFinite(seed) || seed <= 0) return { error: "bad_seed", status: 400 };
  if (!env.TMDB_API_KEY) return { error: "config", status: 500 };

  let candidateIds = [];

  if (kind === "similar") {
    const [sims, recs] = await Promise.all([
      tmdbSimilar(env, seed, media).catch(() => []),
      tmdbRecommendations(env, seed, media).catch(() => []),
    ]);
    const tally = new Map();
    for (const id of sims) tally.set(id, (tally.get(id) || 0) + 1);
    for (const id of recs) tally.set(id, (tally.get(id) || 0) + 2);
    candidateIds = [...tally.entries()]
      .filter(([id]) => !excludeSet.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([id]) => id);
  } else {
    const seedDetails = await M.details(env, seed, lang).catch(() => null);
    const seedGenres = (seedDetails?.genres || []).map(g => g.id);
    const without = seedGenres.length ? seedGenres.join(",") : "";
    const today = new Date().toISOString().slice(0, 10);
    const sortBy = ["vote_average.desc", "popularity.desc"][Math.floor(Math.random() * 2)];
    const page   = 1 + Math.floor(Math.random() * 10);
    const dateKey = media === "tv" ? "first_air_date" : "primary_release_date";
    const params = {
      sort_by: sortBy,
      page,
      "vote_count.gte": 400,
      "vote_average.gte": 6.6,
      [`${dateKey}.lte`]: today,
      include_adult: "false",
      ...(without ? { without_genres: without } : {}),
    };
    if (media === "movie") params["with_runtime.gte"] = 75;
    const data = await M.discover(env, params, lang).catch(() => ({ results: [] }));
    candidateIds = (data.results || [])
      .map(r => r.id)
      .filter(id => !excludeSet.has(id))
      .slice(0, 12);
  }

  if (!candidateIds.length) return { error: "no_alt", status: 404 };

  for (const id of candidateIds) {
    try {
      const [details, providers, credits] = await Promise.all([
        M.details(env, id, lang),
        M.providers(env, id, country),
        M.credits(env, id),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const date = M.dateOf(details);
      if (date && date > today) continue;
      const title = M.titleOf(details);
      const runtime = media === "tv"
        ? (details.episode_run_time && details.episode_run_time[0]) || null
        : (details.runtime || null);
      const film = {
        id: details.id,
        title,
        year: (date || "").slice(0, 4),
        director: credits.director || null,
        runtime,
        genres: (details.genres || []).map(g => g.name?.toLowerCase()),
        poster: details.poster_path ? `${tmdbImageBase()}w342${details.poster_path}` : null,
        overview: details.overview || null,
        justwatch: watchUrl({ providersLink: providers.link, mediaType: media, tmdbId: details.id, country }),
        tmdb: M.tmdbUrl(details.id),
        curated_note: M.curatedFor(details.id)?.note || null,
        from_list: null,
        from_feedback: kind === "similar",
        media,
      };
      return { film, kind };
    } catch (e) {
      continue;
    }
  }
  return { error: "no_alt", status: 404 };
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

    if (url.pathname === "/alt") {
      try {
        const out = await alt(req, env);
        if (out.error) return json(out, { status: out.status || 500 }, cors);
        return json(out, {}, cors);
      } catch (e) {
        console.log("alt err:", e?.stack || e);
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
