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
  const listMatch = html.match(/<ul[^>]*class="[^"]*poster-list[^"]*"[^>]*>([\s\S]*?)<\/ul>/i);
  const scope = listMatch ? listMatch[1] : html;
  const reA = /\/film\/([a-z0-9][a-z0-9-]+)\/?/gi;
  let m;
  while ((m = reA.exec(scope))) slugs.add(m[1]);
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
  const userKey = `wl:${user}`;
  const seenSlugsKey = `wl:${user}:slugs`;

  let union = new Set();
  let resolvedSlugs = new Set();
  if (env.CACHE) {
    try {
      const raw = await env.CACHE.get(userKey, { type: "json" });
      if (raw && Array.isArray(raw.ids)) {
        union = new Set(raw.ids.filter(Number.isFinite));
        if (Array.isArray(raw.slugs)) resolvedSlugs = new Set(raw.slugs);
      }
    } catch {}
  }

  if (union.size >= HEALTHY_UNION) return union;

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
  void seenSlugsKey;
  return union;
}

// ── list scraper for mood-lab ──
export async function scrapeListPage(url, debug = false) {
  const html = await fetchHtml(url);

  // Extract list name
  let listName = "";
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch) {
    listName = titleMatch[1].replace(/, a list by.*$/i, "").replace(/ - Letterboxd$/i, "").replace(/&lrm;/g, "").replace(/&bull;/g, "").trim();
  }
  if (!listName) {
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) listName = h1Match[1].replace(/&lrm;/g, "").replace(/&bull;/g, "").trim();
  }

  if (debug) {
    const filmLinkMatches = html.match(/\/film\/([a-z0-9][a-z0-9-]+)\//gi) || [];
    return {
      list_name: listName,
      debug: {
        totalFilmLinks: filmLinkMatches.length,
        uniqueFilmLinks: [...new Set(filmLinkMatches)].length,
        firstLinks: filmLinkMatches.slice(0, 8)
      }
    };
  }

  // Extract films: find all unique film links with their visible text
  const seen = new Set();
  const films = [];

  // The poster-list may be in <ul class="poster-list">, <section>, or grid div
  // Use multiple strategies to find film entries

  // Strategy 1: extract slugs + nearby alt/title text from poster-list section
  const listMatch = html.match(/<ul[^>]*class="[^"]*poster-list[^"]*"[^>]*>([\s\S]*?)<\/ul>/i);
  const scope = listMatch ? listMatch[1] : html;

  // Helper to decode HTML entities
  const decode = (s) => s.replace(/&#0*39;|&#x27;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&#0*34;|&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&([a-z]+);/gi, '')  // strip remaining entities
    .trim();

  // Extract username from URL to filter out profile link
  const urlMatch = url.match(/letterboxd\.com\/([a-z0-9_-]+)\//i);
  const pageUser = urlMatch ? urlMatch[1].toLowerCase() : "";

  // Find film links with their display text
  const linkPattern = /<a[^>]*href="\/film\/([a-z0-9][a-z0-9-]+)\/?[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  const stopWords = new Set(["a","is","of","the","this","new","top","log","sign","create","in","account","pro","go","film","films","lists","list","watchlist","diary","reviews","activity","likes","network","stats","tags","rss","search","settings","privacy","terms"]);
  while ((linkMatch = linkPattern.exec(scope))) {
    const slug = linkMatch[1];
    if (seen.has(slug)) continue;
    if (stopWords.has(slug.toLowerCase()) || slug.length < 3 || slug.toLowerCase() === pageUser) continue;
    seen.add(slug);

    // Get the text content (strip HTML tags)
    let title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    title = decode(title);
    if (!title || title.length < 2) {
      title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }

    // Look for year in surrounding context
    const pos = linkMatch.index;
    const context = scope.substring(Math.max(0, pos - 80), Math.min(scope.length, pos + 400));
    let year = "";
    // Try " (2024)" pattern
    const yearParen = context.match(/\((\d{4})\)/);
    if (yearParen) year = yearParen[1];
    // Try data-year or similar
    if (!year) {
      const dataYear = context.match(/data-year="(\d{4})"/i);
      if (dataYear) year = dataYear[1];
    }

    films.push({ title, year, director: "" });
  }

  // Strategy 2: if no links found in scope, try img alt text
  if (films.length === 0) {
    const imgPattern = /<img[^>]*alt="([^"]+)"[^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgPattern.exec(scope))) {
      const alt = imgMatch[1].trim();
      if (!alt || /^\s*(?:Poster|Still|Frame|Image)?\s*$/i.test(alt) || seen.has(alt)) continue;
      seen.add(alt);
      films.push({ title: alt, year: "", director: "" });
    }
  }

  // Strategy 3: broader search — any /film/ link in the whole page
  if (films.length === 0) {
    const reLink = /<a[^>]*href="\/film\/([a-z0-9][a-z0-9-]+)\/?[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((linkMatch = reLink.exec(html))) {
      const slug = linkMatch[1];
      if (seen.has(slug) || stopWords.has(slug.toLowerCase()) || slug.length < 3) continue;
      seen.add(slug);
      let title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
      title = decode(title);
      if (!title || title.length < 2) {
        title = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      }
      films.push({ title, year: "", director: "" });
      if (films.length >= 100) break;
    }
  }

  return { list_name: listName, films };
}
