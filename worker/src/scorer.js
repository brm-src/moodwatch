// Mood-fit scorer. Pure function: given a film + mood, returns additive score.
// Extracted from index.js so it can be unit-tested without env/network.

import { imdbTierBoost } from "./imdb_tier.js";

export function fitScore(film, mood = {}) {
  const genres = new Set([...(film.genres || []), ...(film.genre_ids || [])].map(x => String(x).toLowerCase()));
  let s = 0;
  const has = (...xs) => xs.some(x => genres.has(String(x).toLowerCase()));
  if (mood.tone === "dark" && has("27", "53", "9648", "80", "horror", "thriller", "mystery", "crime")) s += 2;
  // Animation/family removed from generic light/unwind boosts — must be opt-in
  if (mood.tone === "light" && has("35", "10749", "12", "14", "comedy", "romance", "adventure", "fantasy")) s += 2;
  if (mood.energy === "engage" && has("28", "53", "9648", "12", "action", "thriller", "mystery", "adventure")) s += 1.5;
  if (mood.energy === "unwind" && has("35", "10749", "18", "comedy", "romance", "drama")) s += 1;
  if (mood.first_act === "thriller_horror" && has("27", "53", "9648", "horror", "thriller", "mystery")) s += 2;
  if ((mood.trust === "horror" || mood.first_act === "thriller_horror") && !has("27", "53", "9648", "horror", "thriller", "mystery")) s -= 4;
  if ((mood.trust === "horror" || mood.tone === "dark") && has("10751", "16", "family", "animation")) s -= 2.5;

  // Horror dual-intensity: split based on energy axis.
  //   trust=horror + energy=engage  -> "hard" horror (Flanagan, slasher, dread real)
  //   trust=horror + energy=unwind  -> "soft" suspense (Wednesday-tier, mystery, gothic atmosphere)
  if (mood.trust === "horror") {
    const isHardHorror = has("27", "horror");
    const isSoftSuspense = has("9648", "53", "mystery", "thriller") && !has("27", "horror");
    if (mood.energy === "engage" && isHardHorror) s += 2.5;
    if (mood.energy === "engage" && isSoftSuspense) s -= 1.2;
    if (mood.energy === "unwind" && isHardHorror) s -= 1.5;
    if (mood.energy === "unwind" && isSoftSuspense) s += 2.5;
  }
  // Animation opt-in: only boost when user explicitly asks via trust=animation.
  // Otherwise penalize so it doesn't dominate generic light/unwind moods.
  const isAnimation = has("16", "animation");
  if (isAnimation) {
    if (mood.trust === "animation") s += 3;
    else s -= 1.8;
  }
  if (mood.first_act === "drama_romance" && has("18", "10749", "drama", "romance")) s += 2;
  if (mood.first_act === "action_adventure" && has("28", "12", "action", "adventure")) s += 2;
  if (mood.first_act === "fantasy_scifi" && has("14", "878", "fantasy", "scifi", "science fiction")) s += 2;
  if (mood.runtime === "short" && film.runtime && film.runtime <= 95) s += 1.5;
  if (mood.runtime === "medium" && film.runtime && film.runtime >= 90 && film.runtime <= 125) s += 1;
  if (mood.popularity === "low") s += Math.max(0, 1.4 - Math.min((film.popularity || 0) / 70, 1.4));

  // Era bias: most users skip pre-1980 films unless they explicitly ask for them.
  // Penalize old picks when the mood doesn't actively want them.
  const dateStr = film.release_date || film.first_air_date || "";
  const year = dateStr ? parseInt(dateStr.slice(0, 4), 10) : 0;
  const wantsOld = mood.decade === "old" || mood.decade === "70s" || mood.decade === "70s80s" ||
                   mood.appetite === "vintage_love" || mood.appetite === "silent" ||
                   mood.appetite === "prestige" || mood.appetite === "blind_watch";
  if (year && !wantsOld) {
    if (year < 1960) s -= 4;
    else if (year < 1970) s -= 3;
    else if (year < 1980) s -= 1.8;
  }

  // Recency preference: prioritize 2010+ unless mood explicitly wants vintage/prestige.
  // Smaller bumps for 2000s and 90s so they're not totally buried.
  if (year && !wantsOld) {
    if (year >= 2015)      s += 1.4;
    else if (year >= 2010) s += 1.0;
    else if (year >= 2000) s += 0.4;
    else if (year >= 1990) s += 0.1;
  }

  // Popularity floor — penalize items with too few votes (untested by audience).
  // KinnPorsche / Weak Hero / nicho-only get pushed down. Curated, list-matched, and
  // IMDB-tier picks are exempt (they're vetted by hand or by global popularity).
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

  // IMDB-tier champion boost — well-loved AND widely-watched.
  // Two signals: (a) static curated tier-list (imdb_tier.js, hand-validated dump),
  // (b) live vote_count + vote_average heuristic (catches new entries).
  const va = film.vote_average || 0;
  const tierBoost = imdbTierBoost(film.id, isTV);
  if (tierBoost > 0) s += tierBoost;
  // Live heuristic only adds extra if not already in static tier (avoid double-count).
  if (tierBoost === 0) {
    if (isTV && vc >= 5000 && va >= 7.8) s += 2.5;
    if (!isTV && vc >= 10000 && va >= 7.8) s += 1.5;
  }

  return s;
}
