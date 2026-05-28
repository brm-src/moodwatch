// Mood object → TMDb /discover params, then fetch a candidate pool.
// Mood object shape (all optional, from frontend ritualToMood):
// { tone, energy, risk, company, popularity, quality, runtime,
//   language_pref, decade, first_act, fear:?, exclude:[], avoid, trust,
//   phrase }

import { tmdbDiscover, tmdbDiscoverTV, GENRES, TV_GENRES } from "./tmdb.js";

// Single source of truth for "what counts as a mood signal".
// Used by index.js (specificity gating) and scorer.js (density damp).
export const MOOD_AXES = [
  "tone","energy","depth","trust","first_act","appetite","decade",
  "language_pref","runtime","quality","popularity","company","risk","fear","avoid"
];
export function moodSpecificity(mood) {
  return MOOD_AXES.reduce((n, k) => n + (mood[k] && mood[k] !== "any" ? 1 : 0), 0);
}

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
    doc: G.documentary,
    weird: null, // no clean genre, handled by lower vote_count
  };
  if (mood.trust && trustMap[mood.trust]) inc.add(trustMap[mood.trust]);
  // TV horror has no native genre; the closest is mystery + sci-fi & fantasy.
  // Add fantasy as secondary so Stranger Things / Yellowjackets surface.
  if (mood.trust === "horror" && media === "tv") {
    inc.add(10765); // Sci-Fi & Fantasy combined on TV
  }
  // Erotic thriller → drama+thriller axis (no single TMDb genre fits).
  if (mood.trust === "erotic_thriller") {
    [G.thriller, G.drama].forEach(x => inc.add(x));
  }
  // Doc → exclude family/animation noise that creeps via tone=light defaults.
  if (mood.trust === "doc") {
    exc.add(G.family); exc.add(G.animation);
  }

  // avoid → hard without_genres + scoring penalty downstream.
  // violence: action, war, horror, crime, thriller out — hard exclusion.
  // romance: romance + family-romance fluff out.
  // slow: documentary + slower drama out (heuristic).
  // cliche: action blockbusters + popular genre tropes out.
  // weird: keep mainstream, drop horror/scifi-leaning weirdness.
  if (mood.avoid === "violence") {
    exc.add(G.horror); exc.add(G.war); exc.add(G.action); exc.add(G.crime); exc.add(G.thriller);
  }
  if (mood.avoid === "romance")   { exc.add(G.romance); }
  if (mood.avoid === "slow")      { exc.add(G.documentary); exc.add(G.history); }
  if (mood.avoid === "cliche")    { exc.add(G.action); }
  if (mood.avoid === "weird")     { exc.add(G.horror); exc.add(G.scifi); }

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
  if (m === "tiny")   return { "with_runtime.lte": 40 };
  if (m === "short")  return { "with_runtime.gte": 60, "with_runtime.lte": 100 };
  if (m === "medium") return { "with_runtime.gte": 90, "with_runtime.lte": 130 };
  if (m === "long")   return { "with_runtime.gte": 120, "with_runtime.lte": 200 };
  // "epic" = scope/tone, not duration. Bias via genres + scorer; no hard runtime cap.
  // (Many epics are 130-150min: Lawrence of Arabia is 218, but Mad Max Fury Road is 120.)
  if (m === "epic")   return {};
  return {};
}

function dateRange(mood, media = "movie") {
  const d = mood.decade;
  const k = media === "tv" ? "first_air_date" : "primary_release_date";
  if (d === "old")    return { [`${k}.lte`]: "1969-12-31" };
  if (d === "70s80s") return { [`${k}.gte`]: "1970-01-01", [`${k}.lte`]: "1989-12-31" };
  if (d === "90s00s") return { [`${k}.gte`]: "1990-01-01", [`${k}.lte`]: "2009-12-31" };
  if (d === "now")    return { [`${k}.gte`]: "2010-01-01" };
  if (d === "70s")    return { [`${k}.gte`]: "1970-01-01", [`${k}.lte`]: "1979-12-31" };
  if (d === "80s")    return { [`${k}.gte`]: "1980-01-01", [`${k}.lte`]: "1989-12-31" };
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
  // Short films are niche by nature — drop the 500-vote floor or pool is empty.
  if (mood.runtime === "short" || mood.runtime === "tiny") {
    out["vote_count.gte"] = 80;
  }
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
  // Pool depth: 5 pages × 2 sorts = 10 strict fetches.
  // Free Workers cap subrequests at 50/invocation. Budget:
  //   discover (this fn) ≤ 16, letterboxd ≤ 8, enrichment 6×3=18, misc ≤ 8 = 50.
  // Going from 3p→5p adds ~100 candidates (4 extra pages × 20 results), giving
  // the scorer a much larger pool to dig past popular canon.
  for (let p = 1; p <= 5; p++) {
    fetches.push(discover(env, { ...baseParams, sort_by: "vote_average.desc", page: p }, language).catch(() => ({ results: [] })));
    fetches.push(discover(env, { ...baseParams, sort_by: "popularity.desc",   page: p }, language).catch(() => ({ results: [] })));
  }
  // Loose query for diversity: drop runtime + drop vote_count floor hard.
  const looseParams = { ...baseParams };
  delete looseParams["with_runtime.gte"];
  delete looseParams["with_runtime.lte"];
  looseParams["vote_count.gte"] = Math.max(60, Math.floor((baseParams["vote_count.gte"] || 500) / 4));
  // 3 pages × 2 sorts = 6 fetches.
  for (let p = 1; p <= 3; p++) {
    fetches.push(discover(env, { ...looseParams, sort_by: "vote_average.desc", page: p }, language).catch(() => ({ results: [] })));
    fetches.push(discover(env, { ...looseParams, sort_by: "popularity.desc",   page: p }, language).catch(() => ({ results: [] })));
  }
  // Wildcard: 1 page (was 2).
  const wildParams = {
    "vote_count.gte": 200,
    "vote_average.gte": 7.0,
    [`${dateKey}.lte`]: today,
    include_adult: "false",
    ...dateRange(mood, media),
    ...languagePref(mood),
  };
  fetches.push(discover(env, { ...wildParams, sort_by: "vote_average.desc", page: 1 }, language).catch(() => ({ results: [] })));
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
