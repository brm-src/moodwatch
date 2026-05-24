// moodwatch-api · Cloudflare Worker
// Endpoint: GET /recommend?country=CL&lang=es&mood=<base64json>&user=<lb_user>?
// Returns:  { films: [{title, year, director, runtime, genres, poster, justwatch, tmdb, curated_note?}] }

import { discoverByMood } from "./mood.js";
import { tmdbDetails, tmdbProviders, tmdbCredits, tmdbImageBase, tmdbDiscover } from "./tmdb.js";
import { fetchWatchlistTmdbIds, slugsToTmdbIds } from "./letterboxd.js";
import { CURATED, curatedFor } from "./curated.js";
import { LISTS, fetchListSlugs, matchLists } from "./lists.js";

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

  // 1b. Pull films from matching curated Letterboxd lists, fetch their TMDb data,
  // merge into pool. List films get marked _list = listName for soft boost.
  // Wrap whole block in timeout — if LB scrape is slow we proceed without it.
  const matched = matchLists(mood);
  const listIds = new Map();
  if (matched.length > 0) {
    const TIMEOUT_MS = 6000;
    const work = (async () => {
      const allListSlugs = await Promise.all(
        matched.slice(0, 2).map(m => fetchListSlugs(env, m.list, 1).catch(() => []))
      );
      for (let i = 0; i < allListSlugs.length; i++) {
        const slugs = allListSlugs[i].slice(0, 25); // small cap, KV-cached anyway
        const ids = await slugsToTmdbIds(env, slugs);
        for (const id of ids) {
          if (!listIds.has(id)) listIds.set(id, matched[i].list.name);
        }
      }
    })();
    try {
      await Promise.race([
        work,
        new Promise((_, rej) => setTimeout(() => rej(new Error("list-timeout")), TIMEOUT_MS)),
      ]);
    } catch (e) {
      console.log("lists skipped:", e?.message);
    }
  }

  // Don't fetch extra TMDb details for list-only ids — too expensive in worker.
  // Just tag candidates that are in matching lists.
  const allCandidates = candidates.map(c => ({
    ...c,
    _list: listIds.get(c.id) || null,
  }));

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

  // Drop excluded ids (re-roll case)
  pool = pool.filter(f => !excludeSet.has(f.id));

  // 3. Score with curated + list boost
  const ranked = pool.map(f => {
    const cur = curatedFor(f.id);
    const listName = f._list;
    const score =
      (f.vote_average || 0) * 1.5 +
      Math.min((f.popularity || 0) / 30, 4) +
      (cur ? 6 : 0) +
      (listName ? 2.5 : 0) -
      (mood.popularity === "low" ? Math.min((f.popularity || 0) / 50, 2) : 0);
    return { ...f, _score: score, _curated: cur || null, _list: listName };
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
      from_list: f._list || null,
    };
  }));

  return { films: enriched, lb_used: lbUsed };
}

async function surprise(req, env, ctx) {
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") || "US").toUpperCase();
  const lang    = (url.searchParams.get("lang") || "en").startsWith("es") ? "es-ES" : "en-US";
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
    "vote_count.gte": 800,
    "vote_average.gte": 6.8,
    "with_runtime.gte": 75,
    "primary_release_date.lte": today,
    include_adult: "false",
  };

  const fetches = pages.map(p =>
    tmdbDiscover(env, { ...baseParams, ...p }, lang).catch(() => ({ results: [] }))
  );
  const all = await Promise.all(fetches);
  let pool = all.flatMap(r => r.results || []);

  // De-dupe + drop excluded
  const seen = new Set();
  pool = pool.filter(f => {
    if (excludeSet.has(f.id)) return false;
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  // Shuffle + pick 4
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const top = pool.slice(0, 4);

  const enriched = await Promise.all(top.map(async (f) => {
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
      genres: (f.genre_ids || []).slice(0, 2),
      poster: f.poster_path ? `${tmdbImageBase()}w342${f.poster_path}` : null,
      justwatch: justwatchUrl({ title: f.title, providers_link: providers.link }, country),
      tmdb: `https://www.themoviedb.org/movie/${f.id}`,
      curated_note: cur?.note || null,
      from_list: null,
    };
  }));

  return { films: enriched, mode: "surprise" };
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

    return json({ ok: true, name: "moodwatch-api" }, {}, cors);
  },
};
