// Unit tests for scorer.js — pure function, no env/network needed.
import { describe, it, expect } from "vitest";
import { fitScore } from "../src/scorer.js";

const baseFilm = (overrides = {}) => ({
  id: 999999,
  title: "Test",
  vote_count: 5000,
  vote_average: 7.5,
  popularity: 30,
  release_date: "2020-01-01",
  genres: [],
  genre_ids: [],
  ...overrides,
});

describe("fitScore — tone/energy axis", () => {
  it("dark + thriller boosts crime/thriller films", () => {
    const f = baseFilm({ genre_ids: [53, 80] }); // thriller, crime
    const score = fitScore(f, { tone: "dark" });
    expect(score).toBeGreaterThan(0);
  });

  it("light + comedy boosts comedy films", () => {
    const f = baseFilm({ genre_ids: [35] });
    const score = fitScore(f, { tone: "light" });
    expect(score).toBeGreaterThan(0);
  });

  it("light tone does NOT boost animation (opt-in only)", () => {
    const animation = baseFilm({ genre_ids: [16] });
    const comedy = baseFilm({ genre_ids: [35] });
    const lightMood = { tone: "light", energy: "unwind" };
    expect(fitScore(animation, lightMood)).toBeLessThan(fitScore(comedy, lightMood));
  });

  it("trust=animation explicitly boosts animation", () => {
    const f = baseFilm({ genre_ids: [16] });
    expect(fitScore(f, { trust: "animation" })).toBeGreaterThan(0);
  });
});

describe("fitScore — horror dual-intensity", () => {
  it("engage + horror boosts hard horror (genre 27)", () => {
    const hardHorror = baseFilm({ genre_ids: [27] });
    const softMystery = baseFilm({ genre_ids: [9648, 53] });
    const mood = { trust: "horror", energy: "engage" };
    expect(fitScore(hardHorror, mood)).toBeGreaterThan(fitScore(softMystery, mood));
  });

  it("unwind + horror boosts soft suspense (Wednesday-tier)", () => {
    const hardHorror = baseFilm({ genre_ids: [27] });
    const softMystery = baseFilm({ genre_ids: [9648, 53] });
    const mood = { trust: "horror", energy: "unwind" };
    expect(fitScore(softMystery, mood)).toBeGreaterThan(fitScore(hardHorror, mood));
  });
});

describe("fitScore — popularity floor (TV-stricter)", () => {
  it("TV with <200 votes gets penalized (-3)", () => {
    const niche = baseFilm({ _media: "tv", vote_count: 100, first_air_date: "2023-01-01" });
    const proven = baseFilm({ _media: "tv", vote_count: 1500, first_air_date: "2023-01-01" });
    expect(fitScore(niche, {})).toBeLessThan(fitScore(proven, {}));
    expect(fitScore(niche, {}) - fitScore(proven, {})).toBeLessThan(-2.0);
  });

  it("curated picks bypass popularity floor", () => {
    const curatedNiche = baseFilm({
      _media: "tv", vote_count: 50, first_air_date: "2023-01-01",
      _curated: { note: "x" },
    });
    const score = fitScore(curatedNiche, {});
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("IMDB-tier picks bypass popularity floor", () => {
    // 60574 = Peaky Blinders, in TV_S
    const tierTV = baseFilm({
      id: 60574, _media: "tv", vote_count: 100, first_air_date: "2013-01-01",
    });
    const score = fitScore(tierTV, {});
    expect(score).toBeGreaterThan(0);
  });
});

describe("fitScore — IMDB-tier boost", () => {
  it("static tier-S TV gets boost over baseline", () => {
    // 60574 = Peaky Blinders (TV_S). Compare against generic film with same stats.
    const baseline = baseFilm({ id: 99999998, vote_count: 1500, vote_average: 7.5, _media: "tv", first_air_date: "2013-01-01" });
    const champion = baseFilm({ id: 60574, vote_count: 1500, vote_average: 7.5, _media: "tv", first_air_date: "2013-01-01" });
    expect(fitScore(champion, {})).toBeGreaterThan(fitScore(baseline, {}));
  });

  it("live heuristic still works for high-vote films not in static tier", () => {
    const champion = baseFilm({ id: 99999999, vote_count: 12000, vote_average: 8.0, _media: "tv" });
    const score = fitScore(champion, {});
    expect(score).toBeGreaterThan(0);
  });
});

describe("fitScore — era bias", () => {
  it("pre-1960 films get heavy penalty when not requested", () => {
    const old = baseFilm({ release_date: "1955-01-01", vote_count: 5000, vote_average: 7.5 });
    const score = fitScore(old, {});
    expect(score).toBeLessThan(0);
  });

  it("decade=old removes era penalty", () => {
    const old = baseFilm({ release_date: "1955-01-01", vote_count: 5000, vote_average: 7.5 });
    const penalized = fitScore(old, {});
    const allowed = fitScore(old, { decade: "old" });
    expect(allowed).toBeGreaterThan(penalized);
  });
});

describe("fitScore — runtime", () => {
  it("short mood + 90min film gets boost", () => {
    const short = baseFilm({ runtime: 90 });
    expect(fitScore(short, { runtime: "short" })).toBeGreaterThan(0);
  });

  it("short mood does not boost long films", () => {
    const long = baseFilm({ runtime: 180 });
    const short = baseFilm({ runtime: 90 });
    expect(fitScore(short, { runtime: "short" })).toBeGreaterThan(fitScore(long, { runtime: "short" }));
  });
});
