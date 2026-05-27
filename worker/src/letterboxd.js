// Letterboxd watchlist scraper.
//
// Cloudflare Workers free plan caps subrequests at 50 per invocation —
// AND every KV read/write counts. So we use ONE KV entry per user that
// stores the resolved TMDb-id union, and grow it gradually:
//
//   - 1 KV get  (load whatever we cached for this user)
//   - 1-2 page scrapes (skip when union is already healthy)
//   - up to 4 fresh slug→id resolves (subrequests)
//   - 1 KV put  (persist the new union)
//
// Worst case: ~8 subrequests, leaving plenty of room for the rest of the
// recommend pipeline. After a few reloads the union grows to cover the
// whole watchlist with zero scraping cost.

const UA = "moodwatch-bot/0.1 (+https://brm-src.github.io/moodwatch/)";
const PER_PAGE = 28;
const USER_TTL = 60 * 60 * 24 * 7;     // 7d for the per-user union
const SLUG_TTL = 60 * 60 * 24 * 30;    // 30d for slug→id (kept for compat)
const HEALTHY_UNION = 40;              // skip scraping once we have ≥40 ids
const MAX_SCRAPE_PAGES = 1;            // ≤28 slugs per call when scraping
const RESOLVE_BUDGET = 3;              // fresh slug resolves per call

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en;q=0.9" },
    cf: { cacheTtl: 600, cacheEverything: true },
  });
  if (!r.ok) throw new Error(`LB ${url} → ${r.status}`);
  return r.text();
}

function extractSlugs(html) {
  const slugs = new Set();
  const reA = /\/film\/([a-z0-9][a-z0-9-]+)\/?/gi;
  let m;
  while ((m = reA.exec(html))) slugs.add(m[1]);
  return [...slugs].filter(s => !["a","is","of","the","this","new","top"].includes(s));
}

function extractTmdbId(html) {
  const m = html.match(/themoviedb\.org\/movie\/(\d+)/);
  return m ? Number(m[1]) : null;
}

async function slugToTmdbId(slug) {
  try {
    const html = await fetchHtml(`https://letterboxd.com/film/${slug}/`);
    return extractTmdbId(html);
  } catch { return null; }
}

// Kept for backwards compatibility (older callers used this directly).
export async function slugsToTmdbIds(env, slugs) {
  const ids = new Set();
  const BATCH = 4;
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH);
    const resolved = await Promise.all(batch.map(s => slugToTmdbId(s).catch(() => null)));
    resolved.forEach(id => { if (id) ids.add(id); });
  }
  return ids;
}

export async function fetchWatchlistTmdbIds(env, user) {
  // user already validated upstream as ^[a-z0-9_-]{1,30}$
  const userKey = `wl:${user}`;
  const seenSlugsKey = `wl:${user}:slugs`;

  // 1. Load per-user union (1 KV read).
  let union = new Set();
  let resolvedSlugs = new Set(); // slugs we've already attempted (success or null)
  if (env.CACHE) {
    try {
      const raw = await env.CACHE.get(userKey, { type: "json" });
      if (raw && Array.isArray(raw.ids)) {
        union = new Set(raw.ids.filter(Number.isFinite));
        if (Array.isArray(raw.slugs)) resolvedSlugs = new Set(raw.slugs);
      }
    } catch {}
  }

  // 2. If union is healthy, return it without scraping at all (0 extra subrequests).
  if (union.size >= HEALTHY_UNION) return union;

  // 3. Scrape a small page slice — usually just page 1.
  const newSlugs = [];
  for (let page = 1; page <= MAX_SCRAPE_PAGES; page++) {
    let html;
    try {
      html = await fetchHtml(`https://letterboxd.com/${user}/watchlist/page/${page}/`);
    } catch (e) {
      if (page === 1 && union.size === 0) throw e;
      break;
    }
    const slugs = extractSlugs(html);
    if (slugs.length === 0) break;
    for (const s of slugs) if (!resolvedSlugs.has(s)) newSlugs.push(s);
    if (slugs.length < PER_PAGE) break;
  }

  // 4. Resolve a small budget of fresh slugs. Shuffle so we eventually cover
  // the whole watchlist over multiple reloads instead of always the same N.
  for (let i = newSlugs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newSlugs[i], newSlugs[j]] = [newSlugs[j], newSlugs[i]];
  }
  const toResolve = newSlugs.slice(0, RESOLVE_BUDGET);
  if (toResolve.length) {
    const resolved = await Promise.all(
      toResolve.map(s => slugToTmdbId(s).catch(() => null))
    );
    for (let i = 0; i < toResolve.length; i++) {
      resolvedSlugs.add(toResolve[i]);
      const id = resolved[i];
      if (id) union.add(id);
    }
  }

  // 5. Persist (1 KV write). Cap slug-set at 800 to avoid runaway value size.
  if (env.CACHE && (union.size > 0 || resolvedSlugs.size > 0)) {
    try {
      const slugArr = [...resolvedSlugs].slice(-800);
      await env.CACHE.put(
        userKey,
        JSON.stringify({ ids: [...union], slugs: slugArr }),
        { expirationTtl: USER_TTL }
      );
    } catch {}
  }
  // Suppress unused-var warning for the legacy slug key (reserved for future use).
  void seenSlugsKey;

  return union;
}
