// TMDb v3 client. All calls go through this so we can cache + add headers.

const BASE = "https://api.themoviedb.org/3";
const IMG  = "https://image.tmdb.org/t/p/";

export function tmdbImageBase() { return IMG; }

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
  return tmdbFetch(env, `/movie/${id}`, { language });
}

export async function tmdbDetailsTV(env, id, language) {
  return tmdbFetch(env, `/tv/${id}`, { language });
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
  // No native TV genres for: horror, thriller, romance, history, music
  // Mood logic that asks for these will fall back to drama/mystery on TV.
  horror: 9648,         // best-effort: mystery
  thriller: 9648,
  romance: 18,
  history: 18,
  music: 18,
};
