// Auto-generated IMDB-tier injection: top-voted, high-rated TMDB titles.
// Tier-S = absolute champions. Tier-A = strong second tier.
// Each entry: [tmdb_id, [genre_ids]] so we can mood-filter without a /details fetch.

const TV_S = new Map([
  [69050, [80,18,9648]], // Riverdale (2017)
  [60574, [18,80]], // Peaky Blinders (2013)
  [82856, [10765,10759]], // The Mandalorian (2019)
  [85552, [18]], // Euphoria (2019)
]);

const TV_A = new Map([
  [75006, [10759,10765,18]], // The Umbrella Academy (2019)
  [18165, [18,10765]], // The Vampire Diaries (2009)
  [76669, [80,9648,18]], // Elite (2018)
  [31910, [16,10759,10765]], // Naruto Shippūden (2007)
  [48866, [10765,10759,18,80]], // The 100 (2014)
  [85937, [16,10759,10765]], // Demon Slayer: Kimetsu no Yaiba (2019)
  [71912, [18,10759]], // The Witcher (2019)
  [19885, [80,18,9648]], // Sherlock (2010)
  [63247, [10765,37]], // Westworld (2016)
  [46260, [16,10759,10765]], // Naruto (2002)
  [95557, [16,18,10765,10759]], // INVINCIBLE (2021)
  [37854, [10759,35,16]], // One Piece (1999)
  [65930, [10759,16,10765]], // My Hero Academia (2016)
  [62715, [16,10759,10765]], // Dragon Ball Super (2015)
  [12637, [18,35]], // Rebelde (2004)
  [62104, [16,10759,10765]], // The Seven Deadly Sins (2014)
  [2190, [16,35]], // South Park (1997)
  [70785, [18,10751]], // Anne with an E (2017)
  [12971, [16,10765,10759]], // Dragon Ball Z (1989)
  [246, [16,10759,10765]], // Avatar: The Last Airbender (2005)
  [2004, [35]], // Malcolm in the Middle (2000)
  [34524, [10765,18,35]], // Teen Wolf (2011)
  [91363, [16,10759,10765]], // What If...? (2021)
  [65334, [10759,16,10762]], // Miraculous: Tales of Ladybug & Cat Noir (2015)
  [4604, [10765,10759,18]], // Smallville (2001)
  [99966, [10759,18,10765]], // All of Us Are Dead (2022)
  [5920, [80,18,9648]], // The Mentalist (2008)
  [2734, [80,18,9648]], // Law & Order: Special Victims Unit (1999)
  [4613, [18,10768]], // Band of Brothers (2001)
  [90462, [80,35,9648]], // Chucky (2021)
  [63926, [16,35,10759,10765]], // One-Punch Man (2015)
  [4057, [80,18,9648]], // Criminal Minds (2005)
  [86831, [16,10765]], // Love, Death & Robots (2019)
  [78191, [9648,80,18]], // You (2018)
  [79242, [9648,10765,18]], // Chilling Adventures of Sabrina (2018)
  [46896, [10765,18,9648]], // The Originals (2013)
  [74577, [35,18,80]], // The End of the F***ing World (2017)
  [16286, [10766,35,18]], // Yo soy Betty, la fea (1999)
  [39351, [18,9648,10765]], // Grimm (2011)
  [1911, [80,18]], // Bones (2005)
  [40075, [10759,16,35,10751,9648,10765]], // Gravity Falls (2012)
  [44953, [80,18,10766]], // El Señor de los Cielos (2013)
  [12609, [16,10759,10765]], // Dragon Ball (1986)
  [1421, [35]], // Modern Family (2009)
  [91239, [18]], // Bridgerton (2020)
  [69478, [18,10765,10759]], // The Handmaid's Tale (2017)
  [52814, [10765,10759]], // Halo (2022)
  [73586, [37,18]], // Yellowstone (2018)
  [104877, [18,35]], // Love Is in the Air (2020)
  [15260, [16,35,10765]], // Adventure Time (2010)
  [67178, [10759,80,18]], // Marvel's The Punisher (2017)
  [79460, [10765,18]], // Legacies (2018)
  [71728, [35,10751,18]], // Young Sheldon (2017)
  [67744, [18,80]], // MINDHUNTER (2017)
  [40008, [18,80]], // Hannibal (2013)
  [56570, [18,10765]], // Outlander (2014)
  [113988, [80,18]], // DAHMER - Monster: The Jeffrey Dahmer Story (2022)
  [108978, [10759,18,80]], // Reacher (2022)
  [75450, [18,10759,10765]], // Titans (2018)
  [106379, [10759,10765,18]], // Fallout (2024)
  [80752, [18,10765,10759]], // See (2019)
  [63639, [18,9648,10765]], // The Expanse (2015)
  [31917, [18,9648]], // Pretty Little Liars (2010)
  [75219, [18,80,10759]], // 9-1-1 (2018)
  [69740, [80,18]], // Ozark (2017)
  [112888, [35,18]], // True Beauty (2020)
  [58841, [80,18]], // Chicago P.D. (2014)
  [61374, [16,18,10765]], // Tokyo Ghoul (2014)
  [62455, [18,80]], // Locked Up (2015)
  [1981, [35,18,9648,10765]], // Charmed (1998)
  [31911, [16,10759,10765,18]], // Fullmetal Alchemist: Brotherhood (2009)
  [44006, [18]], // Chicago Fire (2012)
  [102903, [18]], // Control Z (2020)
  [4194, [10759,10765,16]], // Star Wars: The Clone Wars (2008)
  [65494, [18]], // The Crown (2016)
  [1400, [35]], // Seinfeld (1989)
  [33880, [16,10759,10765,10751]], // The Legend of Korra (2012)
  [71915, [35,18,10765]], // Good Omens (2019)
  [1395, [18]], // Gossip Girl (2007)
  [120089, [16,10759,35]], // SPY x FAMILY (2022)
  [31132, [16,35,10759,10765]], // Regular Show (2010)
  [107113, [35,9648,80]], // Only Murders in the Building (2021)
  [114410, [16,10759,10765,35]], // Chainsaw Man (2022)
  [30984, [10759,16,10765]], // Bleach (2004)
  [154521, [10764]], // The Kardashians (2022)
  [46298, [16,10759,10765]], // Hunter x Hunter (2011)
  [45782, [16,10765,10759]], // Sword Art Online (2012)
  [73223, [16,10759,10765]], // Black Clover (2017)
  [890, [10765,16,18]], // Neon Genesis Evangelion (1995)
  [35610, [16,10759,10765]], // InuYasha (2000)
  [125988, [10765,18]], // Silo (2023)
  [45950, [16,10759,35,10765]], // High School DxD (2012)
  [89641, [18,10765]], // Love Alarm (2019)
  [47, [35,10751,18]], // El Chavo del Ocho (1973)
  [83867, [10765,10759,18]], // Andor (2022)
  [95, [35,18,10765]], // Buffy the Vampire Slayer (1997)
  [90260, [18,35,10765]], // I Am Not Okay with This (2020)
  [63333, [10759,18,10768]], // The Last Kingdom (2015)
  [2038, [35]], // Drake & Josh (2004)
  [93741, [16,10762,10759,10751]], // Jurassic World Camp Cretaceous (2020)
  [76121, [16,18,10765,35]], // DARLING in the FRANXX (2018)
  [100883, [35,18]], // Never Have I Ever (2020)
  [114868, [10759,16,10765]], // Record of Ragnarok (2021)
  [16420, [35,18]], // Boys Over Flowers (2009)
  [2098, [10759,16,18,9648]], // Batman: The Animated Series (1992)
  [4629, [10765,10759]], // Stargate SG-1 (1997)
  [8592, [35]], // Parks and Recreation (2009)
  [92685, [16,10759,35,10765,10751]], // The Owl House (2020)
  [117581, [35,18]], // Ginny & Georgia (2021)
  [4686, [16,10765,10759,35,10762]], // Ben 10 (2005)
  [111110, [10759,10765]], // ONE PIECE (2023)
  [1972, [10765,10759,18]], // Battlestar Galactica (2004)
  [61617, [9648,10765,16,10751,35]], // Over the Garden Wall (2014)
  [126308, [18,10768]], // Shōgun (2024)
  [127532, [16,10759,10765]], // Solo Leveling (2024)
  [37606, [16,10751,10765,35]], // The Amazing World of Gumball (2011)
  [31251, [35,10762]], // Victorious (2010)
  [124834, [18]], // Heartstopper (2022)
  [31356, [35,10762]], // Big Time Rush (2009)
  [86031, [16,10759,35,10765]], // Dr. STONE (2019)
  [86430, [18,80]], // Your Honor (2020)
  [115004, [18,80,9648]], // Mare of Easttown (2021)
  [97186, [35,18]], // Love, Victor (2020)
  [2085, [16,10751,10765,35,10762]], // Courage the Cowardly Dog (1999)
  [71789, [10759,18,10768]], // SEAL Team (2017)
  [67136, [18]], // This Is Us (2016)
  [2490, [35]], // The IT Crowd (2006)
  [79699, [10766,18]], // La hija del Mariachi (2006)
  [45790, [16,10759,10765]], // JoJo's Bizarre Adventure (2012)
  [89456, [10759,16]], // Primal (2019)
]);

