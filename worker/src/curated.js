// Editorial picks. When a candidate matches one of these by TMDb ID, it gets
// boosted in ranking and the note appears as a small badge on the card.
// Add as you go — leave empty to start.

export const CURATED = [
  // Examples (commented out — fill in real picks):
  // { id: 496243, note: "Bong's class war as comedy of manners. Stays under your skin." },
  // { id: 27205,  note: "Layered like a dream. Watch with subtitles, no phone." },
];

const _byId = new Map(CURATED.map(c => [c.id, c]));
export function curatedFor(tmdbId) {
  return _byId.get(tmdbId) || null;
}
