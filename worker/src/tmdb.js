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

export async function tmdbDetails(env, id, language) {
  return tmdbFetch(env, `/movie/${id}`, { language });
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

export async function tmdbCredits(env, id) {
  try {
    const data = await tmdbFetch(env, `/movie/${id}/credits`);
    const dir = (data.crew || []).find(c => c.job === "Director");
    return { director: dir?.name || null };
  } catch {
    return { director: null };
  }
}

export async function tmdbSimilar(env, id) {
  try {
    const data = await tmdbFetch(env, `/movie/${id}/similar`, { page: 1 });
    return (data.results || []).map(r => r.id).filter(Boolean);
  } catch { return []; }
}

export async function tmdbRecommendations(env, id) {
  try {
    const data = await tmdbFetch(env, `/movie/${id}/recommendations`, { page: 1 });
    return (data.results || []).map(r => r.id).filter(Boolean);
  } catch { return []; }
}

// Genre IDs (TMDb stable list)
export const GENRES = {
  action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
  documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
  horror: 27, music: 10402, mystery: 9648, romance: 10749,
  scifi: 878, tv_movie: 10770, thriller: 53, war: 10752, western: 37,
};
