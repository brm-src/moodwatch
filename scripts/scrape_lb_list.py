#!/usr/bin/env python3
"""Scrape a Letterboxd list, resolve TMDb IDs, output JSON for lists.js.

Usage:
    python3 scripts/scrape_lb_list.py URL [URL ...]

Reads each list at letterboxd.com/USER/list/SLUG/, walks pagination,
fetches each film page to extract its TMDb id, prints a JSON object
keyed by list URL with {name, user, slug, count, ids: [...]}.
"""
from __future__ import annotations

import concurrent.futures as cf
import json
import re
import sys
import time
import urllib.request
from urllib.parse import urlparse

UA = "moodwatch-bot/0.1 (+https://brm-src.github.io/moodwatch/)"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en;q=0.9"})
    # Resolve boxd.it shortlinks
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="ignore")


def resolve_short(url: str) -> str:
    if "boxd.it" not in url:
        return url
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.geturl()


SLUG_RE = re.compile(r"data-film-slug=\"([a-z0-9][a-z0-9-]+)\"")
SLUG_FALLBACK_RE = re.compile(r"/film/([a-z0-9][a-z0-9-]+)/?\"")
NAME_RE = re.compile(r"<meta property=\"og:title\" content=\"([^\"]+)\"")
TMDB_RE = re.compile(r"themoviedb\.org/movie/(\d+)")


def list_slugs(list_url: str) -> tuple[str, list[str]]:
    list_url = list_url.rstrip("/") + "/"
    base = list_url
    name = ""
    slugs: list[str] = []
    seen: set[str] = set()
    for page in range(1, 30):
        url = base if page == 1 else f"{base}page/{page}/"
        try:
            html = fetch(url)
        except Exception as e:
            if page == 1:
                raise
            break
        if page == 1:
            m = NAME_RE.search(html)
            if m:
                name = m.group(1).split("•")[0].strip()
        page_slugs = SLUG_RE.findall(html)
        if not page_slugs:
            page_slugs = SLUG_FALLBACK_RE.findall(html)
        new = [s for s in page_slugs if s not in seen]
        if not new:
            break
        for s in new:
            seen.add(s); slugs.append(s)
        if len(new) < 20:  # likely last page
            break
        time.sleep(0.3)
    return name, slugs


def slug_to_tmdb(slug: str) -> int | None:
    try:
        html = fetch(f"https://letterboxd.com/film/{slug}/")
    except Exception:
        return None
    m = TMDB_RE.search(html)
    return int(m.group(1)) if m else None


def main() -> int:
    out: dict[str, dict] = {}
    for raw in sys.argv[1:]:
        try:
            url = resolve_short(raw)
        except Exception as e:
            print(f"resolve error: {raw} -> {e}", file=sys.stderr)
            continue
        path = urlparse(url).path.strip("/")
        # path: USER/list/SLUG/...
        parts = path.split("/")
        user = parts[0] if parts else ""
        slug = parts[2] if len(parts) >= 3 else ""
        print(f"[{user}/{slug}] scraping {url}", file=sys.stderr)
        try:
            name, slugs = list_slugs(url)
        except Exception as e:
            print(f"  scrape error: {e}", file=sys.stderr); continue
        print(f"  {len(slugs)} film slugs, resolving TMDb ids…", file=sys.stderr)
        ids: list[int] = []
        seen_ids: set[int] = set()
        with cf.ThreadPoolExecutor(max_workers=8) as ex:
            for sid in ex.map(slug_to_tmdb, slugs):
                if sid and sid not in seen_ids:
                    ids.append(sid); seen_ids.add(sid)
        print(f"  -> {len(ids)} TMDb ids", file=sys.stderr)
        out[url] = {"name": name, "user": user, "slug": slug, "count": len(ids), "ids": ids}
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
