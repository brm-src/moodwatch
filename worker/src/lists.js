// Moodwatch editorial lists.
// These replace live Letterboxd scraping: LB list pages are unstable/blocked from Workers
// (403/404), so we use verified TMDb IDs as durable "list seeds" and tag hits with
// `from_list`. The spirit is Letterboxd-style curation; the runtime source is TMDb.

export const LISTS = [
  {
    slug: "slow-cinema-contemplative",
    name: "Slow / contemplative cinema",
    signature: { depth: ["thoughtful", "ruined"], temperature: ["cool", "freezing"], pace: ["slow"] },
    ids: [1398, 593, 81401, 414453, 30020, 655, 797, 18148, 780, 147, 329865, 531428, 428449, 585378],
  },
  {
    slug: "neo-noir-thriller",
    name: "Noir / moral thriller",
    signature: { tone: "dark", energy: "engage", first_act: ["thriller_horror", "action_adventure"] },
    ids: [949, 1949, 807, 473033, 146233, 242582, 273481, 1422, 395834, 6977, 769, 49797, 11423],
  },
  {
    slug: "folk-atmospheric-horror",
    name: "Folk / atmospheric horror",
    signature: { trust: "horror", tone: "dark", first_act: "thriller_horror" },
    ids: [310131, 493922, 530385, 503919, 694, 805, 36095, 27374, 575776, 9539, 9552, 293670, 21484],
  },
  {
    slug: "cult-weird-discover",
    name: "Cult / weird discoveries",
    signature: { trust: "weird", risk: "discover" },
    ids: [513434, 220289, 431, 985, 8327, 662, 21484, 25623, 97370, 492, 8051, 115, 11830],
  },
  {
    slug: "modern-romance-adult",
    name: "Modern adult romance",
    signature: { tone: "light", first_act: "drama_romance", temperature: "warm" },
    ids: [531428, 76, 80, 666277, 1011985, 38, 152601, 155341, 284, 843, 1018],
  },
  {
    slug: "adult-animation-anime",
    name: "Adult animation / anime",
    signature: { trust: "animation" },
    ids: [10494, 9323, 128, 129, 149, 378064, 10315, 324857, 569094, 12477, 662],
  },
  {
    slug: "80s-action-retro",
    name: "80s action / retro charge",
    signature: { decade: ["80s", "70s"], first_act: "action_adventure" },
    ids: [1103, 106, 562, 5548, 218, 679, 6978, 603, 85, 76341, 137113, 353081],
  },
  {
    slug: "warm-companion",
    name: "Warm companion films",
    signature: { tone: "light", energy: "unwind", want: ["calm", "comfort"] },
    ids: [976893, 370755, 11830, 331482, 840430, 505192, 194, 155341, 615173, 773, 120467, 121986],
  },
  {
    slug: "documentary-truth",
    name: "Documentary / reality cuts",
    signature: { first_act: "discover", trust: "documentary" },
    ids: [721589, 123678, 128216, 501, 42044, 14275, 30017, 26317],
  },
  {
    slug: "classics-still-alive",
    name: "Classics that still bite",
    signature: { decade: ["old", "70s"], depth: "thoughtful" },
    ids: [9552, 207, 655, 797, 346, 18148, 62, 780, 147, 238, 240, 348, 28],
  },
];

function matchesValue(want, got) {
  if (got == null) return false;
  if (Array.isArray(want)) return want.includes(got);
  return want === got;
}

export function matchLists(mood) {
  const matches = [];
  for (const list of LISTS) {
    const sig = list.signature || {};
    let score = 0;
    for (const [k, want] of Object.entries(sig)) {
      if (matchesValue(want, mood[k])) score++;
    }
    if (score > 0) matches.push({ list, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 3);
}
