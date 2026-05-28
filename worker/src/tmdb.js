// TMDb v3 client. All calls go through this so we can cache + add headers.

const BASE = "https://api.themoviedb.org/3";
const IMG  = "https://image.tmdb.org/t/p/";

export function tmdbImageBase() { return IMG; }

// ─── Overview sanitizer ─────────────────────────────────────────────────────
// TMDb's overview field is community-edited and occasionally contains injected
// opinion or vandalism in the localized version (e.g. "Es una mierda de
// película!!" appended to The Devil Wears Prada). This is a defensive trim
// for the most common shapes; if it strips a legitimate ending, the worst case
// is a slightly shorter synopsis.
//   - Drops a trailing "Es una mierda…" / "es una basura…" / "horrible peli"
//     style opinion that some user appended.
//   - Drops a trailing exclamation-burst with subjective adjectives.
//   - Collapses repeated spaces left behind.
const VANDAL_TAIL_RE = new RegExp(
  // sentence boundary, then opinion noun phrase to end of string
  "(\\s+(?:es|está|son|fue|esto es|esta es|este es)\\s+(?:una?\\s+)?" +
  "(?:mierda|basura|porquería|horrible|patética|cagada|asco|caca|porqueria|" +
  "the worst|garbage|trash|awful|terrible|crap)" +
  "[^.!?]*[.!?]*\\s*)$",
  "i"
);
const STRAY_BURST_RE = /\s*[!]{2,}\s*$/;
const REVIEW_TAIL_RE = / \s*(?:1\/10|0\/10|10\/10|⭐+|👎+|👍+)\s*$/i;

