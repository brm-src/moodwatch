// Curated Letterboxd lists mapped to mood signatures.
// When a user's mood matches a list's signature, that list's films get pulled
// into the candidate pool with a priority boost.
//
// Each entry:
//   { url, name, signature: {axis: value | [values]}, priority }
//
// Signature matching: a list matches if AT LEAST ONE axis matches the user's mood.
// More matches = higher boost.

export const LISTS = [
  {
    slug: "lb-slow-cinema",
    url: "https://letterboxd.com/dave/list/official-top-250-narrative-feature-films/",
    name: "Slow cinema",
    signature: { depth: ["thoughtful", "ruined"], temperature: ["cool", "freezing"], pace: ["slow"] },
  },
  {
    slug: "lb-noir",
    url: "https://letterboxd.com/jugu/list/noir-classics/",
    name: "Noir classics",
    signature: { tone: "dark", energy: "engage", first_act: "thriller_horror" },
  },
  {
    slug: "lb-folk-horror",
    url: "https://letterboxd.com/lucy_in_the_sky/list/folk-horror/",
    name: "Folk horror",
    signature: { trust: "horror", tone: "dark", first_act: "thriller_horror" },
  },
  {
    slug: "lb-cult",
    url: "https://letterboxd.com/jugu/list/cult-films/",
    name: "Cult oddities",
    signature: { trust: "weird", risk: "discover" },
  },
  {
    slug: "lb-romance-modern",
    url: "https://letterboxd.com/madsmoreau/list/modern-romance/",
    name: "Modern romance",
    signature: { tone: "light", first_act: "drama_romance", temperature: "warm" },
  },
  {
    slug: "lb-anime-adult",
    url: "https://letterboxd.com/yotsuba_chan/list/100-essential-anime-films/",
    name: "Adult animation",
    signature: { trust: "animation" },
  },
  {
    slug: "lb-80s-action",
    url: "https://letterboxd.com/cinemonster/list/80s-action-essentials/",
    name: "80s action",
    signature: { decade: "70s", first_act: "action_adventure" },
  },
  {
    slug: "lb-feel-good",
    url: "https://letterboxd.com/cynthrax/list/the-feel-good-list/",
    name: "Feel-good",
    signature: { tone: "light", energy: "unwind", want: "calm" },
  },
  {
    slug: "lb-coming-of-age",
    url: "https://letterboxd.com/twoeyestoseebeauty/list/coming-of-age/",
    name: "Coming of age",
    signature: { memory: ["childhood_summer", "heartbreak"], depth: "thoughtful" },
  },
  {
    slug: "lb-female-directed",
    url: "https://letterboxd.com/sallyjanecriterion/list/films-directed-by-women/",
    name: "Directed by women",
    signature: {}, // matches all moods at low priority
  },
];

const UA = "moodwatch-bot/0.1 (+https://brm-src.github.io/moodwatch/)";

async function fetchListPage(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en;q=0.9" },
    cf: { cacheTtl: 86400 * 3, cacheEverything: true },
  });
  if (!r.ok) throw new Error(`LB list ${url} → ${r.status}`);
  return r.text();
}

function extractFilmSlugs(html) {
  const slugs = new Set();
  const re = /data-film-slug="([a-z0-9][a-z0-9-]+)"/gi;
  let m;
  while ((m = re.exec(html))) slugs.add(m[1]);
  if (slugs.size === 0) {
    // Fallback: parse film links
    const re2 = /\/film\/([a-z0-9][a-z0-9-]+)\/?/gi;
    let m2;
    while ((m2 = re2.exec(html))) slugs.add(m2[1]);
  }
  return [...slugs].filter(s => s.length > 1 && !["a","is","of","the","this","new","top"].includes(s));
}

function nextPageUrl(html, baseUrl) {
  // Look for "next" pagination
  const m = html.match(/href="([^"]*\/page\/(\d+)\/[^"]*)"\s*[^>]*class="[^"]*next/i);
  if (m) {
    const u = m[1];
    return u.startsWith("http") ? u : `https://letterboxd.com${u}`;
  }
  return null;
}

export async function fetchListSlugs(env, list, maxPages = 3) {
  // KV cache (per-list, 3-day TTL since lists change rarely)
  const cacheKey = `list:${list.slug}`;
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey, "json");
    if (cached && Array.isArray(cached.slugs) && cached.ts > Date.now() - 86400 * 3 * 1000) {
      return cached.slugs;
    }
  }

  const allSlugs = new Set();
  let url = list.url;
  for (let i = 0; i < maxPages && url; i++) {
    let html;
    try { html = await fetchListPage(url); } catch { break; }
    extractFilmSlugs(html).forEach(s => allSlugs.add(s));
    url = nextPageUrl(html, url);
  }

  const slugs = [...allSlugs];
  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify({ ts: Date.now(), slugs }), {
      expirationTtl: 86400 * 7,
    });
  }
  return slugs;
}

// Match a mood object against list signatures. Returns lists sorted by match score.
export function matchLists(mood) {
  const matches = [];
  for (const list of LISTS) {
    const sig = list.signature;
    const sigKeys = Object.keys(sig);
    if (sigKeys.length === 0) {
      matches.push({ list, score: 0.5 }); // catch-all, low priority
      continue;
    }
    let score = 0;
    for (const k of sigKeys) {
      const want = sig[k];
      const got = mood[k];
      if (got == null) continue;
      if (Array.isArray(want)) {
        if (want.includes(got)) score++;
      } else {
        if (want === got) score++;
      }
    }
    if (score > 0) matches.push({ list, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 3); // top 3 lists
}