const MOVIE_S = new Map([
  [299536, [12,28,878]], // Avengers: Infinity War (2018)
  [278, [18,80]], // The Shawshank Redemption (1994)
  [680, [53,80,35]], // Pulp Fiction (1994)
  [13, [35,18,10749]], // Forrest Gump (1994)
  [299534, [12,878,28]], // Avengers: Endgame (2019)
  [120, [12,14,28]], // The Lord of the Rings: The Fellowship of the Ring (2001)
  [122, [12,14,28]], // The Lord of the Rings: The Return of the King (2003)
  [16869, [18,53,10752]], // Inglourious Basterds (2009)
  [121, [12,14,28]], // The Lord of the Rings: The Two Towers (2002)
  [105, [12,35,878]], // Back to the Future (1985)
  [98, [28,18,12]], // Gladiator (2000)
]);

const MOVIE_A = new Map([
  [24428, [878,28,12]], // The Avengers (2012)
  [118340, [28,878,12]], // Guardians of the Galaxy (2014)
  [671, [12,14]], // Harry Potter and the Philosopher's Stone (2001)
  [68718, [18,37]], // Django Unchained (2012)
  [475557, [80,53,18]], // Joker (2019)
  [106646, [80,18,35]], // The Wolf of Wall Street (2013)
  [11324, [18,53,9648]], // Shutter Island (2010)
  [150540, [16,10751,12,18,35]], // Inside Out (2015)
  [673, [12,14]], // Harry Potter and the Prisoner of Azkaban (2004)
  [22, [12,14,28]], // Pirates of the Caribbean: The Curse of the Black P (2003)
  [674, [12,14]], // Harry Potter and the Goblet of Fire (2005)
  [634649, [28,12,878]], // Spider-Man: No Way Home (2021)
  [12445, [12,14]], // Harry Potter and the Deathly Hallows: Part 2 (2011)
  [14160, [16,35,10751,12]], // Up (2009)
  [354912, [10751,16,10402,12]], // Coco (2017)
  [263115, [28,18,878]], // Logan (2017)
  [10681, [16,10751,878]], // WALL·E (2008)
  [37165, [35,18]], // The Truman Show (1998)
  [210577, [9648,53,18]], // Gone Girl (2014)
  [862, [10751,35,16,12]], // Toy Story (1995)
  [585, [16,35,10751,14]], // Monsters, Inc. (2001)
  [2062, [16,35,10751,14]], // Ratatouille (2007)
  [77338, [18,35]], // The Intouchables (2011)
  [1891, [12,28,878]], // The Empire Strikes Back (1980)
  [205596, [36,18,53,10752]], // The Imitation Game (2014)
  [329, [12,878]], // Jurassic Park (1993)
  [424694, [10402,18]], // Bohemian Rhapsody (2018)
  [424, [18,36,10752]], // Schindler's List (1993)
  [857, [10752,18,36]], // Saving Private Ryan (1998)
  [640, [18,80]], // Catch Me If You Can (2002)
  [1892, [12,28,878]], // Return of the Jedi (1983)
  [348, [27,878]], // Alien (1979)
  [77, [9648,53]], // Memento (2000)
  [101, [80,18,28]], // Léon: The Professional (1994)
  [10193, [16,10751,35]], // Toy Story 3 (2010)
  [752, [28,53,878]], // V for Vendetta (2006)
  [500, [80,53]], // Reservoir Dogs (1992)
  [393, [28,80,53]], // Kill Bill: Vol. 2 (2004)
  [324786, [18,36,10752]], // Hacksaw Ridge (2016)
  [10191, [14,12,16,10751]], // How to Train Your Dragon (2010)
  [280, [28,53,878]], // Terminator 2: Judgment Day (1991)
  [489, [18]], // Good Will Hunting (1997)
  [185, [878,80]], // A Clockwork Orange (1971)
  [530915, [10752,36,18]], // 1917 (2019)
  [103, [80,18]], // Taxi Driver (1976)
  [296096, [18,10749]], // Me Before You (2016)
  [14, [18]], // American Beauty (1999)
  [111, [28,80,18]], // Scarface (1983)
  [490132, [18,35,36]], // Green Book (2018)
  [745, [9648,53,18]], // The Sixth Sense (1999)
]);

