// Letterboxd watchlist scraper.
// Walks letterboxd.com/{user}/watchlist/page/N/, extracts TMDb IDs from film pages.
// LB doesn't expose TMDb IDs in the watchlist HTML directly, so we scrape film
// slugs and then fetch each film page to get the TMDb link. We cache slug->id
// in KV (binding `CACHE`) for 30d to keep this fast.

const UA = "moodwatch-bot/0.1 (+https://brm-src.github.io/moodwatch/)";
const MAX_PAGES = 5;          // up to 140 films
const PER_PAGE = 28;          // LB default

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en;q=0.9" },
    cf: { cacheTtl: 600, cacheEverything: true },
  });
  if (!r.ok) throw new Error(`LB ${url} → ${r.status}`);
  return r.text();
}

function extractSlugs(html) {
  // Watchlist HTML uses <li class="poster-container"> with <div data-film-slug="..."> or
  // <a href="/film/SLUG/"> inside posters. Be permissive.
  const slugs = new Set();
  const reA = /\/film\/([a-z0-9][a-z0-9-]+)\/?/gi;
  let m;
  while ((m = reA.exec(html))) slugs.add(m[1]);
  // Filter out non-film paths
  return [...slugs].filter(s => !["a","is","of","the","this","new","top"].includes(s));
}

function extractTmdbId(html) {
  // film page contains a link to themoviedb.org/movie/<id>
  const m = html.match(/themoviedb\.org\/movie\/(\d+)/);
  return m ? Number(m[1]) : null;
}

async function slugToTmdbId(env, slug) {
  // KV cache
  if (env.CACHE) {
    const cached = await env.CACHE.get(`slug:${slug}`);
    if (cached) return cached === "null" ? null : Number(cached);
  }
  let id = null;
  try {
    const html = await fetchHtml(`https://letterboxd.com/film/${slug}/`);
    id = extractTmdbId(html);
  } catch {}
  if (env.CACHE) {
    await env.CACHE.put(`slug:${slug}`, id == null ? "null" : String(id), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
  }
  return id;
}

export async function fetchWatchlistTmdbIds(env, user) {
  // user already validated upstream as ^[a-z0-9_-]{1,30}$
  const allSlugs = new Set();

  for (let page = 1; page <= MAX_PAGES; page++) {
    let html;
    try {
      html = await fetchHtml(`https://letterboxd.com/${user}/watchlist/page/${page}/`);
    } catch (e) {
      if (page === 1) throw e; // first page must work
      break;
    }
    const slugs = extractSlugs(html);
    if (slugs.length === 0) break;
    slugs.forEach(s => allSlugs.add(s));
    if (slugs.length < PER_PAGE) break; // last page
  }

  if (allSlugs.size === 0) return new Set();

  // Resolve slugs -> TMDb IDs in parallel batches of 8
  const slugList = [...allSlugs];
  const ids = new Set();
  const BATCH = 8;
  for (let i = 0; i < slugList.length; i += BATCH) {
    const batch = slugList.slice(i, i + BATCH);
    const resolved = await Promise.all(batch.map(s => slugToTmdbId(env, s).catch(() => null)));
    resolved.forEach(id => { if (id) ids.add(id); });
  }
  return ids;
}
