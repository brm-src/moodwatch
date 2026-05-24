// Mood object → TMDb /discover params, then fetch a candidate pool.
// Mood object shape (all optional, from frontend ritualToMood):
// { tone, energy, risk, company, popularity, quality, runtime,
//   language_pref, decade, first_act, fear:?, exclude:[], avoid, trust,
//   phrase }

import { tmdbDiscover, GENRES } from "./tmdb.js";

const G = GENRES;

// Genre presets per axis. Multiple axes combine via union (with_genres OR-ed in TMDb).
function genreSet(mood) {
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

function dateRange(mood) {
  const d = mood.decade;
  if (d === "old") return { "primary_release_date.lte": "1969-12-31" };
  if (d === "70s") return { "primary_release_date.gte": "1970-01-01", "primary_release_date.lte": "1979-12-31" };
  if (d === "90s") return { "primary_release_date.gte": "1990-01-01", "primary_release_date.lte": "1999-12-31" };
  if (d === "00s") return { "primary_release_date.gte": "2000-01-01", "primary_release_date.lte": "2009-12-31" };
  if (d === "now") return { "primary_release_date.gte": "2020-01-01" };
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

export async function discoverByMood(env, mood, language) {
  const today = new Date().toISOString().slice(0, 10);
  const params = {
    sort_by: "vote_average.desc",
    "vote_count.gte": 800,        // raised from 200 to filter out fresh-release noise
    "vote_average.gte": 6.5,      // baseline quality
    "with_runtime.gte": 75,       // drop shorts / TV specials
    "primary_release_date.lte": today, // already-released only
    include_adult: "false",
    page: 1,
    ...genreSet(mood),
    ...runtimeRange(mood),
    ...dateRange(mood),
    ...languagePref(mood),
    ...voteFilters(mood),
  };

  // Three pages for variety, fetched in parallel for speed
  const pages = [1, 2, 3];
  const pageResults = await Promise.all(pages.map(async p => {
    try {
      const data = await tmdbDiscover(env, { ...params, page: p }, language);
      return data.results || [];
    } catch (e) {
      console.log("discover page fail:", p, e?.message);
      return [];
    }
  }));
  const results = pageResults.flat();

  // De-dupe by id
  const seen = new Set();
  const dedup = [];
  for (const r of results) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    dedup.push(r);
  }

  // Map genre_ids -> names for the response
  const idToName = Object.fromEntries(Object.entries(G).map(([k, v]) => [v, k]));
  return dedup.map(r => ({
    ...r,
    genres: (r.genre_ids || []).map(id => idToName[id]).filter(Boolean),
  }));
}
