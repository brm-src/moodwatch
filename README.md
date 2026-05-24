# moodwatch

> A mood-based pick. Free, no signup. Optionally personalize with your Letterboxd watchlist.

Pick a mood in five quick taps. Get a film. See where to stream it in your country. That's it.

If you have a Letterboxd account, paste your username and the picks come from your own watchlist instead of the wider catalog.

## How it works

- Your browser sends mood answers + country (auto-detected from your locale)
- A small backend queries [TMDb](https://www.themoviedb.org) for candidates and watch providers
- A scoring function ranks results
- A "Where to watch" button takes you to JustWatch for the country detected
- If you opt in, your Letterboxd watchlist is read once (publicly) to filter against

No tracking, no accounts, no data stored.

## Stack

- Vanilla HTML / CSS / JS (no framework)
- i18n: auto EN / ES from `navigator.language`
- Backend: Cloudflare Worker
- Data: TMDb v3 API + Letterboxd public HTML

## Local dev

```bash
git clone https://github.com/brm-src/moodwatch
cd moodwatch
python3 -m http.server -d public 8080
```

Open `http://localhost:8080`. The UI works without a backend; recommendations need the Worker.

## License

MIT