export function sanitizeOverview(text) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  // Run vandal tail up to 3 times to catch stacked appends
  for (let i = 0; i < 3; i++) {
    const before = out;
    out = out.replace(VANDAL_TAIL_RE, "");
    out = out.replace(STRAY_BURST_RE, ".");
    out = out.replace(REVIEW_TAIL_RE, "");
    if (out === before) break;
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

// ─── Genre name localization ────────────────────────────────────────────────
// TMDb returns genres on /details in the language of that fetch. Surprise + alt
// fetch details with "en-US" (for title rules) so genres come back in English
// while the recommend path uses the user's lang. Result: mixed-language genre
// chips on the same screen. Fix: derive genre names from a static ID map keyed
// by user's lang. IDs are stable across TMDb. Movie + TV unified here.
const GENRE_NAMES = {
  // Movie genres
  28:    { en: "action",          es: "acción" },
  12:    { en: "adventure",       es: "aventura" },
  16:    { en: "animation",       es: "animación" },
  35:    { en: "comedy",          es: "comedia" },
  80:    { en: "crime",           es: "crimen" },
  99:    { en: "documentary",     es: "documental" },
  18:    { en: "drama",           es: "drama" },
  10751: { en: "family",          es: "familia" },
  14:    { en: "fantasy",         es: "fantasía" },
  36:    { en: "history",         es: "historia" },
  27:    { en: "horror",          es: "terror" },
  10402: { en: "music",           es: "música" },
  9648:  { en: "mystery",         es: "misterio" },
  10749: { en: "romance",         es: "romance" },
  878:   { en: "science fiction", es: "ciencia ficción" },
  10770: { en: "tv movie",        es: "telefilme" },
  53:    { en: "thriller",        es: "suspenso" },
  10752: { en: "war",             es: "bélico" },
  37:    { en: "western",          es: "western" },
  // TV genres (overlap with movie where ID matches)
  10759: { en: "action & adventure", es: "acción y aventura" },
  10762: { en: "kids",            es: "infantil" },
  10763: { en: "news",            es: "noticias" },
  10764: { en: "reality",         es: "reality" },
  10765: { en: "sci-fi & fantasy",es: "ciencia ficción y fantasía" },
  10766: { en: "soap",            es: "telenovela" },
  10767: { en: "talk",            es: "talk show" },
  10768: { en: "war & politics",  es: "guerra y política" },
};

export function localizeGenres(input, lang) {
  // Accept either array of {id,name}, array of ids, or array of strings.
  const out = [];
  const target = lang === "es" ? "es" : "en";
  for (const g of (input || [])) {
    if (g == null) continue;
    if (typeof g === "number") {
      const m = GENRE_NAMES[g];
      if (m) out.push(m[target]);
    } else if (typeof g === "string") {
      // already a name — try to localize via reverse lookup; fall back to lower-case
      const lc = g.toLowerCase().trim();
      if (target === "en") { out.push(lc); continue; }
      let mapped = null;
      for (const m of Object.values(GENRE_NAMES)) {
        if (m.en === lc || m.es === lc) { mapped = m[target]; break; }
      }
      out.push(mapped || lc);
    } else if (g && typeof g === "object") {
      const id = g.id;
      const m = id != null ? GENRE_NAMES[id] : null;
      if (m) { out.push(m[target]); continue; }
      const name = g.name;
      if (typeof name === "string") {
        const lc = name.toLowerCase().trim();
        if (target === "en") { out.push(lc); continue; }
        let mapped = null;
        for (const mm of Object.values(GENRE_NAMES)) {
          if (mm.en === lc || mm.es === lc) { mapped = mm[target]; break; }
        }
        out.push(mapped || lc);
      }
    }
  }
  // Final pass: alias short forms TMDb sometimes returns or our own internal tags use.
  const ALIASES = {
    en: { "scifi": "science fiction", "sci-fi": "science fiction" },
    es: { "scifi": "ciencia ficción", "sci-fi": "ciencia ficción", "ficción": "ciencia ficción" },
  };
  const al = ALIASES[target];
  return [...new Set(out.map(g => al[g] || g))];
}

async function tmdbFetch(env, path, params = {}, opts = {}) {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  // Edge cache (15 min for most, 7d for static-ish, skip if opts.fresh)
  const ttl = opts.fresh ? 0 :
    (path.includes("/credits") || path.includes("/watch/providers") ? 86400 * 7 : 900);
  const init = ttl > 0
    ? { cf: { cacheTtl: ttl, cacheEverything: true } }
    : { cache: "no-store" };
  const r = await fetch(url, init);
  if (!r.ok) {
    throw new Error(`TMDb ${path} → ${r.status}`);
  }
  return r.json();
}

export async function tmdbDiscover(env, params, language, opts = {}) {
  return tmdbFetch(env, "/discover/movie", { ...params, language }, opts);
}

export async function tmdbDiscoverTV(env, params, language, opts = {}) {
  return tmdbFetch(env, "/discover/tv", { ...params, language }, opts);
}

export async function tmdbDetails(env, id, language) {
  return tmdbFetch(env, `/movie/${id}`, { language, append_to_response: "external_ids" });
}

export async function tmdbDetailsTV(env, id, language) {
  return tmdbFetch(env, `/tv/${id}`, { language, append_to_response: "external_ids" });
}

export async function tmdbProviders(env, id, country) {
  try {
    const data = await tmdbFetch(env, `/movie/${id}/watch/providers`);
    const r = data.results?.[country] || {};
    return { link: r.link || null, flatrate: r.flatrate || [], rent: r.rent || [], buy: r.buy || [] };
  } catch {
    return { link: null, flatrate: [], rent: [], buy: [] };
  }
}

export async function tmdbProvidersTV(env, id, country) {
  try {
    const data = await tmdbFetch(env, `/tv/${id}/watch/providers`);
    const r = data.results?.[country] || {};
    return { link: r.link || null, flatrate: r.flatrate || [], rent: r.rent || [], buy: r.buy || [] };
  } catch {
    return { link: null, flatrate: [], rent: [], buy: [] };
  }
}

export async function tmdbCredits(env, id) {
  try {
    const data = await tmdbFetch(env, `/movie/${id}/credits`);
    const dir = (data.crew || []).find(c => c.job === "Director");
    return { director: dir?.name || null };
  } catch {
    return { director: null };
  }
}

export async function tmdbCreditsTV(env, id) {
  try {
    const data = await tmdbFetch(env, `/tv/${id}/credits`);
    // For TV, "director" maps to created_by (showrunner) — fall back to first crew creator
    const aggData = await tmdbFetch(env, `/tv/${id}`).catch(() => null);
    const creators = (aggData?.created_by || []).map(c => c.name).filter(Boolean);
    if (creators.length) return { director: creators.slice(0, 2).join(", ") };
    const dir = (data.crew || []).find(c => c.job === "Director" || c.department === "Directing");
    return { director: dir?.name || null };
  } catch {
    return { director: null };
  }
}

export async function tmdbSimilar(env, id, media = "movie") {
  try {
    const data = await tmdbFetch(env, `/${media}/${id}/similar`, { page: 1 });
    return (data.results || []).map(r => r.id).filter(Boolean);
  } catch { return []; }
}

export async function tmdbRecommendations(env, id, media = "movie") {
  try {
    const data = await tmdbFetch(env, `/${media}/${id}/recommendations`, { page: 1 });
    return (data.results || []).map(r => r.id).filter(Boolean);
  } catch { return []; }
}

// Genre IDs (TMDb stable list — movie genres)
export const GENRES = {
  action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
  documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
  horror: 27, music: 10402, mystery: 9648, romance: 10749,
  scifi: 878, tv_movie: 10770, thriller: 53, war: 10752, western: 37,
};

// TMDb TV genre IDs. Different list from movies — no thriller/horror/romance/etc.
// We map to movie-like aliases where possible so mood logic keeps working.
export const TV_GENRES = {
  action: 10759,        // Action & Adventure (combined on TV)
  adventure: 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  kids: 10762,
  mystery: 9648,
  news: 10763,
  reality: 10764,
  scifi: 10765,         // Sci-Fi & Fantasy (combined on TV)
  fantasy: 10765,
  soap: 10766,
  talk: 10767,
  war: 10768,           // War & Politics
  western: 37,
  // No native TV genres for: horror, thriller, romance, history, music.
  // QA #3: when these aliases collided (drama=romance=history=music=18) and
  // /discover results were reverse-looked-up by ID, the LAST key set won and
  // tagged dramas as "music". So we DON'T alias collisions here; instead the
  // mood layer handles soft mapping (e.g. trust=horror on TV → mystery + drama).
  horror: 9648,         // best-effort: mystery (kept; QA shows results still relevant)
  thriller: 9648,
};
