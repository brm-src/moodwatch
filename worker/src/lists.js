// Moodwatch editorial list seeds.
// Durable alternative to live Letterboxd scraping: Workers + Letterboxd HTML is brittle.
// These are Letterboxd-style curated buckets, runtime source is TMDb IDs.

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
    slug: "terror-sin-jumpscares",
    name: "Horror without cheap jumpscares",
    signature: { trust: "horror", depth: ["thoughtful", "uneasy"], pace: ["slow", "steady"] },
    ids: [310131, 27374, 575776, 36095, 503919, 530385, 694, 805, 293670, 493922, 9552],
  },
  {
    slug: "cult-weird-discover",
    name: "Cult / weird discoveries",
    signature: { trust: "weird", risk: "discover" },
    ids: [513434, 220289, 431, 985, 8327, 662, 21484, 25623, 97370, 492, 8051, 115, 11830],
  },
  {
    slug: "sad-girl-cinema",
    name: "Sad girl / quiet damage",
    signature: { memory: ["heartbreak", "regret"], want: ["moved", "haunted"], depth: ["thoughtful", "ruined"] },
    ids: [965150, 666277, 531428, 38, 152601, 428449, 585378, 334541, 843, 414453, 976893],
  },
  {
    slug: "rainy-night-cinema",
    name: "Rainy night cinema",
    signature: { weather: ["rain", "fog", "winter"], window: ["rain", "city"], light: ["neon", "moon"] },
    ids: [1949, 949, 242582, 1018, 329865, 655, 807, 273481, 146233, 491584, 503919],
  },
  {
    slug: "sunday-anxiety",
    name: "Sunday anxiety",
    signature: { lately: ["restless", "stuck", "numb"], state: ["restless", "pensive"] },
    ids: [473033, 244786, 242582, 146233, 27205, 220289, 587792, 8051, 275, 86829],
  },
  {
    slug: "modern-romance-adult",
    name: "Modern adult romance",
    signature: { tone: "light", first_act: "drama_romance", temperature: "warm" },
    ids: [531428, 76, 80, 666277, 38, 152601, 122906, 284, 843, 1018, 587792],
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
    slug: "accion-sin-marvel",
    name: "Action without cape fatigue",
    signature: { first_act: "action_adventure", energy: "engage", avoid: "cliche" },
    ids: [353081, 76341, 562, 137113, 949, 273481, 106, 679, 603, 85, 1103, 218],
  },
  {
    slug: "warm-companion",
    name: "Warm companion films",
    signature: { tone: "light", energy: "unwind", want: ["soothed", "entertained"] },
    ids: [976893, 370755, 11830, 331482, 840430, 505192, 194, 122906, 587792, 773, 120467, 121986],
  },
  {
    slug: "comedia-con-alma",
    name: "Comedy with a soul",
    signature: { trust: "comedy", depth: ["fun", "warm"], want: "entertained" },
    ids: [275, 120467, 121986, 773, 115, 8051, 86829, 505600, 546554, 515001, 11830],
  },
  {
    slug: "documentary-truth",
    name: "Documentary / reality cuts",
    signature: { first_act: "discover", trust: "documentary" },
    ids: [682110, 123678, 128216, 501, 42044, 14275, 30017, 26317],
  },
  {
    slug: "latam-pulse",
    name: "Latin American pulse",
    signature: { language_pref: "spanish", risk: "discover" },
    ids: [496243, 11423, 491584, 30017, 655, 505192, 6977, 275, 431, 220289],
  },
  {
    slug: "clasicos-vivos",
    name: "Classics that still bite",
    signature: { decade: ["old", "70s"], depth: "thoughtful" },
    ids: [9552, 207, 655, 797, 346, 18148, 62, 780, 147, 238, 240, 348, 28],
  },
  {
    slug: "menos-de-dos-horas",
    name: "Under two hours, no filler",
    signature: { runtime: ["short", "medium"] },
    ids: [220289, 431, 513434, 505600, 546554, 587792, 370755, 976893, 10494, 9323, 275, 194],
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
