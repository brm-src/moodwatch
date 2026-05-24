"""End-to-end orchestrator + CLI.

Usage:
    TMDB_API_KEY=xxx python pick.py LETTERBOXD_USER --country CL

Pipeline:
    1. scrape watchlist  ->  slugs
    2. resolve slugs     ->  TMDb IDs (cached)
    3. enrich via TMDb   ->  genres/runtime/keywords/providers
    4. ask mood quiz
    5. rank + show top 3
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import scrape
import tmdb
import mood as moodmod

ENRICH_CACHE = Path(__file__).parent / "enrich_cache.json"


def load_enrich_cache() -> dict:
    if ENRICH_CACHE.exists():
        return json.loads(ENRICH_CACHE.read_text())
    return {}


def save_enrich_cache(c: dict) -> None:
    ENRICH_CACHE.write_text(json.dumps(c, indent=2, ensure_ascii=False))


def enrich_with_cache(items: list[dict], country: str) -> list[dict]:
    cache = load_enrich_cache()
    todo = [i for i in items if str(i["tmdb_id"]) not in cache]
    if todo:
        fresh = tmdb.enrich(todo, country=country)
        for f in fresh:
            cache[str(f["tmdb_id"])] = f
        save_enrich_cache(cache)
    return [cache[str(i["tmdb_id"])] for i in items if str(i["tmdb_id"]) in cache]


def quiz_cli() -> dict:
    print("\nQuick mood quiz (press Enter to skip):", file=sys.stderr)

    def ask(label: str, opts: list[str]) -> str | None:
        opts_str = " / ".join(f"[{o[0]}]{o[1:]}" for o in opts)
        ans = input(f"  {label} ({opts_str}): ").strip().lower()
        if not ans:
            return None
        for o in opts:
            if ans == o or ans == o[0]:
                return o
        return None

    return {
        "time": ask("runtime", ["short", "medium", "long"]),
        "energy": ask("mode", ["engage", "unwind"]),
        "tone": ask("tone", ["dark", "light"]),
        "risk": ask("risk", ["safe", "discover"]),
        "company": ask("company", ["alone", "shared"]),
    }


def justwatch_url(film: dict, country: str) -> str:
    """Prefer TMDb's localized watch page (JustWatch-powered).
    Fallback: JustWatch search by title."""
    wp = film.get("providers") or {}
    if wp.get("link"):
        return wp["link"]
    # Fallback: JustWatch search
    import urllib.parse
    q = urllib.parse.quote(film.get("title", ""))
    return f"https://www.justwatch.com/{country.lower()}/buscar?q={q}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("user")
    ap.add_argument("--country", default="CL")
    ap.add_argument("--limit", type=int, default=30)
    ap.add_argument("--mood-json", help="JSON string with mood (skip quiz)")
    args = ap.parse_args()

    print(f"Fetching watchlist for @{args.user}...", file=sys.stderr)
    items = scrape.run(args.user, max_films=args.limit)
    print(f"Resolved {len(items)} films from Letterboxd", file=sys.stderr)

    print("Enriching with TMDb...", file=sys.stderr)
    enriched = enrich_with_cache(items, country=args.country)
    print(f"Enriched {len(enriched)} films", file=sys.stderr)

    if args.mood_json:
        m = json.loads(args.mood_json)
    else:
        m = quiz_cli()
    print(f"Mood: {m}", file=sys.stderr)

    top = moodmod.rank(enriched, m, top_n=3)
    print("\n=== Top 3 ===")
    for i, f in enumerate(top, 1):
        print(f"\n{i}. {f['title']} ({f.get('year') or '—'}) — {f.get('director') or '?'}")
        print(f"   score: {f['_score']}  · {', '.join(f['_reasons']) or 'no specific match'}")
        print(f"   {(f.get('runtime') or '?')}min · {', '.join(f.get('genres') or [])}")
        print(f"   📍 Ver dónde: {justwatch_url(f, args.country)}")
        print(f"   https://letterboxd.com/film/{f['slug']}/")


if __name__ == "__main__":
    main()
