// moodwatch — ritual flow with question pool + procedural ink blots.
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const API_BASE = (window.MOODWATCH_API || "/api").replace(/\/$/, "");

  // ────────────────────────────────────────────────────────────
  // QUESTION BANK
  // Each entry is one *category*. Per session we pick 5–6 random
  // categories + the mandatory "ink" question (always last).
  // ────────────────────────────────────────────────────────────
  const BANK = {
    state: {
      key: "state", kind: "real", titleKey: "q_state_t",
      options: [
        { value: "drained",  labelKey: "q_state_drained"  },
        { value: "restless", labelKey: "q_state_restless" },
        { value: "pensive",  labelKey: "q_state_pensive"  },
        { value: "good",     labelKey: "q_state_good"     },
      ],
    },
    door: {
      key: "door", kind: "doors", titleKey: "q_door_t",
      options: [
        { value: "intensity", labelKey: "q_door_intensity", svg: "door-red" },
        { value: "mystery",   labelKey: "q_door_mystery",   svg: "door-old" },
        { value: "fantasy",   labelKey: "q_door_fantasy",   svg: "door-sky" },
        { value: "intimacy",  labelKey: "q_door_intimacy",  svg: "door-warm" },
      ],
    },
    scene: {
      key: "scene", kind: "real", titleKey: "q_scene_t",
      options: [
        { value: "road",      labelKey: "q_scene_road"      },
        { value: "city",      labelKey: "q_scene_city"      },
        { value: "house",     labelKey: "q_scene_house"     },
        { value: "dialogue",  labelKey: "q_scene_dialogue"  },
        { value: "survival",  labelKey: "q_scene_survival"  },
        { value: "discovery", labelKey: "q_scene_discovery" },
      ],
    },
    intent: {
      key: "intent", kind: "real", titleKey: "q_intent_t",
      options: [
        { value: "escape",  labelKey: "q_intent_escape"  },
        { value: "feel",    labelKey: "q_intent_feel"    },
        { value: "think",   labelKey: "q_intent_think"   },
        { value: "company", labelKey: "q_intent_company" },
      ],
    },
    depth: {
      key: "depth", kind: "real", titleKey: "q_depth_t",
      options: [
        { value: "fun",        labelKey: "q_depth_fun"        },
        { value: "warm",       labelKey: "q_depth_warm"       },
        { value: "thoughtful", labelKey: "q_depth_thoughtful" },
        { value: "uneasy",     labelKey: "q_depth_uneasy"     },
        { value: "ruined",     labelKey: "q_depth_ruined"     },
      ],
    },
    weather: {
      key: "weather", kind: "real", titleKey: "q_weather_t",
      options: [
        { value: "rain",   labelKey: "q_weather_rain"   },
        { value: "fog",    labelKey: "q_weather_fog"    },
        { value: "sun",    labelKey: "q_weather_sun"    },
        { value: "storm",  labelKey: "q_weather_storm"  },
        { value: "winter", labelKey: "q_weather_winter" },
      ],
    },
    sound: {
      key: "sound", kind: "real", titleKey: "q_sound_t",
      options: [
        { value: "silence", labelKey: "q_sound_silence" },
        { value: "voices",  labelKey: "q_sound_voices"  },
        { value: "music",   labelKey: "q_sound_music"   },
        { value: "noise",   labelKey: "q_sound_noise"   },
      ],
    },
    company: {
      key: "company", kind: "real", titleKey: "q_company_t",
      options: [
        { value: "alone",  labelKey: "q_company_alone"  },
        { value: "shared", labelKey: "q_company_shared" },
        { value: "stray",  labelKey: "q_company_stray"  },
      ],
    },
    pace: {
      key: "pace", kind: "real", titleKey: "q_pace_t",
      options: [
        { value: "slow",   labelKey: "q_pace_slow"   },
        { value: "steady", labelKey: "q_pace_steady" },
        { value: "fast",   labelKey: "q_pace_fast"   },
      ],
    },
    ending: {
      key: "ending", kind: "real", titleKey: "q_ending_t",
      options: [
        { value: "closed", labelKey: "q_ending_closed" },
        { value: "open",   labelKey: "q_ending_open"   },
        { value: "twist",  labelKey: "q_ending_twist"  },
        { value: "bitter", labelKey: "q_ending_bitter" },
      ],
    },
    color: {
      key: "color", kind: "real", titleKey: "q_color_t",
      options: [
        { value: "blood",  labelKey: "q_color_blood"  },
        { value: "neon",   labelKey: "q_color_neon"   },
        { value: "gold",   labelKey: "q_color_gold"   },
        { value: "ocean",  labelKey: "q_color_ocean"  },
        { value: "ash",    labelKey: "q_color_ash"    },
        { value: "earth",  labelKey: "q_color_earth"  },
      ],
    },
    light: {
      key: "light", kind: "real", titleKey: "q_light_t",
      options: [
        { value: "golden",      labelKey: "q_light_golden"      },
        { value: "fluorescent", labelKey: "q_light_fluorescent" },
        { value: "candle",      labelKey: "q_light_candle"      },
        { value: "neon",        labelKey: "q_light_neon"        },
        { value: "moon",        labelKey: "q_light_moon"        },
      ],
    },
    texture: {
      key: "texture", kind: "real", titleKey: "q_texture_t",
      options: [
        { value: "silk",     labelKey: "q_texture_silk"     },
        { value: "sandpaper",labelKey: "q_texture_sandpaper"},
        { value: "wet",      labelKey: "q_texture_wet"      },
        { value: "wood",     labelKey: "q_texture_wood"     },
        { value: "glass",    labelKey: "q_texture_glass"    },
      ],
    },
    decade: {
      key: "decade", kind: "real", titleKey: "q_decade_t",
      options: [
        { value: "old",  labelKey: "q_decade_old"  },
        { value: "70s",  labelKey: "q_decade_70s"  },
        { value: "90s",  labelKey: "q_decade_90s"  },
        { value: "00s",  labelKey: "q_decade_00s"  },
        { value: "now",  labelKey: "q_decade_now"  },
        { value: "any",  labelKey: "q_decade_any"  },
      ],
    },
    place: {
      key: "place", kind: "real", titleKey: "q_place_t",
      options: [
        { value: "town",      labelKey: "q_place_town"      },
        { value: "metropolis",labelKey: "q_place_metropolis"},
        { value: "forest",    labelKey: "q_place_forest"    },
        { value: "abandoned", labelKey: "q_place_abandoned" },
        { value: "nowhere",   labelKey: "q_place_nowhere"   },
        { value: "interior",  labelKey: "q_place_interior"  },
      ],
    },
    memory: {
      key: "memory", kind: "real", titleKey: "q_memory_t",
      options: [
        { value: "childhood", labelKey: "q_memory_childhood" },
        { value: "heartbreak",labelKey: "q_memory_heartbreak"},
        { value: "triumph",   labelKey: "q_memory_triumph"   },
        { value: "regret",    labelKey: "q_memory_regret"    },
        { value: "wonder",    labelKey: "q_memory_wonder"    },
      ],
    },
    want: {
      key: "want", kind: "real", titleKey: "q_want_t",
      options: [
        { value: "moved",      labelKey: "q_want_moved"      },
        { value: "entertained",labelKey: "q_want_entertained"},
        { value: "challenged", labelKey: "q_want_challenged" },
        { value: "soothed",    labelKey: "q_want_soothed"    },
        { value: "haunted",    labelKey: "q_want_haunted"    },
      ],
    },
    avoid: {
      key: "avoid", kind: "real", titleKey: "q_avoid_t",
      options: [
        { value: "violence",  labelKey: "q_avoid_violence"  },
        { value: "romance",   labelKey: "q_avoid_romance"   },
        { value: "cliche",    labelKey: "q_avoid_cliche"    },
        { value: "slow",      labelKey: "q_avoid_slow"      },
        { value: "weird",     labelKey: "q_avoid_weird"     },
        { value: "nothing",   labelKey: "q_avoid_nothing"   },
      ],
    },
    animal: {
      key: "animal", kind: "real", titleKey: "q_animal_t",
      options: [
        { value: "cat",  labelKey: "q_animal_cat"  },
        { value: "wolf", labelKey: "q_animal_wolf" },
        { value: "fish", labelKey: "q_animal_fish" },
        { value: "bird", labelKey: "q_animal_bird" },
        { value: "fox",  labelKey: "q_animal_fox"  },
      ],
    },
    lately: {
      key: "lately", kind: "real", titleKey: "q_lately_t",
      options: [
        { value: "restless", labelKey: "q_lately_restless" },
        { value: "numb",     labelKey: "q_lately_numb"     },
        { value: "electric", labelKey: "q_lately_electric" },
        { value: "lonely",   labelKey: "q_lately_lonely"   },
        { value: "hopeful",  labelKey: "q_lately_hopeful"  },
        { value: "stuck",    labelKey: "q_lately_stuck"    },
      ],
    },
    risk_taste: {
      key: "risk_taste", kind: "real", titleKey: "q_risktaste_t",
      options: [
        { value: "classic",   labelKey: "q_risktaste_classic"   },
        { value: "gem",       labelKey: "q_risktaste_gem"       },
        { value: "weird",     labelKey: "q_risktaste_weird"     },
        { value: "cult",      labelKey: "q_risktaste_cult"      },
        { value: "hate_maybe",labelKey: "q_risktaste_hate"      },
      ],
    },
    smell: {
      key: "smell", kind: "real", titleKey: "q_smell_t",
      options: [
        { value: "coffee",    labelKey: "q_smell_coffee"    },
        { value: "petrichor", labelKey: "q_smell_petrichor" },
        { value: "smoke",     labelKey: "q_smell_smoke"     },
        { value: "sea",       labelKey: "q_smell_sea"       },
        { value: "old_paper", labelKey: "q_smell_old_paper" },
      ],
    },
    window: {
      key: "window", kind: "real", titleKey: "q_window_t",
      options: [
        { value: "rain",    labelKey: "q_window_rain"    },
        { value: "city",    labelKey: "q_window_city"    },
        { value: "forest",  labelKey: "q_window_forest"  },
        { value: "parking", labelKey: "q_window_parking" },
        { value: "sea",     labelKey: "q_window_sea"     },
        { value: "wall",    labelKey: "q_window_wall"    },
      ],
    },
    temperature: {
      key: "temperature", kind: "real", titleKey: "q_temp_t",
      options: [
        { value: "burning", labelKey: "q_temp_burning" },
        { value: "warm",    labelKey: "q_temp_warm"    },
        { value: "cool",    labelKey: "q_temp_cool"    },
        { value: "freezing",labelKey: "q_temp_freezing"},
      ],
    },
    runtime: {
      key: "runtime", kind: "real", titleKey: "q_runtime_t",
      options: [
        { value: "short",  labelKey: "q_runtime_short"  },
        { value: "medium", labelKey: "q_runtime_medium" },
        { value: "long",   labelKey: "q_runtime_long"   },
        { value: "epic",   labelKey: "q_runtime_epic"   },
        { value: "any",    labelKey: "q_runtime_any"    },
      ],
    },
    language_pref: {
      key: "language_pref", kind: "real", titleKey: "q_lang_t",
      options: [
        { value: "any",      labelKey: "q_lang_any"      },
        { value: "spanish",  labelKey: "q_lang_spanish"  },
        { value: "english",  labelKey: "q_lang_english"  },
        { value: "asian",    labelKey: "q_lang_asian"    },
        { value: "european", labelKey: "q_lang_european" },
      ],
    },
    opening: {
      key: "opening", kind: "real", titleKey: "q_opening_t",
      options: [
        { value: "burst",     labelKey: "q_opening_burst"     },
        { value: "quiet",     labelKey: "q_opening_quiet"     },
        { value: "voiceover", labelKey: "q_opening_voiceover" },
        { value: "middle",    labelKey: "q_opening_middle"    },
        { value: "title",     labelKey: "q_opening_title"     },
      ],
    },
    rewatch_taste: {
      key: "rewatch_taste", kind: "real", titleKey: "q_rewatch_t",
      options: [
        { value: "popular", labelKey: "q_rewatch_popular" },
        { value: "obscure", labelKey: "q_rewatch_obscure" },
        { value: "either",  labelKey: "q_rewatch_either"  },
      ],
    },
    director_vibe: {
      key: "director_vibe", kind: "real", titleKey: "q_director_t",
      options: [
        { value: "auteur",    labelKey: "q_director_auteur"    },
        { value: "mainstream",labelKey: "q_director_mainstream"},
        { value: "indie",     labelKey: "q_director_indie"     },
        { value: "any",       labelKey: "q_director_any"       },
      ],
    },
    first_act: {
      key: "first_act", kind: "real", titleKey: "q_firstact_t",
      options: [
        { value: "discover", labelKey: "q_firstact_discover" },
        { value: "meet",     labelKey: "q_firstact_meet"     },
        { value: "wrong",    labelKey: "q_firstact_wrong"    },
        { value: "goal",     labelKey: "q_firstact_goal"     },
      ],
    },
    fear: {
      key: "fear", kind: "real", titleKey: "q_fear_t",
      options: [
        { value: "gore",          labelKey: "q_fear_gore"         },
        { value: "tears",         labelKey: "q_fear_tears"        },
        { value: "boredom",       labelKey: "q_fear_boredom"      },
        { value: "confusion",     labelKey: "q_fear_confusion"    },
        { value: "predictable",   labelKey: "q_fear_predictable"  },
      ],
    },
    trust: {
      key: "trust", kind: "real", titleKey: "q_trust_t",
      options: [
        { value: "small_drama",  labelKey: "q_trust_drama"     },
        { value: "good_thriller",labelKey: "q_trust_thriller"  },
        { value: "weird_film",   labelKey: "q_trust_weird"     },
        { value: "smart_comedy", labelKey: "q_trust_comedy"    },
        { value: "moody_horror", labelKey: "q_trust_horror"    },
        { value: "warm_anim",    labelKey: "q_trust_animation" },
      ],
    },
    time_of_day: {
      key: "time_of_day", kind: "real", titleKey: "q_tod_t",
      options: [
        { value: "dawn",      labelKey: "q_tod_dawn"      },
        { value: "morning",   labelKey: "q_tod_morning"   },
        { value: "noon",      labelKey: "q_tod_noon"      },
        { value: "afternoon", labelKey: "q_tod_afternoon" },
        { value: "dusk",      labelKey: "q_tod_dusk"      },
        { value: "night",     labelKey: "q_tod_night"     },
        { value: "small_hours", labelKey: "q_tod_small_hours" },
      ],
    },
    garment: {
      key: "garment", kind: "real", titleKey: "q_garment_t",
      options: [
        { value: "trench",     labelKey: "q_garment_trench"     },
        { value: "sweater",    labelKey: "q_garment_sweater"    },
        { value: "leather",    labelKey: "q_garment_leather"    },
        { value: "white_shirt",labelKey: "q_garment_white_shirt"},
        { value: "robe",       labelKey: "q_garment_robe"       },
        { value: "naked",      labelKey: "q_garment_naked"      },
      ],
    },
    food: {
      key: "food", kind: "real", titleKey: "q_food_t",
      options: [
        { value: "ramen",   labelKey: "q_food_ramen"   },
        { value: "wine",    labelKey: "q_food_wine"    },
        { value: "fries",   labelKey: "q_food_fries"   },
        { value: "fruit",   labelKey: "q_food_fruit"   },
        { value: "bread",   labelKey: "q_food_bread"   },
        { value: "nothing", labelKey: "q_food_nothing" },
      ],
    },
    drink: {
      key: "drink", kind: "real", titleKey: "q_drink_t",
      options: [
        { value: "coffee",  labelKey: "q_drink_coffee"  },
        { value: "wine",    labelKey: "q_drink_wine"    },
        { value: "whisky",  labelKey: "q_drink_whisky"  },
        { value: "water",   labelKey: "q_drink_water"   },
        { value: "tea",     labelKey: "q_drink_tea"     },
        { value: "beer",    labelKey: "q_drink_beer"    },
      ],
    },
    instrument: {
      key: "instrument", kind: "real", titleKey: "q_instrument_t",
      options: [
        { value: "piano",   labelKey: "q_instrument_piano"   },
        { value: "guitar",  labelKey: "q_instrument_guitar"  },
        { value: "synth",   labelKey: "q_instrument_synth"   },
        { value: "strings", labelKey: "q_instrument_strings" },
        { value: "drums",   labelKey: "q_instrument_drums"   },
        { value: "voice",   labelKey: "q_instrument_voice"   },
      ],
    },
    transport: {
      key: "transport", kind: "real", titleKey: "q_transport_t",
      options: [
        { value: "walking", labelKey: "q_transport_walking" },
        { value: "car",     labelKey: "q_transport_car"     },
        { value: "train",   labelKey: "q_transport_train"   },
        { value: "boat",    labelKey: "q_transport_boat"    },
        { value: "bike",    labelKey: "q_transport_bike"    },
        { value: "running", labelKey: "q_transport_running" },
      ],
    },
    season: {
      key: "season", kind: "real", titleKey: "q_season_t",
      options: [
        { value: "spring", labelKey: "q_season_spring" },
        { value: "summer", labelKey: "q_season_summer" },
        { value: "autumn", labelKey: "q_season_autumn" },
        { value: "winter", labelKey: "q_season_winter" },
      ],
    },
    object: {
      key: "object", kind: "real", titleKey: "q_object_t",
      options: [
        { value: "photo",    labelKey: "q_object_photo"    },
        { value: "key",      labelKey: "q_object_key"      },
        { value: "letter",   labelKey: "q_object_letter"   },
        { value: "mirror",   labelKey: "q_object_mirror"   },
        { value: "knife",    labelKey: "q_object_knife"    },
        { value: "clock",    labelKey: "q_object_clock"    },
      ],
    },
    body: {
      key: "body", kind: "real", titleKey: "q_body_t",
      options: [
        { value: "tense",   labelKey: "q_body_tense"   },
        { value: "tired",   labelKey: "q_body_tired"   },
        { value: "wired",   labelKey: "q_body_wired"   },
        { value: "soft",    labelKey: "q_body_soft"    },
        { value: "buzzed",  labelKey: "q_body_buzzed"  },
      ],
    },
    phrase: {
      key: "phrase", kind: "phrase",
      titleKey: "q_phrase_t",
      placeholderKey: "q_phrase_ph",
      chipsKeys: ["q_phrase_c1","q_phrase_c2","q_phrase_c3",
                  "q_phrase_c4","q_phrase_c5","q_phrase_c6"],
    },
    // Mandatory, always last:
    ink: {
      key: "ink", kind: "rorschach", titleKey: "q_ink_t",
      // 4 procedural blots generated per render; "options" filled at runtime
    },
  };

  // Categories that can rotate (excluding ink which is mandatory)
  const ROTATING = [
    "state","door","scene","intent","depth","weather","sound","company","pace","ending",
    "color","light","texture","decade","place","memory","want","avoid","animal","lately",
    "risk_taste","smell","window","temperature",
    "runtime","language_pref","opening","rewatch_taste","director_vibe","first_act","fear","trust",
    "time_of_day","garment","food","drink","instrument","transport","season","object","body",
    "phrase",
  ];

  // Build a fresh quiz: 6 random categories + ink last (7 total)
  function buildSession() {
    const shuffled = [...ROTATING].sort(() => Math.random() - 0.5).slice(0, 6);
    return [...shuffled.map(k => BANK[k]), BANK.ink];
  }

  let QUIZ = buildSession();

  // ────────────────────────────────────────────────────────────
  // INK BLOT GENERATOR — organic symmetric Rorschach
  // Each blot: blob via radial-jittered cubic bezier + satellites
  // + fragments + spatter. Density and asymmetry vary.
  // ────────────────────────────────────────────────────────────
  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Build an organic closed path from N radial points on the right half,
  // smoothed with a Catmull-Rom-ish bezier, then mirrored across cx.
  function blobPath(cx, cy, baseR, n, jitter, mirror = true) {
    const pts = [];
    // generate points on a half-circle (top to bottom on right side)
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const ang = -Math.PI / 2 + t * Math.PI; // -90deg .. +90deg
      const r = baseR * (1 + (Math.random() - 0.5) * jitter);
      pts.push({
        x: cx + Math.cos(ang) * r,
        y: cy + Math.sin(ang) * r,
      });
    }
    // close on the left by mirroring
    const left = mirror
      ? pts.slice().reverse().map(p => ({ x: cx - (p.x - cx), y: p.y }))
      : [];
    const all = [...pts, ...left];

    // build smooth path
    let d = `M ${all[0].x.toFixed(1)} ${all[0].y.toFixed(1)}`;
    for (let i = 0; i < all.length; i++) {
      const p0 = all[(i - 1 + all.length) % all.length];
      const p1 = all[i];
      const p2 = all[(i + 1) % all.length];
      const p3 = all[(i + 2) % all.length];
      // Catmull-Rom -> bezier
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d + " Z";
  }

  function makeBlot(seedMood) {
    const W = 240, H = 280, cx = W / 2;
    const symmetry = Math.random() < 0.85; // most are symmetric, some not
    const fragments = Math.random() < 0.55;
    const spatter   = Math.random() < 0.85;

    // 1–3 main blobs of different sizes/positions
    const nBlobs = 1 + Math.floor(Math.random() * 3);
    let blobs = "";
    for (let b = 0; b < nBlobs; b++) {
      const cy = rand(60, H - 60);
      const baseR = rand(28, 70);
      const n = 6 + Math.floor(Math.random() * 6);
      const jitter = rand(0.25, 0.75);
      const op = rand(0.65, 1.0).toFixed(2);
      const offsetCx = symmetry ? cx : cx + rand(-25, 25);
      const path = blobPath(offsetCx, cy, baseR, n, jitter, symmetry);
      blobs += `<path d="${path}" opacity="${op}"/>`;
    }

    // Fragments: small detached blobs
    let frags = "";
    if (fragments) {
      const nFrag = 2 + Math.floor(Math.random() * 5);
      for (let i = 0; i < nFrag; i++) {
        const cy = rand(40, H - 40);
        const r = rand(4, 14);
        const xOff = rand(8, 80);
        const op = rand(0.5, 0.9).toFixed(2);
        const n = 5 + Math.floor(Math.random() * 4);
        const j = rand(0.4, 0.9);
        frags += `<path d="${blobPath(cx + xOff, cy, r, n, j, false)}" opacity="${op}"/>`;
        if (symmetry) {
          frags += `<path d="${blobPath(cx - xOff, cy, r, n, j, false)}" opacity="${op}"/>`;
        }
      }
    }

    // Spatter: tiny dots
    let dots = "";
    if (spatter) {
      const nDot = 8 + Math.floor(Math.random() * 30);
      for (let i = 0; i < nDot; i++) {
        const xOff = rand(2, 90);
        const y = rand(20, H - 20);
        const r = rand(0.5, 3.5);
        const op = rand(0.3, 0.85).toFixed(2);
        dots += `<circle cx="${(cx + xOff).toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" opacity="${op}"/>`;
        if (symmetry) {
          dots += `<circle cx="${(cx - xOff).toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" opacity="${op}"/>`;
        }
      }
    }

    // Slight rotation for variety
    const rot = (Math.random() - 0.5) * 6;
    const id = "b" + Math.random().toString(36).slice(2, 8);
    // ink tint: mostly cream, occasional warm/cool tint for variety
    const inkColors = ["#ede7da","#ede7da","#ede7da","#e8d8b8","#dce4d8","#e6dbc4"];
    const fill = pick(inkColors);

    return {
      mood: seedMood,
      svg: `
        <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <filter id="${id}" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="${rand(0.6, 1.6).toFixed(2)}"/>
              <feTurbulence baseFrequency="${rand(0.6, 1.4).toFixed(2)}" numOctaves="2" seed="${Math.floor(Math.random() * 1000)}"/>
              <feDisplacementMap in="SourceGraphic" scale="${rand(2, 6).toFixed(1)}"/>
            </filter>
          </defs>
          <g fill="${fill}" filter="url(#${id})" transform="rotate(${rot.toFixed(2)} ${cx} ${H/2})">
            ${blobs}
            ${frags}
            ${dots}
          </g>
        </svg>`
    };
  }

  // 4 blots per render, each with a different mood preset.
  // Mood presets cover full grid of (tone × energy × door).
  const BLOT_MOODS = [
    { tone: "dark",  energy: "engage", door: "intensity" },
    { tone: "dark",  energy: "engage", door: "mystery"   },
    { tone: "dark",  energy: "unwind", door: "mystery"   },
    { tone: "dark",  energy: "unwind", door: "intensity" },
    { tone: "light", energy: "engage", door: "fantasy"   },
    { tone: "light", energy: "engage", door: "intimacy"  },
    { tone: "light", energy: "unwind", door: "intimacy"  },
    { tone: "light", energy: "unwind", door: "fantasy"   },
  ];
  function freshBlots() {
    const moods = [...BLOT_MOODS].sort(() => Math.random() - 0.5).slice(0, 4);
    return moods.map(m => ({ value: JSON.stringify(m), ...makeBlot(m) }));
  }

  // ────────────────────────────────────────────────────────────
  // SCORING — answers -> backend axes
  // ────────────────────────────────────────────────────────────
  function ritualToMood(a) {
    const m = {};
    if (a.door === "intensity") { m.tone = "dark";  m.energy = "engage"; }
    if (a.door === "mystery")   { m.tone = "dark";  m.energy = "engage"; }
    if (a.door === "fantasy")   { m.tone = "light"; m.energy = "engage"; }
    if (a.door === "intimacy")  { m.tone = "light"; m.energy = "unwind"; }
    if (a.state === "drained")  { m.energy = "unwind"; m.risk = "safe"; }
    if (a.state === "restless") { m.energy = "engage"; m.risk = "discover"; }
    if (a.state === "pensive")  { m.energy = "engage"; }
    if (a.state === "good")     { m.risk = m.risk || "discover"; }
    if (a.scene === "survival" || a.scene === "discovery") m.energy = "engage";
    if (a.scene === "dialogue" || a.scene === "house")     m.company = m.company || "alone";
    if (a.intent === "escape")  { m.energy = "unwind"; m.tone = m.tone || "light"; }
    if (a.intent === "feel")    { m.energy = "engage"; }
    if (a.intent === "think")   { m.energy = "engage"; m.company = "alone"; }
    if (a.intent === "company") { m.company = "shared"; }
    if (a.depth === "fun")        { m.energy = "unwind"; m.risk = "safe"; }
    if (a.depth === "warm")       { m.risk = "safe"; }
    if (a.depth === "thoughtful") { m.energy = "engage"; }
    if (a.depth === "uneasy")     { m.energy = "engage"; m.risk = "discover"; m.tone = m.tone || "dark"; }
    if (a.depth === "ruined")     { m.energy = "engage"; m.risk = "discover"; m.tone = "dark"; }
    if (a.weather === "rain" || a.weather === "fog") m.tone = m.tone || "dark";
    if (a.weather === "sun")    m.tone = m.tone || "light";
    if (a.weather === "storm")  { m.tone = "dark"; m.energy = "engage"; }
    if (a.weather === "winter") m.tone = m.tone || "dark";
    if (a.sound === "silence") m.energy = "unwind";
    if (a.sound === "noise")   m.energy = "engage";
    if (a.sound === "voices")  m.company = "shared";
    if (a.company) m.company = a.company;
    if (a.pace === "slow")  m.energy = m.energy || "unwind";
    if (a.pace === "fast")  m.energy = "engage";
    if (a.ending === "twist")  m.risk = "discover";
    if (a.ending === "bitter") m.tone = m.tone || "dark";
    // new axes
    if (a.color === "blood" || a.color === "ash") m.tone = m.tone || "dark";
    if (a.color === "gold"  || a.color === "earth") m.tone = m.tone || "light";
    if (a.color === "neon")  { m.tone = "dark"; m.energy = "engage"; }
    if (a.light === "fluorescent" || a.light === "neon") m.tone = m.tone || "dark";
    if (a.light === "candle" || a.light === "golden") m.tone = m.tone || "light";
    if (a.texture === "sandpaper" || a.texture === "wet") m.tone = m.tone || "dark";
    if (a.texture === "silk" || a.texture === "wood") m.tone = m.tone || "light";
    if (a.place === "abandoned" || a.place === "nowhere") m.tone = m.tone || "dark";
    if (a.place === "interior") m.company = m.company || "alone";
    if (a.memory === "heartbreak" || a.memory === "regret") m.tone = m.tone || "dark";
    if (a.memory === "wonder" || a.memory === "childhood") m.tone = m.tone || "light";
    if (a.want === "moved" || a.want === "haunted") m.energy = "engage";
    if (a.want === "soothed" || a.want === "entertained") m.energy = "unwind";
    if (a.want === "challenged") { m.energy = "engage"; m.risk = "discover"; }
    if (a.avoid) m.avoid = a.avoid;
    if (a.lately === "numb" || a.lately === "stuck") m.risk = "discover";
    if (a.lately === "lonely") m.company = "alone";
    if (a.risk_taste === "classic")  m.risk = "safe";
    if (a.risk_taste === "gem" || a.risk_taste === "weird" || a.risk_taste === "cult") m.risk = "discover";
    if (a.risk_taste === "hate_maybe") { m.risk = "discover"; m.tone = m.tone || "dark"; }
    if (a.window === "rain" || a.window === "parking" || a.window === "wall") m.tone = m.tone || "dark";
    if (a.window === "sea" || a.window === "forest") m.tone = m.tone || "light";
    if (a.temperature === "burning" || a.temperature === "freezing") m.energy = "engage";
    if (a.temperature === "warm") m.energy = m.energy || "unwind";
    if (a.decade) m.decade = a.decade;
    if (a.animal) m.animal = a.animal;
    if (a.smell) m.smell = a.smell;
    // backend-mapped axes (worker reads these directly)
    if (a.runtime) m.runtime = a.runtime;
    if (a.language_pref) m.language_pref = a.language_pref;
    if (a.avoid && a.avoid !== "nothing") m.avoid = a.avoid;
    if (a.opening === "burst")  { m.energy = "engage"; m.tone = m.tone || "dark"; }
    if (a.opening === "quiet")  { m.energy = m.energy || "unwind"; }
    if (a.opening === "voiceover") { m.tone = m.tone || "dark"; }
    if (a.opening === "middle") { m.energy = "engage"; m.risk = "discover"; }
    if (a.opening === "title")  { m.risk = "discover"; }
    if (a.rewatch_taste === "popular") m.popularity = "high";
    if (a.rewatch_taste === "obscure") { m.popularity = "low"; m.risk = "discover"; }
    if (a.director_vibe === "auteur")     { m.quality = "high"; m.popularity = "low"; }
    if (a.director_vibe === "mainstream") { m.popularity = "high"; }
    if (a.director_vibe === "indie")      { m.quality = "high"; m.popularity = "mid"; }
    if (a.first_act === "discover") m.first_act = "fantasy_scifi";
    if (a.first_act === "meet")     m.first_act = "drama_romance";
    if (a.first_act === "wrong")    m.first_act = "thriller_horror";
    if (a.first_act === "goal")     m.first_act = "action_adventure";
    if (a.fear === "gore")        m.exclude = (m.exclude || []).concat(["horror_extreme"]);
    if (a.fear === "tears")       m.exclude = (m.exclude || []).concat(["heavy_drama"]);
    if (a.fear === "boredom")     m.energy = "engage";
    if (a.fear === "confusion")   m.popularity = m.popularity || "high";
    if (a.fear === "predictable") m.risk = "discover";
    if (a.trust === "small_drama")  m.trust = "drama";
    if (a.trust === "good_thriller")m.trust = "thriller";
    if (a.trust === "weird_film")   m.trust = "weird";
    if (a.trust === "smart_comedy") m.trust = "comedy";
    if (a.trust === "moody_horror") m.trust = "horror";
    if (a.trust === "warm_anim")    m.trust = "animation";
    if (a.ink) {
      try {
        const blot = JSON.parse(a.ink);
        if (blot.tone)   m.tone = blot.tone;
        if (blot.energy) m.energy = m.energy || blot.energy;
        if (blot.door && !m.tone) m.tone = blot.door === "fantasy" || blot.door === "intimacy" ? "light" : "dark";
      } catch {}
    }
    if (a.phrase) m.phrase = a.phrase;
    return m;
  }

  function vibeWords(a, lang) {
    const W = (en, es) => (lang === "es" ? es : en);
    const w = [];
    if (a.depth === "ruined")     w.push(W("devastating","devastadora"));
    if (a.depth === "uneasy")     w.push(W("unnerving","incómoda"));
    if (a.depth === "thoughtful") w.push(W("slow-burning","de combustión lenta"));
    if (a.depth === "warm")       w.push(W("warm","cálida"));
    if (a.depth === "fun")        w.push(W("breezy","liviana"));
    if (a.state === "drained")    w.push(W("low-energy","de baja energía"));
    if (a.state === "restless")   w.push(W("restless","inquieta"));
    if (a.state === "pensive")    w.push(W("contemplative","contemplativa"));
    if (a.intent === "escape")    w.push(W("escapist","de escape"));
    if (a.intent === "feel")      w.push(W("emotional","emocional"));
    if (a.intent === "think")     w.push(W("cerebral","cerebral"));
    if (a.weather === "rain")     w.push(W("rainy","lluviosa"));
    if (a.weather === "fog")      w.push(W("foggy","brumosa"));
    if (a.weather === "winter")   w.push(W("wintry","invernal"));
    if (a.sound === "silence")    w.push(W("quiet","silenciosa"));
    if (a.door === "mystery")     w.push(W("mysterious","misteriosa"));
    if (a.door === "intensity")   w.push(W("intense","intensa"));
    if (a.door === "fantasy")     w.push(W("dreamlike","onírica"));
    if (a.door === "intimacy")    w.push(W("intimate","íntima"));
    return [...new Set(w)].slice(0, 3);
  }

  // ────────────────────────────────────────────────────────────
  // STATE & STEP MGMT
  // ────────────────────────────────────────────────────────────
  const state = { qIdx: 0, answers: {}, user: "", path: null };

  const steps = {
    intro:   $('[data-step="intro"]'),
    lbAsk:   $('[data-step="lb-ask"]'),
    quiz:    $('[data-step="quiz"]'),
    loading: $('[data-step="loading"]'),
    results: $('[data-step="results"]'),
    error:   $('[data-step="error"]'),
  };
  const stepKeyByName = {
    "intro": "intro", "lb-ask": "lbAsk", "quiz": "quiz",
    "loading": "loading", "results": "results", "error": "error",
  };
  function show(name) {
    const want = stepKeyByName[name] || name;
    Object.entries(steps).forEach(([k, el]) => el && el.classList.toggle("active", k === want));
    document.body.classList.toggle("on-hero", want === "intro");
    // After paint, scroll to where the new section actually starts
    requestAnimationFrame(() => {
      const el = steps[want];
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // STATIC SVG bank (doors)
  // ────────────────────────────────────────────────────────────
  function svgFor(name) {
    const ns = "http://www.w3.org/2000/svg";
    const wrap = document.createElementNS(ns, "svg");
    wrap.setAttribute("viewBox", "0 0 200 250");
    wrap.setAttribute("aria-hidden", "true");
    if (name === "door-red") {
      wrap.innerHTML = `
        <rect width="200" height="250" fill="#0a0a0c"/>
        <rect x="70" y="50" width="60" height="180" fill="#c43b2a"/>
        <rect x="70" y="50" width="60" height="180" fill="none" stroke="#7a1c14" stroke-width="2"/>
        <circle cx="120" cy="140" r="3" fill="#f0d36a"/>
        <ellipse cx="100" cy="232" rx="40" ry="6" fill="#7a1c14" opacity="0.5"/>`;
    }
    if (name === "door-old") {
      wrap.innerHTML = `
        <rect width="200" height="250" fill="#1a1815"/>
        <rect x="60" y="40" width="80" height="200" fill="#3a2f1f"/>
        <rect x="65" y="45" width="70" height="190" fill="none" stroke="#2a2218" stroke-width="2"/>
        <line x1="100" y1="45" x2="100" y2="235" stroke="#2a2218" stroke-width="1.5"/>
        <rect x="68" y="55" width="28" height="40" fill="none" stroke="#2a2218"/>
        <rect x="104" y="55" width="28" height="40" fill="none" stroke="#2a2218"/>
        <rect x="68" y="105" width="28" height="40" fill="none" stroke="#2a2218"/>
        <rect x="104" y="105" width="28" height="40" fill="none" stroke="#2a2218"/>
        <circle cx="125" cy="155" r="2.5" fill="#7a6a4a"/>`;
    }
    if (name === "door-sky") {
      wrap.innerHTML = `
        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a4a6a"/><stop offset="100%" stop-color="#a8b4c8"/>
        </linearGradient></defs>
        <rect width="200" height="250" fill="url(#g1)"/>
        <ellipse cx="40" cy="180" rx="40" ry="8" fill="#fff" opacity="0.4"/>
        <ellipse cx="160" cy="200" rx="50" ry="10" fill="#fff" opacity="0.5"/>
        <rect x="80" y="80" width="40" height="120" fill="#f0eadf"/>
        <rect x="80" y="80" width="40" height="120" fill="none" stroke="#cfc4ad" stroke-width="2"/>
        <circle cx="113" cy="140" r="2" fill="#7a6a4a"/>`;
    }
    if (name === "door-warm") {
      wrap.innerHTML = `
        <rect width="200" height="250" fill="#15110d"/>
        <rect x="65" y="50" width="70" height="190" fill="#2a201a"/>
        <rect x="68" y="55" width="64" height="180" fill="none" stroke="#3a2d22" stroke-width="2"/>
        <circle cx="124" cy="150" r="3" fill="#a08458"/>
        <ellipse cx="100" cy="240" rx="120" ry="40" fill="#f5a623" opacity="0.18"/>
        <ellipse cx="100" cy="248" rx="80" ry="20" fill="#f5a623" opacity="0.28"/>`;
    }
    return wrap;
  }

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  const opts = $("#q-options");
  const dotsEl = $("#dots");

  function renderDots() {
    dotsEl.innerHTML = "";
    QUIZ.forEach((_, i) => {
      const d = document.createElement("span");
      if (i < state.qIdx) d.classList.add("done");
      if (i === state.qIdx) d.classList.add("cur");
      dotsEl.appendChild(d);
    });
  }

  function renderQuestion() {
    const q = QUIZ[state.qIdx];
    $("#q-num").firstElementChild.textContent =
      window.t("q_num").replace("{n}", String(state.qIdx + 1)).replace("{tot}", String(QUIZ.length));
    $("#q-title").innerHTML = window.t(q.titleKey);
    opts.innerHTML = "";
    opts.className = `q-body kind-${q.kind}`;
    renderDots();

    if (q.kind === "doors") {
      const grid = document.createElement("div");
      grid.className = "doors";
      q.options.forEach(o => {
        const b = document.createElement("button");
        b.className = "door";
        b.type = "button";
        b.appendChild(svgFor(o.svg));
        const span = document.createElement("span");
        span.className = "label";
        span.textContent = window.t(o.labelKey);
        b.appendChild(span);
        b.addEventListener("click", () => { state.answers[q.key] = o.value; nextQ(); });
        grid.appendChild(b);
      });
      opts.appendChild(grid);
    }
    else if (q.kind === "rorschach") {
      const grid = document.createElement("div");
      grid.className = "rorschach";
      const blots = freshBlots();
      blots.forEach(b => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerHTML = b.svg;
        btn.addEventListener("click", () => { state.answers[q.key] = b.value; nextQ(); });
        grid.appendChild(btn);
      });
      opts.appendChild(grid);
    }
    else if (q.kind === "real") {
      const list = document.createElement("div");
      list.className = "options";
      q.options.forEach((o, i) => {
        const b = document.createElement("button");
        b.className = "opt";
        b.type = "button";
        b.innerHTML = `
          <span class="opt-key">${String(i+1).padStart(2, "0")}</span>
          <span class="opt-text">${window.t(o.labelKey)}</span>
        `;
        b.addEventListener("click", () => { state.answers[q.key] = o.value; nextQ(); });
        list.appendChild(b);
      });
      opts.appendChild(list);
    }
    else if (q.kind === "phrase") {
      const wrap = document.createElement("div");
      wrap.className = "phrase";
      const inp = document.createElement("input");
      inp.type = "text";
      inp.id = "phrase-input";
      inp.placeholder = window.t(q.placeholderKey);
      inp.maxLength = 80;
      inp.value = state.answers[q.key] || "";
      wrap.appendChild(inp);
      const chips = document.createElement("div");
      chips.className = "chips";
      q.chipsKeys.forEach(k => {
        const c = document.createElement("button");
        c.type = "button";
        c.className = "chip";
        c.textContent = window.t(k);
        c.addEventListener("click", () => { inp.value = window.t(k); inp.focus(); });
        chips.appendChild(c);
      });
      wrap.appendChild(chips);
      const cont = document.createElement("button");
      cont.type = "button";
      cont.className = "pill primary phrase-next";
      cont.innerHTML = `<span>${window.t("next")}</span><span class="arrow">→</span>`;
      cont.addEventListener("click", () => {
        state.answers[q.key] = inp.value.trim();
        nextQ();
      });
      wrap.appendChild(cont);
      opts.appendChild(wrap);
      setTimeout(() => inp.focus(), 100);
    }
    $("#q-back").disabled = state.qIdx === 0;
  }

  function nextQ() {
    if (state.qIdx < QUIZ.length - 1) { state.qIdx++; renderQuestion(); }
    else recommend({ withUser: state.path === "lb" });
  }
  function backQ() { if (state.qIdx > 0) { state.qIdx--; renderQuestion(); } }
  function skipQ() { delete state.answers[QUIZ[state.qIdx].key]; nextQ(); }

  // ────────────────────────────────────────────────────────────
  // API
  // ────────────────────────────────────────────────────────────
  function guessCountry() {
    try { const loc = new Intl.Locale(navigator.language); if (loc.region) return loc.region.toUpperCase(); } catch {}
    const m = (navigator.language || "").match(/-([A-Z]{2})/i);
    return m ? m[1].toUpperCase() : "US";
  }
  async function recommend({ withUser }) {
    show("loading");
    $("#load-msg").textContent = withUser ? window.t("loading_lb") : window.t("loading");
    const country = guessCountry();
    const lang = window.LANG;
    const mood = ritualToMood(state.answers);
    const moodB64 = btoa(unescape(encodeURIComponent(JSON.stringify(mood))));
    const params = new URLSearchParams({ country, lang, mood: moodB64 });
    if (withUser && state.user) params.set("user", state.user);
    try {
      const r = await fetch(`${API_BASE}/recommend?${params}`);
      const data = await r.json();
      if (!r.ok) {
        const code = data.error || "generic";
        return showError(window.t(`err_${code}`) || window.t("err_generic"));
      }
      renderResults(data);
    } catch {
      showError(window.t("err_generic"));
    }
  }

  function renderResults(data) {
    const words = vibeWords(state.answers, window.LANG);
    const desc = $("#vibe-desc");
    if (desc) desc.textContent = words.length ? words.join(" · ") : "";
    const cards = $("#cards");
    cards.innerHTML = "";
    if (!data.films || !data.films.length) {
      const p = document.createElement("p");
      p.className = "err-msg";
      p.textContent = window.t("no_picks");
      cards.appendChild(p);
    } else {
      data.films.forEach((f, i) => cards.appendChild(filmCard(f, i + 1)));
    }
    show("results");
  }
  function filmCard(f, rank) {
    const c = document.createElement("article");
    c.className = "card";
    const img = document.createElement("img");
    img.className = "poster";
    img.loading = "lazy";
    img.alt = f.title || "";
    img.src = f.poster || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'><rect width='60' height='90' fill='%23d8cfbc'/></svg>";
    c.appendChild(img);
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span class="card-rank">${window.t("pick_n").replace("{n}", String(rank).padStart(2, "0"))}</span>
      <h3>${escapeHtml(f.title || "")} ${f.year ? `<span class="yr">(${f.year})</span>` : ""}</h3>
      ${f.director ? `<div class="director">${escapeHtml(f.director)}</div>` : ""}
      <div class="specs">${[f.runtime ? `${f.runtime} min` : "", (f.genres || []).slice(0,2).join(" · ")].filter(Boolean).join(" — ")}</div>
      ${f.curated_note ? `<p class="note">${escapeHtml(f.curated_note)}</p>` : ""}`;
    const actions = document.createElement("div");
    actions.className = "actions";
    if (f.justwatch) {
      const a = document.createElement("a");
      a.href = f.justwatch; a.target = "_blank"; a.rel = "noopener";
      a.className = "action primary";
      a.textContent = window.t("where_to_watch");
      actions.appendChild(a);
    }
    if (f.tmdb) {
      const a = document.createElement("a");
      a.href = f.tmdb; a.target = "_blank"; a.rel = "noopener";
      a.className = "action";
      a.textContent = window.t("on_tmdb");
      actions.appendChild(a);
    }
    meta.appendChild(actions);
    c.appendChild(meta);
    return c;
  }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function showError(msg) { $("#err-msg").textContent = msg; show("error"); }

  // ────────────────────────────────────────────────────────────
  // RANDOM HERO
  // ────────────────────────────────────────────────────────────
  async function loadRandomHero() {
    try {
      const r = await fetch("./assets/heroes/manifest.json", { cache: "no-cache" });
      if (!r.ok) return;
      const list = await r.json();
      if (!Array.isArray(list) || !list.length) return;
      const pick = list[Math.floor(Math.random() * list.length)];
      const hero = document.getElementById("hero");
      const fig = document.getElementById("hero-fig");
      const credit = document.getElementById("hero-credit");
      if (hero) {
        const img = new Image();
        img.onload = () => {
          hero.style.backgroundImage =
            `linear-gradient(180deg, rgba(20,22,15,0.4) 0%, rgba(20,22,15,0.65) 60%, rgba(20,22,15,0.85) 100%), url("${pick.file}")`;
        };
        img.src = pick.file;
      }
      if (fig)    fig.textContent    = pick.caption;
      if (credit) credit.textContent = `Hero · ${pick.caption} · Public domain`;
    } catch {}
  }

  // ────────────────────────────────────────────────────────────
  // WIRE
  // ────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    show("intro");
    loadRandomHero();
    $("#q-back").addEventListener("click", backQ);
    $("#q-skip").addEventListener("click", skipQ);

    $("#path-global").addEventListener("click", () => {
      state.path = "global";
      QUIZ = buildSession();
      state.qIdx = 0;
      state.answers = {};
      renderQuestion();
      show("quiz");
    });
    $("#path-lb").addEventListener("click", () => {
      state.path = "lb";
      show("lb-ask");
      setTimeout(() => $("#user")?.focus(), 200);
    });

    $("#lb-confirm").addEventListener("click", () => {
      const u = ($("#user").value || "").trim().replace(/^@/, "").toLowerCase();
      if (!/^[a-z0-9_-]{1,30}$/.test(u)) {
        $("#user").focus();
        $("#user").style.borderBottomColor = "var(--accent)";
        return;
      }
      state.user = u;
      QUIZ = buildSession();
      state.qIdx = 0;
      state.answers = {};
      renderQuestion();
      show("quiz");
    });
    $("#lb-back").addEventListener("click", () => { state.path = null; show("intro"); });

    $("#restart").addEventListener("click", () => {
      state.qIdx = 0; state.answers = {}; state.user = ""; state.path = null;
      const inp = $("#user"); if (inp) { inp.value = ""; inp.style.borderBottomColor = ""; }
      QUIZ = buildSession();
      show("intro");
    });
    $("#retry").addEventListener("click", () => recommend({ withUser: state.path === "lb" }));
  });
})();
