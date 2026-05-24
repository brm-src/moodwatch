"""TMDb v3 client — minimal, only what the picker needs.

Required: TMDB_API_KEY env var (free at themoviedb.org/settings/api).
"""
from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from typing import Any

API = "https://api.themoviedb.org/3"


def _get(path: str, **params: Any) -> dict:
    key = os.environ.get("TMDB_API_KEY")
    if not key:
        raise RuntimeError("TMDB_API_KEY not set")
    params["api_key"] = key
    url = f"{API}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def movie_details(tmdb_id: int) -> dict:
    """Genres, runtime, overview, popularity, vote stats, keywords."""
    return _get(f"/movie/{tmdb_id}", append_to_response="keywords")


def watch_providers(tmdb_id: int, country: str = "CL") -> dict:
    """Where to stream/rent/buy in a given country.

    Returns dict with keys 'flatrate', 'rent', 'buy', 'free', each a list
    of {provider_name, logo_path}. Empty if not available in country.
    """
    raw = _get(f"/movie/{tmdb_id}/watch/providers")
    return raw.get("results", {}).get(country, {})


def enrich(items: list[dict], country: str = "CL") -> list[dict]:
    """Add TMDb details + providers to each item from scrape.run()."""
    out = []
    for it in items:
        tid = it["tmdb_id"]
        try:
            d = movie_details(tid)
            wp = watch_providers(tid, country)
        except Exception as e:
            it["tmdb_error"] = str(e)
            out.append(it)
            continue
        it["genres"] = [g["name"] for g in d.get("genres", [])]
        it["runtime"] = d.get("runtime")
        it["overview"] = d.get("overview")
        it["popularity"] = d.get("popularity")
        it["vote_avg"] = d.get("vote_average")
        it["vote_count"] = d.get("vote_count")
        it["keywords"] = [k["name"] for k in d.get("keywords", {}).get("keywords", [])]
        it["providers"] = wp
        out.append(it)
    return out
