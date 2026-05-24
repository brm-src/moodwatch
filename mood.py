"""Mood-to-film scoring.

Pure function: takes mood answers + a list of enriched film dicts
(from tmdb.enrich) and returns ranked recommendations.

Mood answers schema (all optional):
    {
        "time": "short" | "medium" | "long",      # runtime preference
        "energy": "engage" | "unwind",            # think vs disconnect
        "tone": "dark" | "light",                 # vibe
        "risk": "safe" | "discover",              # known vs new
        "company": "alone" | "shared",            # solo vs companion
    }
"""
from __future__ import annotations

# Genre/keyword weights per mood axis. Tuned by hand, not ML.
ENGAGE_GENRES = {"Drama", "Documentary", "History", "Mystery", "War"}
UNWIND_GENRES = {"Comedy", "Animation", "Family", "Adventure", "Action"}

DARK_GENRES = {"Horror", "Thriller", "Crime", "War", "Mystery"}
LIGHT_GENRES = {"Comedy", "Family", "Animation", "Romance", "Adventure"}

DARK_KW = {"murder", "death", "violence", "trauma", "grief", "war", "loss"}
LIGHT_KW = {"friendship", "love", "coming of age", "musical", "holiday"}

SHARED_GENRES = {"Comedy", "Action", "Adventure", "Animation", "Family"}
ALONE_GENRES = {"Drama", "Mystery", "Documentary", "Romance"}


def _runtime_score(runtime: int | None, want: str | None) -> float:
    if runtime is None or want is None:
        return 0.0
    if want == "short" and runtime <= 95:
        return 1.0
    if want == "medium" and 95 < runtime <= 130:
        return 1.0
    if want == "long" and runtime > 130:
        return 1.0
    # near miss
    return 0.3


def _genre_overlap(genres: list[str], target: set[str]) -> float:
    if not genres:
        return 0.0
    return len(set(genres) & target) / max(1, len(genres))


def _keyword_overlap(keywords: list[str], target: set[str]) -> float:
    if not keywords:
        return 0.0
    return min(1.0, len(set(map(str.lower, keywords)) & target) / 3)


def _risk_score(popularity: float | None, vote_count: int | None, want: str | None) -> float:
    if want is None:
        return 0.0
    pop = popularity or 0
    votes = vote_count or 0
    well_known = pop > 20 or votes > 5000
    if want == "safe":
        return 1.0 if well_known else 0.2
    if want == "discover":
        return 1.0 if not well_known else 0.2
    return 0.5


def score(film: dict, mood: dict) -> tuple[float, list[str]]:
    """Return (total_score, reasons[])."""
    reasons: list[str] = []
    total = 0.0

    # Time
    s = _runtime_score(film.get("runtime"), mood.get("time"))
    if s:
        total += s * 1.0
        if s == 1.0:
            reasons.append(f"runtime ok ({film['runtime']}min)")

    genres = film.get("genres") or []
    keywords = film.get("keywords") or []

    # Energy
    if mood.get("energy") == "engage":
        s = _genre_overlap(genres, ENGAGE_GENRES)
    elif mood.get("energy") == "unwind":
        s = _genre_overlap(genres, UNWIND_GENRES)
    else:
        s = 0
    if s > 0:
        total += s * 1.5
        reasons.append("matches energy")

    # Tone
    if mood.get("tone") == "dark":
        s = _genre_overlap(genres, DARK_GENRES) + _keyword_overlap(keywords, DARK_KW)
    elif mood.get("tone") == "light":
        s = _genre_overlap(genres, LIGHT_GENRES) + _keyword_overlap(keywords, LIGHT_KW)
    else:
        s = 0
    if s > 0:
        total += s * 1.5
        reasons.append("matches tone")

    # Risk
    s = _risk_score(film.get("popularity"), film.get("vote_count"), mood.get("risk"))
    if s > 0:
        total += s * 0.8
        if s == 1.0:
            reasons.append("known" if mood.get("risk") == "safe" else "off-the-radar")

    # Company
    if mood.get("company") == "shared":
        s = _genre_overlap(genres, SHARED_GENRES)
    elif mood.get("company") == "alone":
        s = _genre_overlap(genres, ALONE_GENRES)
    else:
        s = 0
    if s > 0:
        total += s * 0.7

    # Slight quality boost
    va = film.get("vote_avg") or 0
    if va >= 7.5:
        total += 0.3
        reasons.append("well rated")

    return total, reasons


def rank(films: list[dict], mood: dict, top_n: int = 3) -> list[dict]:
    scored = []
    for f in films:
        s, why = score(f, mood)
        scored.append({**f, "_score": round(s, 2), "_reasons": why})
    scored.sort(key=lambda x: x["_score"], reverse=True)
    return scored[:top_n]
