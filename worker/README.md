# moodwatch-api

Cloudflare Worker backend for [moodwatch](https://brm-src.github.io/moodwatch/).
Mood object in, ranked films out.

## Endpoints

- `GET /health` → `{ok: true}`
- `GET /recommend?country=CL&lang=es&mood=<base64>&user=<lb_user>?` → `{films: [...]}`

## Setup

```bash
npm install
npx wrangler login                       # one-time browser auth
npx wrangler kv namespace create CACHE   # creates KV; paste id into wrangler.toml
npx wrangler secret put TMDB_API_KEY     # paste your TMDb v3 key
npx wrangler deploy                       # deploys to <name>.<account>.workers.dev
```

## Local dev

```bash
echo "TMDB_API_KEY=YOUR_KEY" > .dev.vars
npx wrangler dev
# curl "http://localhost:8787/recommend?country=US&lang=en&mood=$(echo -n '{"tone":"dark"}' | base64)"
```

## Files

- `src/index.js` — request router, CORS, recommend pipeline
- `src/mood.js` — mood object → TMDb /discover params + candidate pool
- `src/tmdb.js` — TMDb v3 client with edge cache
- `src/letterboxd.js` — watchlist scraper (slug → TMDb id, KV-cached)
- `src/curated.js` — editorial picks; matched candidates get boosted

## CORS

Allowed origins are in `wrangler.toml` under `[vars] ALLOWED_ORIGINS`.
Comma-separated; `*` allows everything (don't ship that).
