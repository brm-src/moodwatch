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
    ids: [310131, 27374, 575776, 36095, 503919, 530385, 694, 805, 293670, 493922, 9552, 931, 16372, 1933, 27324, 21506, 6537, 13310, 1433, 242224, 270303, 334536, 409297, 306947, 474764, 547565, 539181, 472269, 466565, 371560, 13550, 8740, 16093, 18333, 3763, 30959, 18352, 11482, 11481, 21484, 16307, 24923, 11020, 116811, 25983, 10972, 994143, 740049, 516632, 575774, 375012, 4552, 660942, 401898, 399057, 74725, 2667],
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
    ids: [1949, 949, 242582, 1018, 329865, 655, 807, 273481, 146233, 491584, 503919, 78, 11423, 843, 11220, 11104, 64690, 1538, 414906, 2666, 36095, 27324, 705996, 290098, 65754, 592, 466, 1847, 5511, 11657, 11524, 152603, 370755, 153, 10843, 103, 1092, 1093, 934, 426, 567, 593, 1398, 1600, 582, 9008, 4566, 16858, 1791],
  },
  {
    slug: "sunday-anxiety",
    name: "Sunday anxiety",
    signature: { lately: ["restless", "stuck", "numb"], state: ["restless", "pensive"] },
    ids: [473033, 244786, 242582, 146233, 27205, 220289, 587792, 8051, 275, 86829, 429200, 664300, 2757, 4960, 798286, 10843, 660120, 121986, 37247, 10707, 309245, 396398, 291270, 146015, 181886, 64720, 458737, 254320, 152601, 153, 62215, 32646, 627463, 323929, 14976, 414453, 965150, 75233, 309, 265189, 103663, 580175, 3782, 30020, 2593, 21450, 12573, 290, 48303, 179144, 554230],
  },
  {
    slug: "modern-romance-adult",
    name: "Modern adult romance",
    signature: { tone: "light", first_act: "drama_romance", temperature: "warm" },
    ids: [531428, 76, 80, 666277, 38, 152601, 122906, 284, 843, 1018, 587792],
  },
  {
    slug: "animacion-adulta-anime",
    name: "Adult animation / anime",
    signature: { trust: "animation" },
    ids: [10494, 9323, 128, 129, 149, 378064, 10315, 324857, 569094, 12477, 662, 4977, 33320, 13398, 14069, 28874, 110420, 149871, 242828, 372058, 482150, 475215, 568160, 776305, 916224, 783675, 378108, 337703, 8885, 2011, 9662, 16306, 9081, 3509, 291270, 339877, 680813, 586940, 712454, 846867, 795522, 838240, 961323, 823219, 589026, 508883, 586810],
  },
  {
    slug: "80s-action-retro",
    name: "80s action / retro charge",
    signature: { decade: ["80s", "70s"], first_act: "action_adventure" },
    ids: [1103, 106, 562, 5548, 218, 679, 6978, 603, 85, 76341, 137113, 353081],
  },
  {
    slug: "accion-sin-capas",
    name: "Action without cape fatigue",
    signature: { first_act: "action_adventure", energy: "engage", avoid: "cliche" },
    ids: [353081, 76341, 562, 137113, 949, 273481, 106, 679, 603, 85, 1103, 218, 94329, 180299, 49049, 245891, 603692, 575264, 500664, 449992, 9316, 9056, 11782, 10835, 11471, 79, 9550, 146, 58857, 51608, 437109, 396535, 110415, 1538, 8195, 1089, 1637, 36955, 754, 1701, 9802, 2501, 2503, 36557, 37724, 339403, 341013, 615457],
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
    ids: [275, 120467, 121986, 773, 115, 8051, 86829, 505600, 546554, 515001, 11830, 284, 343, 10322, 11235, 12626, 12186, 137, 9427, 11545, 9451, 243, 194, 245, 1584, 9675, 7326, 6615, 8321, 77338, 67913, 246741, 234200, 371645, 334533, 346648, 402897, 587792, 597219, 718032, 840430, 1049638, 986054, 869626, 913814, 338],
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
    ids: [598, 1391, 426426, 25376, 265195, 55, 1653, 110398, 351454, 429191, 160068, 319995, 27567, 8898, 58429, 326382, 18079, 13653, 666, 7347, 446159, 377273, 310569, 97989, 336808, 438146, 417466, 499537, 991708, 617708, 349067, 477654, 256057, 582927, 670981, 653658, 12086, 33774, 56815, 989589, 653756, 72721, 319994, 499152, 543760, 186976, 320001, 29263, 42148, 67612, 29264, 800],
  },
  {
    slug: "chile-cono-sur",
    name: "Chile / Southern Cone",
    signature: { language_pref: "spanish", region: ["chile", "cono_sur"], risk: "discover" },
    ids: [12086, 110398, 351454, 429191, 160068, 491473, 27567, 33774, 56815, 319995, 991708, 653756, 72721, 319994, 989589, 540709, 716612, 376866, 29263, 18079, 265195, 25376, 13653, 58429, 8898, 326382, 714888, 352161, 514575, 36971, 408537, 67884, 499152, 916405, 188761, 336664, 118204, 11148, 26864, 47261, 1653],
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
  {
    slug: "no-phone-cinema",
    name: "Films that make you forget the phone",
    signature: { attention: "no_phone", want: ["engrossed", "haunted", "moved"], depth: ["thoughtful", "ruined"] },
    ids: [62, 28, 947, 346, 238, 240, 7345, 6977, 9693, 496243, 11423, 290098, 491584, 705996, 758866, 204, 38985, 25237, 598, 670, 582, 103663, 531428, 1791, 279, 16858, 10774, 968, 829, 592, 1949, 949, 769, 524, 1422, 146233, 273481, 329865, 264660, 300668, 467244],
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
  const maxScore = matches.reduce((m, x) => Math.max(m, x.score), 0);
  const filtered = maxScore > 1 ? matches.filter(x => x.score > 1) : matches;
  filtered.sort((a, b) => b.score - a.score);
  return filtered.slice(0, 3);
}
