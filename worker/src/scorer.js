// Mood-fit scorer. Pure function: given a film + mood, returns additive score.
// Extracted from index.js so it can be unit-tested without env/network.

import { imdbTierBoost } from "./imdb_tier.js";

// How many distinct mood axes is the user setting? Used to dampen popularity boost.
function moodDensity(mood) {
  const axes = ["tone","energy","depth","trust","first_act","appetite","decade",
                "language_pref","runtime","avoid","quality","popularity",
                "company","risk","fear"];
  return axes.reduce((n, k) => n + (mood[k] && mood[k] !== "any" ? 1 : 0), 0);
}

export function fitScore(film, mood = {}) {
  const genres = new Set([...(film.genres || []), ...(film.genre_ids || [])].map(x => String(x).toLowerCase()));
  let s = 0;
  const has = (...xs) => xs.some(x => genres.has(String(x).toLowerCase()));
  const density = moodDensity(mood);
  // Damp popularity-boost when user is being specific. Range: 1.0 (empty mood) → 0.35 (8+ axes).
  const popDamp = Math.max(0.35, 1.0 - 0.08 * Math.max(0, density - 1));

  if (mood.tone === "dark" && has("27", "53", "9648", "80", "horror", "thriller", "mystery", "crime")) s += 2;
  if (mood.tone === "light" && has("35", "10749", "12", "14", "comedy", "romance", "adventure", "fantasy")) s += 2;
  if (mood.energy === "engage" && has("28", "53", "9648", "12", "action", "thriller", "mystery", "adventure")) s += 1.5;
  if (mood.energy === "unwind" && has("35", "10749", "18", "comedy", "romance", "drama")) s += 1;
  if (mood.first_act === "thriller_horror" && has("27", "53", "9648", "horror", "thriller", "mystery")) s += 2.5;
  if (mood.first_act === "fantasy_scifi" && has("14", "878", "fantasy", "scifi", "science fiction")) s += 2.8;
  if (mood.first_act === "drama_romance" && has("18", "10749", "drama", "romance")) s += 2.5;
  if (mood.first_act === "action_adventure" && has("28", "12", "action", "adventure")) s += 2.5;
  if ((mood.trust === "horror" || mood.first_act === "thriller_horror") && !has("27", "53", "9648", "horror", "thriller", "mystery")) s -= 4;
  if ((mood.trust === "horror" || mood.tone === "dark") && has("10751", "16", "family", "animation")) s -= 2.5;

  // Horror dual-intensity.
  if (mood.trust === "horror") {
    const isHardHorror = has("27", "horror");
    const isSoftSuspense = has("9648", "53", "mystery", "thriller") && !has("27", "horror");
    if (mood.energy === "engage" && isHardHorror) s += 2.5;
    if (mood.energy === "engage" && isSoftSuspense) s -= 1.2;
    if (mood.energy === "unwind" && isHardHorror) s -= 1.5;
    if (mood.energy === "unwind" && isSoftSuspense) s += 2.5;
  }
  // Animation opt-in.
  const isAnimation = has("16", "animation");
  if (isAnimation) {
    if (mood.trust === "animation") s += 3;
    else s -= 1.8;
  }

  // Erotic thriller signal — high desire/peligro pulls together drama+thriller+romance.
  if (mood.trust === "erotic_thriller") {
    if (has("53", "thriller") && has("18", "10749", "drama", "romance")) s += 3;
    if (has("16", "animation", "10751", "family")) s -= 4;
  }

  // Documentary signal — only score docs when explicitly asked.
  if (mood.trust === "doc") {
    if (has("99", "documentary")) s += 4;
    else s -= 2;
  }

  if (mood.runtime === "short" && film.runtime && film.runtime <= 95) s += 1.5;
  if (mood.runtime === "medium" && film.runtime && film.runtime >= 90 && film.runtime <= 125) s += 1;

  // Popularity preference (low = harder to find).
  if (mood.popularity === "low") s += Math.max(0, 1.4 - Math.min((film.popularity || 0) / 70, 1.4));

  // Risk taste — read company and risk from mood (previously ignored).
  // risk_taste maps to risk via ritualToMood. classic = canon, gem = hidden, etc.
  if (mood.risk === "discover") s += has("99","18","mystery","drama","documentary") ? 0.6 : 0;
  if (mood.risk === "safe") s += has("28","12","35","action","adventure","comedy") ? 0.4 : 0;
  if (mood.risk === "weird") {
    // Trust the lower vote_count crowd
    const vc0 = film.vote_count || 0;
    if (vc0 < 1500 && (film.vote_average || 0) >= 7) s += 1.2;
  }

  // Company signal — solo viewing supports darker/slower; family/friends push lighter.
  if (mood.company === "alone" && (mood.depth === "uneasy" || mood.depth === "ruined")) {
    if (has("18","53","drama","thriller","mystery")) s += 0.6;
  }
  if ((mood.company === "family" || mood.company === "friends") &&
      has("16","10751","35","animation","family","comedy")) s += 0.4;

  // Era bias.
  const dateStr = film.release_date || film.first_air_date || "";

  // Unreleased films: heavy penalty unless explicitly wanted.
  // QA #3 caught The Punisher 2026 / Lee Cronin's Mummy polluting many scenarios
  // due to high promotional popularity with no real release.
  const todayStr = new Date().toISOString().slice(0, 10);
  if (dateStr && dateStr > todayStr) {
    s -= 5;
  }
  const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : 0;
  const wantsOld = mood.decade === "old" || mood.decade === "70s" || mood.decade === "70s80s" ||
                   mood.decade === "80s" || mood.appetite === "vintage_love" ||
                   mood.appetite === "silent" || mood.appetite === "prestige" ||
                   mood.appetite === "blind_watch";
  if (year && !wantsOld) {
    if (year < 1960) s -= 4;
    else if (year < 1970) s -= 3;
    else if (year < 1980) s -= 1.8;
  }

  // Recency preference.
  if (year && !wantsOld) {
    if (year >= 2015)      s += 1.4;
    else if (year >= 2010) s += 1.0;
    else if (year >= 2000) s += 0.4;
    else if (year >= 1990) s += 0.1;
  }

  // Popularity floor — penalize items with too few votes.
  const vc = film.vote_count || 0;
  const isTV = film._media === "tv" || !!film.first_air_date;
  const isVetted = film._curated || film._list || film._imdbTier || imdbTierBoost(film.id, isTV) > 0;
  if (!isVetted) {
    if (isTV) {
      if (vc < 200)  s -= 3.0;
      else if (vc < 800)  s -= 1.5;
      else if (vc < 2000) s -= 0.5;
    } else {
      if (vc < 500)   s -= 2.5;
      else if (vc < 2000)  s -= 1.0;
    }
  }

  // IMDB-tier champion boost — DAMPED by mood density.
  // The original heavy-handed boost was the root of the "Shawshank in 9/35 sessions" bug:
  // every film with vc>=10000 + va>=7.8 got a flat +1.5/+2.5, drowning specific moods.
  const va = film.vote_average || 0;
  const tierBoost = imdbTierBoost(film.id, isTV);
  if (tierBoost > 0) s += tierBoost * popDamp;
  if (tierBoost === 0) {
    if (isTV && vc >= 5000 && va >= 7.8) s += 2.5 * popDamp;
    if (!isTV && vc >= 10000 && va >= 7.8) s += 1.5 * popDamp;
  }

  return s;
}
