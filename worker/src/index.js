// moodwatch-api · Cloudflare Worker
// Endpoint: GET /recommend?country=CL&lang=es&mood=<base64json>&user=<lb_user>?
// Returns:  { films: [{title, year, director, runtime, genres, poster, justwatch, tmdb, curated_note?}] }

import { discoverByMood } from "./mood.js";
import { tmdbDetails, tmdbProviders, tmdbCredits, tmdbImageBase } from "./tmdb.js";
import { fetchWatchlistTmdbIds } from "./letterboxd.js";
import { CURATED, curatedFor } from "./curated.js";

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
  if (film.providers_link) return film.providers_link;
  const c = (country || "us").toLowerCase();
  const q = encodeURIComponent(film.title || "");
  return `https://www.justwatch.com/${c}/search?q=${q}`;
}

async function recommend(req, env, ctx) {
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") || "US").toUpperCase();
  const lang    = (url.searchParams.get("lang") || "en").startsWith("es") ? "es-ES" : "en-US";
  const moodB64 = url.searchParams.get("mood") || "";
  const user    = (url.searchParams.get("user") || "").trim().toLowerCase();
  const mood    = decodeMood(moodB64);

  if (!env.TMDB_API_KEY) {
    return { error: "config", message: "TMDB_API_KEY not set" };
  }

  // 1. Get candidate pool from TMDb /discover (multi-page if discoverable)
  const candidates = await discoverByMood(env, mood, lang);
  // candidates: [{id,title,...,vote_average,vote_count,popularity,genre_ids,release_date,poster_path}]

  // 2. If LB user provided, intersect with their watchlist TMDb IDs
  let pool = candidates;
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
      const filtered = candidates.filter(f => wlIds.has(f.id));
      if (filtered.length >= 3) { pool = filtered; lbUsed = true; }
      // else: silently fallback to global pool
    } catch (e) {
      // scraper hiccup — fallback to global
      console.log("LB fail:", e?.message);
    }
  }

  // 3. Curated boost: if a candidate is in CURATED, lift its score
  const ranked = pool.map(f => {
    const cur = curatedFor(f.id);
    const score =
      (f.vote_average || 0) * 1.5 +
      Math.min((f.popularity || 0) / 30, 4) +
      (cur ? 6 : 0) -
      // small-gem bias if user asked for obscure
      (mood.popularity === "low" ? Math.min((f.popularity || 0) / 50, 2) : 0);
    return { ...f, _score: score, _curated: cur || null };
  }).sort((a, b) => b._score - a._score).slice(0, 8);

  // 4. Enrich top picks with director + providers
  const top = ranked.slice(0, 4);
  const enriched = await Promise.all(top.map(async (f) => {
    const [providers, credits] = await Promise.all([
      tmdbProviders(env, f.id, country),
      tmdbCredits(env, f.id),
    ]);
    return {
      id: f.id,
      title: f.title,
      year: (f.release_date || "").slice(0, 4),
      director: credits.director || null,
      runtime: f.runtime || null,
      genres: f.genres || [],
      poster: f.poster_path ? `${tmdbImageBase()}w342${f.poster_path}` : null,
      justwatch: justwatchUrl({ title: f.title, providers_link: providers.link }, country),
      tmdb: `https://www.themoviedb.org/movie/${f.id}`,
      curated_note: f._curated?.note || null,
    };
  }));

  return { films: enriched, lb_used: lbUsed };
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

    return json({ ok: true, name: "moodwatch-api" }, {}, cors);
  },
};
