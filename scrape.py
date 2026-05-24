"""Letterboxd watchlist scraper + TMDb resolver.

Spike: validate end-to-end pipeline.
- Fetch all pages of /USER/watchlist/
- Extract film slugs
- Resolve each slug -> TMDb ID by fetching /film/SLUG/ once
- Cache slug->tmdb mapping in a JSON file (slugs never change)
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin

import urllib.request

UA = "Mozilla/5.0 (X11; Linux x86_64) MoodpickerSpike/0.1"
BASE = "https://letterboxd.com"
CACHE = Path(__file__).parent / "cache.json"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="ignore")


def watchlist_page_count(html: str) -> int:
    pages = re.findall(r"/watchlist/page/(\d+)/", html)
    return max((int(p) for p in pages), default=1)


def extract_slugs(html: str) -> list[str]:
    # data-target-link="/film/SLUG/"
    return re.findall(r'data-target-link="/film/([^"/]+)/"', html)


def fetch_watchlist_slugs(user: str) -> list[str]:
    page1 = fetch(f"{BASE}/{user}/watchlist/")
    n = watchlist_page_count(page1)
    slugs = extract_slugs(page1)
    for p in range(2, n + 1):
        html = fetch(f"{BASE}/{user}/watchlist/page/{p}/")
        slugs.extend(extract_slugs(html))
        time.sleep(0.3)  # polite
    # dedupe preserving order
    seen, out = set(), []
    for s in slugs:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


def resolve_tmdb(slug: str) -> dict | None:
    """Fetch /film/SLUG/ and pull TMDb id + title + year + director."""
    html = fetch(f"{BASE}/film/{slug}/")
    tmdb_m = re.search(r"themoviedb\.org/movie/(\d+)", html)
    if not tmdb_m:
        return None
    tmdb_id = int(tmdb_m.group(1))

    # Title (og:title is "Title (YYYY)")
    title_m = re.search(r'<meta property="og:title" content="([^"]+)"', html)
    raw_title = title_m.group(1) if title_m else slug

    year = None
    title = raw_title
    ym = re.search(r"^(.*)\s+\((\d{4})\)\s*$", raw_title)
    if ym:
        title = ym.group(1)
        year = int(ym.group(2))

    # Director from JSON-LD
    dir_m = re.search(r'"director":\[\{"@type":"Person","name":"([^"]+)"', html)
    director = dir_m.group(1) if dir_m else None

    # IMDb
    imdb_m = re.search(r"imdb\.com/title/(tt\d+)", html)
    imdb = imdb_m.group(1) if imdb_m else None

    return {
        "slug": slug,
        "tmdb_id": tmdb_id,
        "title": title,
        "year": year,
        "director": director,
        "imdb": imdb,
    }


def load_cache() -> dict:
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    return {}


def save_cache(c: dict) -> None:
    CACHE.write_text(json.dumps(c, indent=2, ensure_ascii=False))


def run(user: str, max_films: int | None = None) -> list[dict]:
    cache = load_cache()
    slugs = fetch_watchlist_slugs(user)
    print(f"[{user}] watchlist: {len(slugs)} films", file=sys.stderr)
    if max_films:
        slugs = slugs[:max_films]

    out = []
    for i, slug in enumerate(slugs, 1):
        if slug in cache:
            data = cache[slug]
        else:
            try:
                data = resolve_tmdb(slug)
            except Exception as e:
                print(f"  ! {slug}: {e}", file=sys.stderr)
                data = None
            if data:
                cache[slug] = data
                save_cache(cache)
            time.sleep(0.4)
        if data:
            out.append(data)
        if i % 5 == 0:
            print(f"  {i}/{len(slugs)} resolved", file=sys.stderr)
    return out


if __name__ == "__main__":
    user = sys.argv[1] if len(sys.argv) > 1 else "dave"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    rows = run(user, max_films=n)
    print(json.dumps(rows, indent=2, ensure_ascii=False))
