// Mood object → TMDb /discover params, then fetch a candidate pool.
// Mood object shape (all optional, from frontend ritualToMood):
// { tone, energy, risk, company, popularity, quality, runtime,
//   language_pref, decade, first_act, fear:?, exclude:[], avoid, trust,
//   phrase }

import { tmdbDiscover, tmdbDiscoverTV, GENRES, TV_GENRES } from "./tmdb.js";

// Genre presets per axis. Multiple axes combine via union (with_genres OR-ed in TMDb).
function genreSet(mood, media = "movie") {
  const G = media === "tv" ? TV_GENRES : GENRES;
  const inc = new Set();
  const exc = new Set();

  // tone
  if (mood.tone === "dark") {
    [G.thriller, G.mystery, G.crime, G.drama, G.horror].forEach(x => inc.add(x));
  } else if (mood.tone === "light") {
    [G.comedy, G.romance, G.adventure, G.family, G.animation, G.fantasy].forEach(x => inc.add(x));
  }

  // energy
  if (mood.energy === "engage") {
    [G.thriller, G.action, G.mystery].forEach(x => inc.add(x));
  } else if (mood.energy === "unwind") {
    [G.comedy, G.romance, G.drama, G.family, G.animation].forEach(x => inc.add(x));
  }

  // first_act bucket
  if (mood.first_act === "fantasy_scifi") {
    [G.fantasy, G.scifi].forEach(x => inc.add(x));
  } else if (mood.first_act === "drama_romance") {
    [G.drama, G.romance].forEach(x => inc.add(x));
  } else if (mood.first_act === "thriller_horror") {
    [G.thriller, G.horror, G.mystery].forEach(x => inc.add(x));
  } else if (mood.first_act === "action_adventure") {
    [G.action, G.adventure].forEach(x => inc.add(x));
  }

  // trust (boost specific genres)
  const trustMap = {
    drama: G.drama, thriller: G.thriller, horror: G.horror,
    comedy: G.comedy, animation: G.animation,
    weird: null, // no clean genre, handled by lower vote_count
  };
  if (mood.trust && trustMap[mood.trust]) inc.add(trustMap[mood.trust]);

  // avoid (without_genres)
  if (mood.avoid === "violence")  { exc.add(G.horror); exc.add(G.war); }
  if (mood.avoid === "romance")   { exc.add(G.romance); }
  if (mood.avoid === "slow")      { exc.add(G.documentary); }

  // explicit exclude bucket from frontend
  if (Array.isArray(mood.exclude)) {
    if (mood.exclude.includes("horror_extreme")) exc.add(G.horror);
    if (mood.exclude.includes("heavy_drama")) exc.add(G.war);
  }

  // remove genres that are in exc
  for (const g of exc) inc.delete(g);

  return { with_genres: [...inc].join("|"), without_genres: [...exc].join(",") };
}

function runtimeRange(mood) {
  const m = mood.runtime;
  // user-asked runtime overrides default min of 75
  if (m === "short")  return { "with_runtime.gte": 75, "with_runtime.lte": 90 };
  if (m === "medium") return { "with_runtime.gte": 90, "with_runtime.lte": 120 };
  if (m === "long")   return { "with_runtime.gte": 120, "with_runtime.lte": 180 };
  if (m === "epic")   return { "with_runtime.gte": 150 };
  return {};
}

function dateRange(mood, media = "movie") {
  const d = mood.decade;
  const k = media === "tv" ? "first_air_date" : "primary_release_date";
  if (d === "old")    return { [`${k}.lte`]: "1969-12-31" };
  if (d === "70s80s") return { [`${k}.gte`]: "1970-01-01", [`${k}.lte`]: "1989-12-31" };
  if (d === "90s00s") return { [`${k}.gte`]: "1990-01-01", [`${k}.lte`]: "2009-12-31" };
  if (d === "now")    return { [`${k}.gte`]: "2010-01-01" };
  // legacy values still supported
  if (d === "70s")    return { [`${k}.gte`]: "1970-01-01", [`${k}.lte`]: "1979-12-31" };
  if (d === "90s")    return { [`${k}.gte`]: "1990-01-01", [`${k}.lte`]: "1999-12-31" };
  if (d === "00s")    return { [`${k}.gte`]: "2000-01-01", [`${k}.lte`]: "2009-12-31" };
  return {};
}

function languagePref(mood) {
  const m = mood.language_pref;
  if (m === "spanish")  return { with_original_language: "es" };
  if (m === "english")  return { with_original_language: "en" };
  if (m === "asian")    return { with_original_language: "ja|ko|zh" };
  if (m === "european") return { with_original_language: "fr|it|de|sv|da|no|fi|nl|pt|cs|hu|pl" };
  return {};
}

