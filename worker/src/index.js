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
  const exclude = (url.searchParams.get("exclude") || "")
    .split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n));
  const excludeSet = new Set(exclude);
  const mood    = decodeMood(moodB64);

  if (!env.TMDB_API_KEY) {
    return { error: "config", message: "TMDB_API_KEY not set" };
  }

  // 1. Get candidate pool from TMDb /discover (multi-page if discoverable)
  const candidates = await discoverByMood(env, mood, lang);

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
    } catch (e) {
      console.log("LB fail:", e?.message);
    }
  }

  // Drop excluded ids (re-roll case)
  pool = pool.filter(f => !excludeSet.has(f.id));

  // 3. Score with curated boost
  const ranked = pool.map(f => {
    const cur = curatedFor(f.id);
    const score =
      (f.vote_average || 0) * 1.5 +
      Math.min((f.popularity || 0) / 30, 4) +
      (cur ? 6 : 0) -
      (mood.popularity === "low" ? Math.min((f.popularity || 0) / 50, 2) : 0);
    return { ...f, _score: score, _curated: cur || null };
  }).sort((a, b) => b._score - a._score);

  // Always pull every curated item that survived filters into the front of the pool
  const curatedHits = ranked.filter(f => f._curated);
  const otherHits   = ranked.filter(f => !f._curated);

  // Pick 4: 1 curated (if any) + 3 random from top 30 of the rest.
  // If no curated, 4 random from top 30.
  const TOP_N = Math.min(30, otherHits.length);
  const top30 = otherHits.slice(0, TOP_N);
  for (let i = top30.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [top30[i], top30[j]] = [top30[j], top30[i]];
  }

  let top = [];
  if (curatedHits.length > 0) {
    // randomize curated order too
    const curShuffled = [...curatedHits];
    for (let i = curShuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [curShuffled[i], curShuffled[j]] = [curShuffled[j], curShuffled[i]];
    }
    top.push(curShuffled[0]);
    top.push(...top30.slice(0, 3));
  } else {
    top = top30.slice(0, 4);
  }
  const enriched = await Promise.all(top.map(async (f) => {
    const [providers, credits, details] = await Promise.all([
      tmdbProviders(env, f.id, country),
      tmdbCredits(env, f.id),
      tmdbDetails(env, f.id, lang),
    ]);
    return {
      id: f.id,
      title: f.title,
      year: (f.release_date || "").slice(0, 4),
      director: credits.director || null,
      runtime: details.runtime || null,
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
