#!/usr/bin/env python3
"""Fetch hero backdrops from TMDb for the moodwatch hero pool.

Mixes color art-cinema (Wenders, WKW, Tarkovsky, etc.) with extra
public-domain silents (Metropolis, Nosferatu, Caligari, ...) and
prestige TV stills (Twin Peaks, Mad Men, etc.). Saves into
./assets/heroes/ and rewrites manifest.json from scratch.

Run from repo root:
    TMDB_API_KEY=... python3 scripts/fetch_heroes.py
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.themoviedb.org/3"
IMG = "https://image.tmdb.org/t/p/w1280"
KEY = os.environ.get("TMDB_API_KEY") or sys.argv[1] if len(sys.argv) > 1 else os.environ.get("TMDB_API_KEY")
if not KEY:
    sys.exit("set TMDB_API_KEY")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "heroes"
OUT.mkdir(parents=True, exist_ok=True)

# (title, year, max_backdrops, director_for_caption)
PICKS: list[tuple[str, int, int, str]] = [
    # Color — art cinema, paletas distintivas
    ("Paris, Texas", 1984, 2, "Wenders"),
    ("Wings of Desire", 1987, 2, "Wenders"),
    ("In the Mood for Love", 2000, 2, "Wong Kar-wai"),
    ("Chungking Express", 1994, 1, "Wong Kar-wai"),
    ("Stalker", 1979, 2, "Tarkovsky"),
    ("Three Colors: Blue", 1993, 1, "Kieślowski"),
    ("Days of Heaven", 1978, 2, "Malick"),
    ("Mulholland Drive", 2001, 1, "Lynch"),
    ("Stranger Than Paradise", 1984, 1, "Jarmusch"),
    ("Dead Man", 1995, 1, "Jarmusch"),
    ("Red Desert", 1964, 1, "Antonioni"),
    ("The Master", 2012, 1, "P.T. Anderson"),
    ("Don't Look Now", 1973, 1, "Roeg"),
    # Más cine arte / atmósferas distintivas
    ("Solaris", 1972, 1, "Tarkovsky"),
    ("The Mirror", 1975, 1, "Tarkovsky"),
    ("2001: A Space Odyssey", 1968, 2, "Kubrick"),
    ("Barry Lyndon", 1975, 1, "Kubrick"),
    ("The Tree of Life", 2011, 1, "Malick"),
    ("Lost in Translation", 2003, 1, "Coppola"),
    ("Drive", 2011, 1, "Refn"),
    ("Blade Runner 2049", 2017, 1, "Villeneuve"),
    ("Aftersun", 2022, 1, "Wells"),
    ("Past Lives", 2023, 1, "Song"),
    ("Portrait of a Lady on Fire", 2019, 1, "Sciamma"),
    ("Moonlight", 2016, 1, "Jenkins"),
    ("Phantom Thread", 2017, 1, "P.T. Anderson"),
    ("There Will Be Blood", 2007, 1, "P.T. Anderson"),
    ("The Assassination of Jesse James", 2007, 1, "Dominik"),
    ("Persona", 1966, 1, "Bergman"),
    ("The Seventh Seal", 1957, 1, "Bergman"),
    ("Tokyo Story", 1953, 1, "Ozu"),
    # Silents extra (los ya bajados se mantienen en disco; TMDb tiene buenos backdrops)
    ("Metropolis", 1927, 2, "Lang"),
    ("Nosferatu", 1922, 1, "Murnau"),
    ("The Cabinet of Dr. Caligari", 1920, 1, "Wiene"),
    ("Sunrise: A Song of Two Humans", 1927, 1, "Murnau"),
    ("M", 1931, 1, "Lang"),
    ("The Passion of Joan of Arc", 1928, 1, "Dreyer"),
]

# (title, year, max_backdrops, creator_for_caption)
TV_PICKS: list[tuple[str, int, int, str]] = [
    ("Twin Peaks: The Return", 2017, 2, "Lynch"),
    ("Mad Men", 2007, 1, "Weiner"),
    ("The Leftovers", 2014, 1, "Lindelof"),
    ("True Detective", 2014, 1, "Pizzolatto"),
    ("Chernobyl", 2019, 1, "Mazin"),
    ("Atlanta", 2016, 1, "Glover"),
    ("The Sopranos", 1999, 1, "Chase"),
    ("Better Call Saul", 2015, 1, "Gilligan"),
    # Más prestige TV
    ("The Wire", 2002, 1, "Simon"),
    ("Deadwood", 2004, 1, "Milch"),
    ("Succession", 2018, 1, "Armstrong"),
    ("Breaking Bad", 2008, 1, "Gilligan"),
    ("Fargo", 2014, 1, "Hawley"),
    ("The Bear", 2022, 1, "Storer"),
    ("Severance", 2022, 1, "Erickson"),
    ("Andor", 2022, 1, "Gilroy"),
    ("Reservation Dogs", 2021, 1, "Harjo"),
    ("Fleabag", 2016, 1, "Waller-Bridge"),
    ("BoJack Horseman", 2014, 1, "Bob-Waksberg"),
    ("Cowboy Bebop", 1998, 1, "Watanabe"),
    ("Arcane", 2021, 1, "Linke"),
    ("The Haunting of Hill House", 2018, 1, "Flanagan"),
]


def http_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def search(title: str, year: int) -> int | None:
    q = urllib.parse.urlencode({"api_key": KEY, "query": title, "year": year, "include_adult": "false"})
    data = http_json(f"{API}/search/movie?{q}")
    results = data.get("results") or []
    if not results:
        # retry without year
        q = urllib.parse.urlencode({"api_key": KEY, "query": title, "include_adult": "false"})
        data = http_json(f"{API}/search/movie?{q}")
        results = data.get("results") or []
    for r in results:
        rd = (r.get("release_date") or "")[:4]
        if rd and abs(int(rd) - year) <= 1:
            return r["id"]
    return results[0]["id"] if results else None


def search_tv(title: str, year: int) -> int | None:
    q = urllib.parse.urlencode({"api_key": KEY, "query": title, "first_air_date_year": year, "include_adult": "false"})
    data = http_json(f"{API}/search/tv?{q}")
    results = data.get("results") or []
    if not results:
        q = urllib.parse.urlencode({"api_key": KEY, "query": title, "include_adult": "false"})
        data = http_json(f"{API}/search/tv?{q}")
        results = data.get("results") or []
    for r in results:
        rd = (r.get("first_air_date") or "")[:4]
        if rd and abs(int(rd) - year) <= 1:
            return r["id"]
    return results[0]["id"] if results else None


def _score(b: dict):
    ar = (b.get("aspect_ratio") or 0) or 0
    ar_pen = abs(ar - 1.777)
    return (-(b.get("vote_average") or 0), ar_pen, -(b.get("width") or 0))


def backdrops(movie_id: int) -> list[dict]:
    q = urllib.parse.urlencode({"api_key": KEY, "include_image_language": "en,null"})
    data = http_json(f"{API}/movie/{movie_id}/images?{q}")
    bd = data.get("backdrops") or []
    bd.sort(key=_score)
    return bd


def tv_backdrops(tv_id: int) -> list[dict]:
    q = urllib.parse.urlencode({"api_key": KEY, "include_image_language": "en,null"})
    data = http_json(f"{API}/tv/{tv_id}/images?{q}")
    bd = data.get("backdrops") or []
    bd.sort(key=_score)
    return bd


def slug(title: str, year: int) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{s}-{year}"


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    req = urllib.request.Request(url, headers={"User-Agent": "moodwatch-heroes/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r, dest.open("wb") as f:
            f.write(r.read())
        return True
    except Exception as e:
        print(f"  ! download failed: {e}")
        return False


def fetch_set(picks, search_fn, images_fn, label):
    new_files: list[tuple[str, str]] = []
    for title, year, n, author in picks:
        print(f"[{label}] [{title} · {year}]")
        try:
            mid = search_fn(title, year)
        except Exception as e:
            print(f"  search error: {e}")
            continue
        if not mid:
            print("  not found"); continue
        try:
            bd = images_fn(mid)
        except Exception as e:
            print(f"  images error: {e}"); continue
        if not bd:
            print("  no backdrops"); continue
        chosen = bd[:n]
        base = slug(title, year)
        caption = f"{title} · {author} · {year}"
        for i, b in enumerate(chosen):
            path = b["file_path"]
            ext = Path(path).suffix or ".jpg"
            fname = f"{base}-{i:02d}{ext}"
            dest = OUT / fname
            ok = download(IMG + path, dest)
            if ok:
                new_files.append((fname, caption))
                print(f"  + {fname}")
            time.sleep(0.15)
    return new_files


def main() -> int:
    new_files: list[tuple[str, str]] = []
    new_files += fetch_set(PICKS, search, backdrops, "movie")
    new_files += fetch_set(TV_PICKS, search_tv, tv_backdrops, "tv")

    # Rebuild manifest: keep all existing files (silents already on disk) + new color/silents/tv.
    existing = sorted(p.name for p in OUT.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    existing_captions = {}
    # Try to preserve existing captions from old manifest
    old = OUT / "manifest.json"
    if old.exists():
        try:
            for entry in json.loads(old.read_text()):
                fname = Path(entry["file"]).name
                existing_captions[fname] = entry.get("caption", "")
        except Exception:
            pass
    for fname, cap in new_files:
        existing_captions[fname] = cap

    manifest = []
    for fname in existing:
        cap = existing_captions.get(fname, "")
        manifest.append({"file": f"./assets/heroes/{fname}", "caption": cap})
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    print(f"\nmanifest entries: {len(manifest)}")
    print(f"new files added: {len(new_files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