export function imdbTierBoost(id, isTV) {
  if (isTV) {
    if (TV_S.has(id)) return 3.5;
    if (TV_A.has(id)) return 2.0;
  } else {
    if (MOVIE_S.has(id)) return 2.5;
    if (MOVIE_A.has(id)) return 1.2;
  }
  return 0;
}

export function imdbTierTier(id, isTV) {
  if (isTV) {
    if (TV_S.has(id)) return "S";
    if (TV_A.has(id)) return "A";
  } else {
    if (MOVIE_S.has(id)) return "S";
    if (MOVIE_A.has(id)) return "A";
  }
  return null;
}

// Genre matching for injection: returns IDs whose genre overlaps with `genreFilter`.
// genreFilter: Set<number> of TMDB genre IDs the mood prefers (empty = no filter).
// excludeIds: Set<number> of IDs already in the pool.
// Returns up to `cap` IDs sorted by tier (S first), shuffled within tier.
export function selectTierForMood(isTV, genreFilter, excludeIds, cap = 6) {
  const tiers = isTV ? [TV_S, TV_A] : [MOVIE_S, MOVIE_A];
  const out = [];
  for (const tier of tiers) {
    const candidates = [];
    for (const [id, genres] of tier) {
      if (excludeIds && excludeIds.has(id)) continue;
      if (genreFilter && genreFilter.size > 0) {
        const overlap = genres.some(g => genreFilter.has(g));
        if (!overlap) continue;
      }
      candidates.push(id);
    }
    // Shuffle within tier so we don't always inject the same top picks
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const id of candidates) {
      if (out.length >= cap) return out;
      out.push(id);
    }
  }
  return out;
}

export const IMDB_TIER_COUNTS = {
  tv_s: TV_S.size,
  tv_a: TV_A.size,
  movie_s: MOVIE_S.size,
  movie_a: MOVIE_A.size,
};