function voteFilters(mood) {
  const out = {};
  // popularity / rewatch_taste
  if (mood.popularity === "high") out["vote_count.gte"] = 1000;
  if (mood.popularity === "low")  out["vote_count.gte"] = 100; // cap below
  if (mood.popularity === "low")  out["vote_count.lte"] = 1500;
  // depth → quality floor (also shapes vote_count: thoughtful → less mainstream)
  if (mood.depth === "thoughtful" || mood.depth === "uneasy" || mood.depth === "ruined") {
    out["vote_average.gte"] = 6.8;
    // override base 800 floor: pull in smaller films (250-1500 votes)
    out["vote_count.gte"] = 250;
    out["vote_count.lte"] = 1500;
  }
  if (mood.depth === "fun") {
    out["vote_average.gte"] = 6.0;
  }
  // temperature: cold = slow/contemplative (drop popularity floor)
  if (mood.temperature === "freezing" || mood.temperature === "cool") {
    out["vote_count.gte"] = Math.min(out["vote_count.gte"] || 9999, 200);
    out["vote_count.lte"] = Math.min(out["vote_count.lte"] || 9999, 1200);
  }
  // director_vibe
  if (mood.quality === "high") {
    out["vote_average.gte"] = Math.max(out["vote_average.gte"] || 0, 7.0);
  }
  // weird / risk_taste
  if (mood.trust === "weird") {
    out["vote_count.lte"] = 800;
    out["vote_count.gte"] = 80;
  }
  return out;
}

export async function discoverByMood(env, mood, language, media = "movie") {
  const today = new Date().toISOString().slice(0, 10);
  const isTV = media === "tv";
  const dateKey = isTV ? "first_air_date" : "primary_release_date";
  const baseParams = {
    "vote_count.gte": 500,
    "vote_average.gte": 6.5,
    [`${dateKey}.lte`]: today,
    include_adult: "false",
    ...genreSet(mood, media),
    ...(isTV ? {} : runtimeRange(mood)),
    ...(isTV ? {} : { "with_runtime.gte": 75 }),
    ...dateRange(mood, media),
    ...languagePref(mood),
    ...voteFilters(mood),
  };

  const discover = isTV ? tmdbDiscoverTV : tmdbDiscover;
  const fetches = [];
  // Strict pool: 12 pages × 2 sorts = up to 24 pages of mood-filtered hits.
  for (let p = 1; p <= 12; p++) {
    fetches.push(discover(env, { ...baseParams, sort_by: "vote_average.desc", page: p }, language).catch(() => ({ results: [] })));
    fetches.push(discover(env, { ...baseParams, sort_by: "popularity.desc",   page: p }, language).catch(() => ({ results: [] })));
  }
  // Loose query for diversity: drop runtime + drop vote_count floor hard.
  // Pulls in indies, festival picks, smaller foreign films.
  const looseParams = { ...baseParams };
  delete looseParams["with_runtime.gte"];
  delete looseParams["with_runtime.lte"];
  looseParams["vote_count.gte"] = Math.max(60, Math.floor((baseParams["vote_count.gte"] || 500) / 4));
  for (let p = 1; p <= 8; p++) {
    fetches.push(discover(env, { ...looseParams, sort_by: "vote_average.desc", page: p }, language).catch(() => ({ results: [] })));
    fetches.push(discover(env, { ...looseParams, sort_by: "popularity.desc",   page: p }, language).catch(() => ({ results: [] })));
  }
  // Wildcard: ignore mood genres entirely, just chase quality. Adds ~50 more
  // candidates that would never surface from the strict path. The scorer
  // filters them by mood fit anyway.
  const wildParams = {
    "vote_count.gte": 200,
    "vote_average.gte": 7.0,
    [`${dateKey}.lte`]: today,
    include_adult: "false",
    ...dateRange(mood, media),
    ...languagePref(mood),
  };
  for (let p = 1; p <= 4; p++) {
    fetches.push(discover(env, { ...wildParams, sort_by: "vote_average.desc", page: p }, language).catch(() => ({ results: [] })));
  }
  const all = await Promise.all(fetches);
  const results = all.flatMap(r => r.results || []);

  const seen = new Set();
  const dedup = [];
  for (const r of results) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    // Normalize TV shape to match movie shape used downstream
    if (isTV) {
      dedup.push({
        ...r,
        title: r.name || r.title,
        release_date: r.first_air_date || r.release_date,
        _media: "tv",
      });
    } else {
      dedup.push({ ...r, _media: "movie" });
    }
  }

  const G = isTV ? TV_GENRES : GENRES;
  const idToName = Object.fromEntries(Object.entries(G).map(([k, v]) => [v, k]));
  return dedup.map(r => ({
    ...r,
    genres: (r.genre_ids || []).map(id => idToName[id]).filter(Boolean),
  }));
}
