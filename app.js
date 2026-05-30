// moodwatch — ritual flow with question pool + procedural ink blots.
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const API_BASE = (window.MOODWATCH_API || "/api").replace(/\/$/, "");

  // Single silent retry on network failure / 5xx (Cloudflare cold start, transient blip).
  // Only retries once, then propagates whatever happened. Keeps total wait bounded (~300ms).
  async function fetchRetry(url, opts) {
    try {
      const r = await fetch(url, opts);
      if (!r.ok && r.status >= 500) throw new Error(`http_${r.status}`);
      return r;
    } catch (e) {
      await new Promise(res => setTimeout(res, 300));
      return fetch(url, opts);
    }
  }

  // ────────────────────────────────────────────────────────────
  // QUESTION BANK
  // Each entry is one *category*. Per session we pick 5–6 random
  // categories + the mandatory "ink" question (always last).
  // ────────────────────────────────────────────────────────────
  const BANK = {
    // ────── PRIMARY signal categories (high randomizer weight) ──────
    session_mode: {
      key: "session_mode", kind: "real", titleKey: "q_session_t", signal_weight: "primary",
      options: [
        { value: "balanced", labelKey: "q_session_balanced" },
        { value: "quick",    labelKey: "q_session_quick" },
        { value: "together", labelKey: "q_session_together" },
        { value: "list",     labelKey: "q_session_list" },
      ],
    },
    state: {
      key: "state", kind: "real", titleKey: "q_state_t", signal_weight: "primary",
      options: [
        { value: "drained",  labelKey: "q_state_drained"  },
        { value: "restless", labelKey: "q_state_restless" },
        { value: "pensive",  labelKey: "q_state_pensive"  },
        { value: "good",     labelKey: "q_state_good"     },
        { value: "any",      labelKey: "q_state_any", sticky: true },
      ],
    },
    appetite: {
      key: "appetite", kind: "real", titleKey: "q_appetite_t", signal_weight: "primary",
      options: [
        { value: "feel-deep",     labelKey: "q_appetite_feel" },
        { value: "horror",        labelKey: "q_appetite_horror" },
        { value: "weird",         labelKey: "q_appetite_weird" },
        { value: "lost-20s",      labelKey: "q_appetite_lost" },
        { value: "comfort",       labelKey: "q_appetite_comfort" },
        { value: "transformative",labelKey: "q_appetite_transformative" },
        { value: "any",           labelKey: "q_appetite_any", sticky: true },
      ],
    },
    flavor: {
      key: "appetite", kind: "real", titleKey: "q_flavor_t", signal_weight: "primary",
      randomize: 6,
      options: [
        { value: "girly",         labelKey: "q_flavor_girly" },
        { value: "queer",         labelKey: "q_flavor_queer" },
        { value: "a24",           labelKey: "q_flavor_a24" },
        { value: "reality",       labelKey: "q_flavor_reality" },
        { value: "wtf",           labelKey: "q_flavor_wtf" },
        { value: "vintage_love",  labelKey: "q_flavor_vintage" },
        { value: "catharsis",     labelKey: "q_flavor_catharsis" },
        { value: "anthropocene",  labelKey: "q_flavor_anthropocene" },
        { value: "sleepover",     labelKey: "q_flavor_sleepover" },
        { value: "good_for_her",  labelKey: "q_flavor_good_for_her" },
        { value: "desire_consequence", labelKey: "q_flavor_desire" },
        { value: "any",           labelKey: "q_flavor_any", sticky: true },
      ],
    },
    format_appetite: {
      key: "format_appetite", kind: "real", titleKey: "q_format_t", signal_weight: "primary",
      options: [
        { value: "doc",         labelKey: "q_format_doc" },
        { value: "anime",       labelKey: "q_format_anime" },
        { value: "silent",      labelKey: "q_format_silent" },
        { value: "romcom",      labelKey: "q_format_romcom" },
        { value: "horror_soft", labelKey: "q_format_horror_soft" },
        { value: "any",         labelKey: "q_format_any", sticky: true },
      ],
    },
    quality_vs_popularity: {
      key: "quality_vs_popularity", kind: "real", titleKey: "q_qvp_t", signal_weight: "primary",
      options: [
        { value: "crowd",    labelKey: "q_qvp_crowd"    },
        { value: "canon",    labelKey: "q_qvp_canon"    },
        { value: "curated",  labelKey: "q_qvp_curated" },
        { value: "hidden",   labelKey: "q_qvp_hidden"   },
        { value: "wildcard", labelKey: "q_qvp_wildcard" },
        { value: "any",      labelKey: "q_qvp_any", sticky: true },
      ],
    },
    nostalgia: {
      key: "nostalgia", kind: "real", titleKey: "q_nostalgia_t", signal_weight: "primary",
      options: [
        { value: "old_projector",     labelKey: "q_nostalgia_old"     },
        { value: "seventies_eighties",labelKey: "q_nostalgia_70s80s"  },
        { value: "nineties_video",    labelKey: "q_nostalgia_90s"     },
        { value: "two_thousands",     labelKey: "q_nostalgia_2000s"   },
        { value: "near_past",         labelKey: "q_nostalgia_2010s"   },
        { value: "no_nostalgia",      labelKey: "q_nostalgia_now"     },
        { value: "any",               labelKey: "q_nostalgia_any", sticky: true },
      ],
    },
    aftertaste: {
      key: "aftertaste", kind: "real", titleKey: "q_aftertaste_t", signal_weight: "primary",
      options: [
        { value: "held",     labelKey: "q_aftertaste_held"     },
        { value: "lighter",  labelKey: "q_aftertaste_lighter"  },
        { value: "thinking", labelKey: "q_aftertaste_thinking" },
        { value: "haunted",  labelKey: "q_aftertaste_haunted"  },
        { value: "wrecked",  labelKey: "q_aftertaste_wrecked"  },
        { value: "charged",  labelKey: "q_aftertaste_charged"  },
        { value: "any",      labelKey: "q_aftertaste_any", sticky: true },
      ],
    },
    decade: {
      key: "decade", kind: "real", titleKey: "q_decade_t", signal_weight: "primary",
      options: [
        { value: "old",   labelKey: "q_decade_old"   },
        { value: "70s",   labelKey: "q_decade_70s"   },
        { value: "80s",   labelKey: "q_decade_80s"   },
        { value: "90s",   labelKey: "q_decade_90s"   },
        { value: "00s",   labelKey: "q_decade_00s"   },
        { value: "now",   labelKey: "q_decade_now"   },
        { value: "any",   labelKey: "q_decade_any", sticky: true },
      ],
    },
    runtime: {
      key: "runtime", kind: "real", titleKey: "q_runtime_t", signal_weight: "primary",
      options: [
        { value: "short",  labelKey: "q_runtime_short"  },
        { value: "medium", labelKey: "q_runtime_medium" },
        { value: "long",   labelKey: "q_runtime_long"   },
        { value: "any",    labelKey: "q_runtime_any", sticky: true },
      ],
    },
    language_pref: {
      key: "language_pref", kind: "real", titleKey: "q_lang_t", signal_weight: "primary",
      options: [
        { value: "spanish",  labelKey: "q_lang_spanish"  },
        { value: "english",  labelKey: "q_lang_english"  },
        { value: "asian",    labelKey: "q_lang_asian"    },
        { value: "european", labelKey: "q_lang_european" },
        { value: "any",      labelKey: "q_lang_any", sticky: true },
      ],
    },
    avoid: {
      key: "avoid", kind: "real", titleKey: "q_avoid_t", signal_weight: "primary",
      options: [
        { value: "violence", labelKey: "q_avoid_violence" },
        { value: "romance",  labelKey: "q_avoid_romance"  },
        { value: "cliche",   labelKey: "q_avoid_cliche"   },
        { value: "slow",     labelKey: "q_avoid_slow"     },
        { value: "weird",    labelKey: "q_avoid_weird"    },
        { value: "any",      labelKey: "q_avoid_any", sticky: true },
      ],
    },
    first_act: {
      key: "first_act", kind: "real", titleKey: "q_firstact_t", signal_weight: "primary",
      options: [
        { value: "discover", labelKey: "q_firstact_discover" },
        { value: "meet",     labelKey: "q_firstact_meet"     },
        { value: "wrong",    labelKey: "q_firstact_wrong"    },
        { value: "goal",     labelKey: "q_firstact_goal"     },
        { value: "world",    labelKey: "q_firstact_world"    },
        { value: "any",      labelKey: "q_firstact_any", sticky: true },
      ],
    },
    trust: {
      key: "trust", kind: "real", titleKey: "q_trust_t", signal_weight: "primary",
      options: [
        { value: "small_drama",     labelKey: "q_trust_drama"     },
        { value: "good_thriller",   labelKey: "q_trust_thriller"  },
        { value: "weird_film",      labelKey: "q_trust_weird"     },
        { value: "smart_comedy",    labelKey: "q_trust_comedy"    },
        { value: "moody_horror",    labelKey: "q_trust_horror"    },
        { value: "erotic_thriller", labelKey: "q_trust_erotic"    },
        { value: "warm_anim",       labelKey: "q_trust_animation" },
        { value: "any",             labelKey: "q_trust_any", sticky: true },
      ],
    },
    fear: {
      key: "fear", kind: "real", titleKey: "q_fear_t", signal_weight: "primary",
      options: [
        { value: "gore",        labelKey: "q_fear_gore"        },
        { value: "tears",       labelKey: "q_fear_tears"       },
        { value: "boredom",     labelKey: "q_fear_boredom"     },
        { value: "confusion",   labelKey: "q_fear_confusion"   },
        { value: "predictable", labelKey: "q_fear_predictable" },
        { value: "any",         labelKey: "q_fear_any", sticky: true },
      ],
    },
    risk_taste: {
      key: "risk_taste", kind: "real", titleKey: "q_risktaste_t", signal_weight: "primary",
      options: [
        { value: "classic",    labelKey: "q_risktaste_classic"   },
        { value: "gem",        labelKey: "q_risktaste_gem"       },
        { value: "weird",      labelKey: "q_risktaste_weird"     },
        { value: "cult",       labelKey: "q_risktaste_cult"      },
        { value: "hate_maybe", labelKey: "q_risktaste_hate"      },
        { value: "any",        labelKey: "q_risktaste_any", sticky: true },
      ],
    },
    intent: {
      key: "intent", kind: "real", titleKey: "q_intent_t", signal_weight: "primary",
      options: [
        { value: "escape",  labelKey: "q_intent_escape"  },
        { value: "feel",    labelKey: "q_intent_feel"    },
        { value: "think",   labelKey: "q_intent_think"   },
        { value: "company", labelKey: "q_intent_company" },
        { value: "any",     labelKey: "q_intent_any", sticky: true },
      ],
    },
    depth: {
      key: "depth", kind: "real", titleKey: "q_depth_t", signal_weight: "primary",
      options: [
        { value: "fun",        labelKey: "q_depth_fun"        },
        { value: "warm",       labelKey: "q_depth_warm"       },
        { value: "thoughtful", labelKey: "q_depth_thoughtful" },
        { value: "uneasy",     labelKey: "q_depth_uneasy"     },
        { value: "ruined",     labelKey: "q_depth_ruined"     },
        { value: "any",        labelKey: "q_depth_any", sticky: true },
      ],
    },
    company: {
      key: "company", kind: "real", titleKey: "q_company_t", signal_weight: "primary",
      options: [
        { value: "alone",   labelKey: "q_company_alone"   },
        { value: "partner", labelKey: "q_company_partner" },
        { value: "friends", labelKey: "q_company_friends" },
        { value: "family",  labelKey: "q_company_family"  },
        { value: "shared",  labelKey: "q_company_shared"  },
        { value: "stray",   labelKey: "q_company_stray"   },
        { value: "any",     labelKey: "q_company_any", sticky: true },
      ],
    },
    pace: {
      key: "pace", kind: "real", titleKey: "q_pace_t", signal_weight: "primary",
      options: [
        { value: "slow",   labelKey: "q_pace_slow"   },
        { value: "steady", labelKey: "q_pace_steady" },
        { value: "fast",   labelKey: "q_pace_fast"   },
        { value: "any",    labelKey: "q_pace_any", sticky: true },
      ],
    },
    ending: {
      key: "ending", kind: "real", titleKey: "q_ending_t", signal_weight: "primary",
      options: [
        { value: "closed", labelKey: "q_ending_closed" },
        { value: "open",   labelKey: "q_ending_open"   },
        { value: "twist",  labelKey: "q_ending_twist"  },
        { value: "bitter", labelKey: "q_ending_bitter" },
        { value: "relief", labelKey: "q_ending_relief" },
        { value: "any",    labelKey: "q_ending_any", sticky: true },
      ],
    },
    attention: {
      key: "attention", kind: "real", titleKey: "q_attention_t", signal_weight: "primary",
      options: [
        { value: "no_phone",   labelKey: "q_attention_full"   },
        { value: "relaxed",    labelKey: "q_attention_relaxed"},
        { value: "background", labelKey: "q_attention_bg"     },
        { value: "any",        labelKey: "q_attention_any", sticky: true },
      ],
    },

    // ────── TEXTURE categories (lower randomizer weight, atmospheric) ──────
    door: {
      key: "door", kind: "doors", titleKey: "q_door_t", signal_weight: "texture",
      options: [
        { value: "intensity", labelKey: "q_door_intensity", svg: "door-red" },
        { value: "mystery",   labelKey: "q_door_mystery",   svg: "door-old" },
        { value: "fantasy",   labelKey: "q_door_fantasy",   svg: "door-sky" },
        { value: "intimacy",  labelKey: "q_door_intimacy",  svg: "door-warm" },
        { value: "any", labelKey: "q_door_any" },
      ],
    },
    scene: {
      key: "scene", kind: "real", titleKey: "q_scene_t", signal_weight: "texture",
      randomize: 5,
      options: [
        { value: "road",      labelKey: "q_scene_road"           },
        { value: "road",      labelKey: "q_scene_road_train"     },
        { value: "road",      labelKey: "q_scene_road_motel"     },
        { value: "road",      labelKey: "q_scene_road_gas"       },
        { value: "road",      labelKey: "q_scene_road_bus"       },
        { value: "city",      labelKey: "q_scene_city"           },
        { value: "city",      labelKey: "q_scene_city_neon"      },
        { value: "city",      labelKey: "q_scene_city_subway"    },
        { value: "city",      labelKey: "q_scene_city_rooftop"   },
        { value: "city",      labelKey: "q_scene_city_cafe"      },
        { value: "house",     labelKey: "q_scene_house"          },
        { value: "house",     labelKey: "q_scene_house_kitchen"  },
        { value: "house",     labelKey: "q_scene_house_phone"    },
        { value: "house",     labelKey: "q_scene_house_door"     },
        { value: "house",     labelKey: "q_scene_house_mirror"   },
        { value: "dialogue",  labelKey: "q_scene_dialogue"          },
        { value: "dialogue",  labelKey: "q_scene_dialogue_bar"      },
        { value: "dialogue",  labelKey: "q_scene_dialogue_dinner"   },
        { value: "dialogue",  labelKey: "q_scene_dialogue_car"      },
        { value: "dialogue",  labelKey: "q_scene_dialogue_voicemail"},
        { value: "survival",  labelKey: "q_scene_survival"          },
        { value: "survival",  labelKey: "q_scene_survival_run"      },
        { value: "survival",  labelKey: "q_scene_survival_storm"    },
        { value: "survival",  labelKey: "q_scene_survival_door"     },
        { value: "survival",  labelKey: "q_scene_survival_steps"    },
        { value: "discovery", labelKey: "q_scene_discovery"          },
        { value: "discovery", labelKey: "q_scene_discovery_box"      },
        { value: "discovery", labelKey: "q_scene_discovery_letter"   },
        { value: "discovery", labelKey: "q_scene_discovery_recording"},
        { value: "discovery", labelKey: "q_scene_discovery_key"      },
        { value: "any",       labelKey: "q_scene_any", sticky: true },
      ],
    },
    place: {
      key: "place", kind: "real", titleKey: "q_place_t", signal_weight: "texture",
      options: [
        { value: "town",      labelKey: "q_place_town"      },
        { value: "metropolis",labelKey: "q_place_metropolis"},
        { value: "forest",    labelKey: "q_place_forest"    },
        { value: "abandoned", labelKey: "q_place_abandoned" },
        { value: "nowhere",   labelKey: "q_place_nowhere"   },
        { value: "interior",  labelKey: "q_place_interior"  },
        { value: "any",       labelKey: "q_place_any", sticky: true },
      ],
    },
    atmosphere: {
      key: "atmosphere", kind: "real", titleKey: "q_atmosphere_t", signal_weight: "texture",
      options: [
        { value: "rain_neon",      labelKey: "q_atmosphere_rain_neon"      },
        { value: "warm_room",      labelKey: "q_atmosphere_warm_room"      },
        { value: "cold_house",     labelKey: "q_atmosphere_cold_house"     },
        { value: "open_sun",       labelKey: "q_atmosphere_open_sun"       },
        { value: "storm_pressure", labelKey: "q_atmosphere_storm_pressure" },
        { value: "ash_city",       labelKey: "q_atmosphere_ash_city"       },
        { value: "gold_memory",    labelKey: "q_atmosphere_gold_memory"    },
        { value: "skin_low_light", labelKey: "q_atmosphere_skin_low_light" },
        { value: "any",            labelKey: "q_atmosphere_any", sticky: true },
      ],
    },
    sound: {
      key: "sound", kind: "real", titleKey: "q_sound_t", signal_weight: "texture",
      options: [
        { value: "silence", labelKey: "q_sound_silence" },
        { value: "voices",  labelKey: "q_sound_voices"  },
        { value: "music",   labelKey: "q_sound_music"   },
        { value: "noise",   labelKey: "q_sound_noise"   },
        { value: "any",     labelKey: "q_sound_any", sticky: true },
      ],
    },
    time_of_day: {
      key: "time_of_day", kind: "real", titleKey: "q_tod_t", signal_weight: "texture",
      options: [
        { value: "dawn",        labelKey: "q_tod_dawn"        },
        { value: "morning",     labelKey: "q_tod_morning"     },
        { value: "noon",        labelKey: "q_tod_noon"        },
        { value: "afternoon",   labelKey: "q_tod_afternoon"   },
        { value: "dusk",        labelKey: "q_tod_dusk"        },
        { value: "night",       labelKey: "q_tod_night"       },
        { value: "small_hours", labelKey: "q_tod_small_hours" },
        { value: "any",         labelKey: "q_tod_any", sticky: true },
      ],
    },
    body: {
      key: "body", kind: "real", titleKey: "q_body_t", signal_weight: "texture",
      options: [
        { value: "tense",  labelKey: "q_body_tense"  },
        { value: "tired",  labelKey: "q_body_tired"  },
        { value: "wired",  labelKey: "q_body_wired"  },
        { value: "soft",   labelKey: "q_body_soft"   },
        { value: "buzzed", labelKey: "q_body_buzzed" },
        { value: "any",    labelKey: "q_body_any", sticky: true },
      ],
    },
    opening: {
      key: "opening", kind: "real", titleKey: "q_opening_t", signal_weight: "texture",
      options: [
        { value: "burst",     labelKey: "q_opening_burst"     },
        { value: "quiet",     labelKey: "q_opening_quiet"     },
        { value: "voiceover", labelKey: "q_opening_voiceover" },
        { value: "middle",    labelKey: "q_opening_middle"    },
        { value: "title",     labelKey: "q_opening_title"     },
        { value: "any",       labelKey: "q_opening_any", sticky: true },
      ],
    },
    phrase: {
      key: "phrase", kind: "phrase",
      titleKey: "q_phrase_t", signal_weight: "texture",
      placeholderKey: "q_phrase_ph",
      chipsKeys: ["q_phrase_c1","q_phrase_c2","q_phrase_c3",
                  "q_phrase_c4","q_phrase_c5","q_phrase_c6"],
    },
    // Mandatory, always last:
    ink: {
      key: "ink", kind: "rorschach", titleKey: "q_ink_t", signal_weight: "texture",
      // 4 procedural blots generated per render; "options" filled at runtime
    },
  };

  // Categories that can rotate (excluding ink which is mandatory).
  // signal_weight=primary categories carry the recommendation logic;
  // texture categories add atmosphere but lower precision.
  const ROTATING = [
    // primary
    "state","appetite","flavor","format_appetite","quality_vs_popularity","nostalgia",
    "aftertaste","decade","runtime","language_pref","avoid","first_act","trust","fear",
    "risk_taste","intent","depth","company","pace","ending","attention",
    // texture
    "door","scene","place","atmosphere","sound","time_of_day","body","opening","phrase",
  ];

  function takeRandom(keys, n) {
    return [...keys].sort(() => Math.random() - 0.5).slice(0, n);
  }

  // Build a fresh quiz. ONLY constraint: ink blot is always last (it triggers
  // the "psicoanalizándote" loading state and is the visual climax). Everything
  // else is fully random across all categories. The first step (movie/tv/any)
  // and the last (ink) are the only fixed pieces of the ritual.
  function buildSession() {
    // First ask how the engine should behave. This keeps “quick / together / watchlist intention”
    // inside the question engine instead of adding external modes on the landing page.
    // Then sample primary signals + texture for atmosphere.
    // buildSession picks N=6 categories after session_mode before ink.
    const primary = [
      "state","appetite","flavor","format_appetite","quality_vs_popularity","nostalgia",
      "aftertaste","decade","runtime","language_pref","avoid","first_act","trust","fear",
      "risk_taste","intent","depth","company","pace","ending","attention",
    ].filter(k => BANK[k]);
    const texture = [
      "door","scene","place","atmosphere","sound","time_of_day","body","opening","phrase",
    ].filter(k => BANK[k]);
    const all = [...primary, ...texture];
    const N = 6;
    const N_PRIMARY = 4;  // ~70% primary signal questions
    const picked = [];
    const primaryPool = [...primary];
    const texturePool = [...texture];
    // First pick N_PRIMARY from primary
    while (picked.length < N_PRIMARY && primaryPool.length) {
      const i = Math.floor(Math.random() * primaryPool.length);
      picked.push(primaryPool.splice(i, 1)[0]);
    }
    // Then fill remainder from texture
    while (picked.length < N && texturePool.length) {
      const i = Math.floor(Math.random() * texturePool.length);
      picked.push(texturePool.splice(i, 1)[0]);
    }
    // If not enough texture, top up from leftover primary
    while (picked.length < N && primaryPool.length) {
      const i = Math.floor(Math.random() * primaryPool.length);
      picked.push(primaryPool.splice(i, 1)[0]);
    }
    // Shuffle final order so primary/texture aren't grouped
    picked.sort(() => Math.random() - 0.5);
    return [BANK.session_mode, ...picked.map(k => BANK[k]), BANK.ink];
  }


  function applySessionMode(mode) {
    if (!mode || mode === "balanced") {
      QUIZ = buildSession();
      return false;
    }
    const forced = {
      // Three questions total: session intent → current state → inkblot.
      quick:    ["state"],
      together: ["company", "runtime", "depth", "quality_vs_popularity"],
      list:     ["runtime", "risk_taste", "quality_vs_popularity", "avoid"],
    }[mode];
    if (!forced) return false;
    QUIZ = [BANK.session_mode, ...forced.map(k => BANK[k]).filter(Boolean), BANK.ink];
    return true;
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

    // Density signals — populated as we generate so the caller can read
    // a real psychological reading of the blot, not just the seed mood.
    let densityScore = 0;  // 0..~50, drives depth signal
    let chaos = 0;          // 0..~10, drives trust:weird + risk:discover

    // 1–3 main blobs of different sizes/positions
    const nBlobs = 1 + Math.floor(Math.random() * 3);
    densityScore += nBlobs * 2;
    if (!symmetry) chaos += 4;
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
      densityScore += nFrag;
      chaos += nFrag * 0.5;
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
      densityScore += nDot * 0.3;
      chaos += nDot * 0.1;
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

    // Derived signals — clamped categories for the scorer
    const dense    = densityScore > 18;
    const sparse   = densityScore < 8;
    const chaotic  = chaos > 6;
    const broken   = !symmetry;

    return {
      mood: { ...seedMood, dense, sparse, chaotic, broken, symmetry, fragments, spatter },
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
    return moods.map(m => {
      const blot = makeBlot(m);
      // value carries the full enriched mood (incl. density/chaos signals)
      // so the post-quiz reading can interpret what the user chose.
      return { value: JSON.stringify(blot.mood), ...blot };
    });
  }

  // ────────────────────────────────────────────────────────────
  // SCORING — answers -> backend axes
  // ────────────────────────────────────────────────────────────
  function ritualToMood(a) {
    const m = {};
    // Skip any "any" sticky values — they signal no preference.
    const has = (k) => a[k] && a[k] !== "any";

    // session_mode is not an external mode; it biases the same mood object.
    if (a.session_mode === "quick")    { m.risk = m.risk || "safe"; }
    if (a.session_mode === "together") { m.company = m.company || "shared"; }
    if (a.session_mode === "list")     { m.risk = "discover"; m.popularity = m.popularity || "low"; }

    // door (texture)
    if (a.door === "intensity") { m.tone = "dark";  m.energy = "engage"; }
    if (a.door === "mystery")   { m.tone = "dark";  m.energy = "engage"; }
    if (a.door === "fantasy")   { m.tone = "light"; m.energy = "engage"; }
    if (a.door === "intimacy")  { m.tone = "light"; m.energy = "unwind"; }

    // state (primary)
    if (a.state === "drained")  { m.energy = "unwind"; m.risk = "safe"; }
    if (a.state === "restless") { m.energy = "engage"; m.risk = "discover"; }
    if (a.state === "pensive")  { m.energy = "engage"; m.depth = m.depth || "thoughtful"; }
    if (a.state === "good")     { m.risk = m.risk || "discover"; }

    // appetite + flavor (both write to a.appetite)
    if (has("appetite")) m.appetite = a.appetite;
    if (a.appetite === "feel-deep")    { m.energy = "engage"; m.depth = m.depth || "thoughtful"; }
    if (a.appetite === "horror")       { m.tone = "dark"; m.trust = "horror"; m.first_act = m.first_act || "thriller_horror"; }
    if (a.appetite === "weird")        { m.tone = "dark"; m.trust = "weird"; m.risk = "discover"; }
    if (a.appetite === "lost-20s")     { m.depth = m.depth || "thoughtful"; m.tone = m.tone || "dark"; }
    if (a.appetite === "comfort")      { m.energy = m.energy || "unwind"; m.depth = m.depth || "warm"; m.risk = m.risk || "safe"; }
    if (a.appetite === "transformative"){ m.energy = m.energy || "engage"; m.depth = m.depth || "thoughtful"; m.risk = m.risk || "discover"; }
    // flavor values (also write to appetite key)
    if (a.appetite === "girly")        { m.tone = m.tone || "light"; m.depth = m.depth || "warm"; m.first_act = m.first_act || "drama_romance"; }
    if (a.appetite === "queer")        { m.depth = m.depth || "thoughtful"; }
    if (a.appetite === "a24")          { m.quality = "high"; m.popularity = m.popularity || "mid"; m.risk = m.risk || "discover"; }
    if (a.appetite === "reality")      { m.trust = m.trust || "weird"; m.depth = m.depth || "thoughtful"; }
    if (a.appetite === "wtf")          { m.trust = "weird"; m.risk = "discover"; m.energy = "engage"; }
    if (a.appetite === "vintage_love") { m.first_act = m.first_act || "drama_romance"; m.tone = m.tone || "light"; m.decade = m.decade || "old"; }
    if (a.appetite === "catharsis")    { m.energy = "engage"; m.depth = m.depth || "uneasy"; m.tone = m.tone || "dark"; }
    if (a.appetite === "anthropocene") { m.trust = m.trust || "doc"; m.depth = m.depth || "thoughtful"; }
    if (a.appetite === "sleepover")    { m.tone = "light"; m.energy = "unwind"; m.depth = "fun"; m.company = m.company || "shared"; }
    if (a.appetite === "good_for_her") { m.tone = "dark"; m.depth = m.depth || "uneasy"; m.energy = m.energy || "engage"; }
    if (a.appetite === "desire_consequence") { m.tone = "dark"; m.depth = m.depth || "uneasy"; m.trust = m.trust || "thriller"; }

    // format_appetite (primary)
    if (a.format_appetite === "doc")         { m.trust = "doc"; m.depth = m.depth || "thoughtful"; }
    if (a.format_appetite === "anime")       { m.trust = "animation"; }
    if (a.format_appetite === "silent")      { m.decade = m.decade || "old"; }
    if (a.format_appetite === "romcom")      { m.tone = "light"; m.first_act = "drama_romance"; m.depth = m.depth || "warm"; }
    if (a.format_appetite === "horror_soft") { m.trust = "horror"; m.tone = "dark"; m.energy = m.energy || "unwind"; m.first_act = m.first_act || "thriller_horror"; }

    // quality_vs_popularity (primary) — replaces director_vibe + rewatch_taste
    if (a.quality_vs_popularity === "crowd")    { m.popularity = "high"; m.risk = m.risk || "safe"; }
    if (a.quality_vs_popularity === "canon")    { m.quality = "high"; m.popularity = "high"; m.risk = m.risk || "safe"; }
    if (a.quality_vs_popularity === "curated") { m.quality = "high"; m.popularity = m.popularity || "mid"; m.risk = m.risk || "discover"; }
    if (a.quality_vs_popularity === "hidden")   { m.quality = "high"; m.popularity = "low"; m.risk = "discover"; }
    if (a.quality_vs_popularity === "wildcard") { m.popularity = "low"; m.risk = "discover"; }

    // nostalgia (primary) — maps to decade
    if (a.nostalgia === "old_projector")      m.decade = m.decade || "old";
    if (a.nostalgia === "seventies_eighties") m.decade = m.decade || "70s80s";
    if (a.nostalgia === "nineties_video")     m.decade = m.decade || "90s";
    if (a.nostalgia === "two_thousands")      m.decade = m.decade || "00s";
    if (a.nostalgia === "near_past")          m.decade = m.decade || "now";
    if (a.nostalgia === "no_nostalgia")       m.decade = m.decade || "now";

    // aftertaste (primary) — replaces memory + lately + want
    if (a.aftertaste === "held")     { m.energy = "unwind"; m.depth = m.depth || "warm"; m.risk = m.risk || "safe"; }
    if (a.aftertaste === "lighter")  { m.energy = "unwind"; m.depth = m.depth || "fun"; m.tone = m.tone || "light"; }
    if (a.aftertaste === "thinking") { m.energy = "engage"; m.depth = m.depth || "thoughtful"; }
    if (a.aftertaste === "haunted")  { m.energy = "engage"; m.depth = m.depth || "uneasy"; m.tone = m.tone || "dark"; }
    if (a.aftertaste === "wrecked")  { m.energy = "engage"; m.depth = m.depth || "ruined"; m.tone = m.tone || "dark"; m.risk = m.risk || "discover"; }
    if (a.aftertaste === "charged")  { m.energy = "engage"; m.risk = m.risk || "discover"; }

    // scene (texture)
    if (a.scene === "survival" || a.scene === "discovery") m.energy = m.energy || "engage";
    if (a.scene === "dialogue" || a.scene === "house")     m.company = m.company || "alone";

    // intent (primary)
    if (a.intent === "escape")  { m.energy = "unwind"; m.tone = m.tone || "light"; }
    if (a.intent === "feel")    { m.energy = "engage"; }
    if (a.intent === "think")   { m.energy = "engage"; m.company = "alone"; }
    if (a.intent === "company") { m.company = "shared"; }

    // depth (primary)
    if (a.depth === "fun")        { m.energy = "unwind"; m.risk = m.risk || "safe"; }
    if (a.depth === "warm")       { m.risk = m.risk || "safe"; }
    if (a.depth === "thoughtful") { m.energy = "engage"; }
    if (a.depth === "uneasy")     { m.energy = "engage"; m.risk = "discover"; m.tone = m.tone || "dark"; }
    if (a.depth === "ruined")     { m.energy = "engage"; m.risk = "discover"; m.tone = "dark"; }

    // sound (texture)
    if (a.sound === "silence") m.energy = m.energy || "unwind";
    if (a.sound === "noise")   m.energy = m.energy || "engage";
    if (a.sound === "voices")  m.company = m.company || "shared";

    // company (primary)
    if (has("company")) m.company = a.company;

    // pace (primary)
    if (a.pace === "slow")  m.energy = m.energy || "unwind";
    if (a.pace === "fast")  m.energy = "engage";

    // ending (primary)
    if (a.ending === "twist")  m.risk = m.risk || "discover";
    if (a.ending === "bitter") m.tone = m.tone || "dark";
    if (a.ending === "open")   m.risk = m.risk || "discover";
    if (a.ending === "closed") m.risk = m.risk || "safe";
    if (a.ending === "relief") { m.energy = m.energy || "unwind"; m.depth = m.depth || "warm"; m.risk = m.risk || "safe"; }

    // place (texture)
    if (a.place === "abandoned" || a.place === "nowhere") m.tone = m.tone || "dark";
    if (a.place === "interior")   m.company = m.company || "alone";
    if (a.place === "metropolis") m.tone = m.tone || "dark";
    if (a.place === "forest")     m.tone = m.tone || "dark";

    // atmosphere (texture) — replaces weather/color/light/texture/season/smell/window/temperature
    if (a.atmosphere === "rain_neon")      { m.tone = "dark"; m.energy = "engage"; }
    if (a.atmosphere === "warm_room")      { m.tone = "light"; m.energy = "unwind"; }
    if (a.atmosphere === "cold_house")     { m.tone = "dark"; m.company = m.company || "alone"; }
    if (a.atmosphere === "open_sun")       { m.tone = "light"; m.energy = m.energy || "unwind"; }
    if (a.atmosphere === "storm_pressure") { m.tone = "dark"; m.energy = "engage"; }
    if (a.atmosphere === "ash_city")       { m.tone = "dark"; m.depth = m.depth || "thoughtful"; }
    if (a.atmosphere === "gold_memory")    { m.tone = "light"; m.depth = m.depth || "warm"; }
    if (a.atmosphere === "skin_low_light") { m.tone = "dark"; m.depth = m.depth || "uneasy"; }

    // decade (primary)
    if (has("decade")) m.decade = a.decade;

    // backend-mapped axes
    if (has("runtime"))       m.runtime = a.runtime;
    if (has("language_pref")) m.language_pref = a.language_pref;
    if (has("avoid"))         m.avoid = a.avoid;

    // risk_taste (primary)
    if (a.risk_taste === "classic")    m.risk = m.risk || "safe";
    if (a.risk_taste === "gem")        { m.risk = "discover"; m.popularity = m.popularity || "low"; m.quality = m.quality || "high"; }
    if (a.risk_taste === "weird")      { m.risk = "discover"; m.trust = m.trust || "weird"; }
    if (a.risk_taste === "cult")       { m.risk = "discover"; m.popularity = m.popularity || "low"; }
    if (a.risk_taste === "hate_maybe") { m.risk = "discover"; m.tone = m.tone || "dark"; }

    // opening (texture)
    if (a.opening === "burst")     { m.energy = "engage"; m.tone = m.tone || "dark"; }
    if (a.opening === "quiet")     { m.energy = m.energy || "unwind"; }
    if (a.opening === "voiceover") { m.tone = m.tone || "dark"; m.depth = m.depth || "thoughtful"; }
    if (a.opening === "middle")    { m.energy = "engage"; m.risk = m.risk || "discover"; }
    if (a.opening === "title")     { m.quality = m.quality || "high"; }

    // first_act (primary)
    if (a.first_act === "discover") m.first_act = "thriller_horror";
    if (a.first_act === "meet")     m.first_act = "drama_romance";
    if (a.first_act === "wrong")    { m.first_act = "thriller_horror"; m.energy = m.energy || "engage"; }
    if (a.first_act === "goal")     m.first_act = "action_adventure";
    if (a.first_act === "world")    m.first_act = "fantasy_scifi";

    // fear (primary)
    if (a.fear === "gore")        m.exclude = (m.exclude || []).concat(["horror_extreme"]);
    if (a.fear === "tears")       m.exclude = (m.exclude || []).concat(["heavy_drama"]);
    if (a.fear === "boredom")     m.energy = m.energy || "engage";
    if (a.fear === "confusion")   m.popularity = m.popularity || "high";
    if (a.fear === "predictable") m.risk = m.risk || "discover";

    // trust (primary)
    if (a.trust === "small_drama")     m.trust = "drama";
    if (a.trust === "good_thriller")   m.trust = "thriller";
    if (a.trust === "weird_film")      m.trust = "weird";
    if (a.trust === "smart_comedy")    m.trust = "comedy";
    if (a.trust === "moody_horror")    { m.trust = "horror"; m.tone = m.tone || "dark"; }
    if (a.trust === "erotic_thriller") { m.trust = "thriller"; m.tone = m.tone || "dark"; }
    if (a.trust === "warm_anim")       m.trust = "animation";

    // body (texture)
    if (a.body === "tense")  { m.energy = m.energy || "engage"; m.tone = m.tone || "dark"; }
    if (a.body === "tired")  { m.energy = m.energy || "unwind"; m.risk = m.risk || "safe"; }
    if (a.body === "wired")  { m.energy = m.energy || "engage"; }
    if (a.body === "soft")   { m.energy = m.energy || "unwind"; m.tone = m.tone || "light"; }
    if (a.body === "buzzed") { m.energy = m.energy || "engage"; m.risk = m.risk || "discover"; }

    // ink — closing ritual signal. The Rorschach has the last word
    // on tone, and contributes depth/risk based on the chosen blot's
    // procedural density and symmetry.
    if (a.ink) {
      try {
        const blot = JSON.parse(a.ink);
        // tone: ink overrides because it's the closing decision
        if (blot.tone)   m.tone = blot.tone;
        if (blot.energy) m.energy = m.energy || blot.energy;
        if (blot.door && !m.tone) m.tone = blot.door === "fantasy" || blot.door === "intimacy" ? "light" : "dark";
        // dense + dark blot → uneasy depth
        if (blot.dense && blot.tone === "dark")  m.depth = m.depth || "uneasy";
        // sparse + light blot → warm depth
        if (blot.sparse && blot.tone === "light") m.depth = m.depth || "warm";
        // chaotic or asymmetric → discover risk + weird trust
        if (blot.chaotic || blot.broken) {
          m.risk  = m.risk  || "discover";
          m.trust = m.trust || "weird";
        }
        // perfectly symmetric + spare → safe risk
        if (blot.symmetry && blot.sparse && !blot.chaotic) {
          m.risk = m.risk || "safe";
        }
      } catch {}
    }

    // phrase — free text, passed through
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

  // Build a short, reading-like synthesis of the user's answers.
  // Returns a 1–2 sentence paragraph (or "" if there's not enough signal).
  function vibeReading(rawAnswers, lang) {
    const ES = lang === "es";
    const mood = ritualToMood(rawAnswers || {});
    const a = { ...(rawAnswers || {}) };
    // The current question engine writes newer keys (aftertaste, appetite,
    // session_mode, ink) while the reading copy was originally keyed to older
    // axes. Project the backend mood back onto the reading layer so the
    // “Tu mood” panel never collapses to just the ink sentence.
    ["tone", "energy", "depth", "risk", "trust", "company", "runtime", "language_pref", "avoid", "decade"].forEach(k => {
      if (!a[k] && mood[k]) a[k] = mood[k];
    });
    if (!a.depth && a.aftertaste === "haunted") a.depth = "uneasy";
    if (!a.depth && a.aftertaste === "wrecked") a.depth = "ruined";
    if (!a.depth && a.aftertaste === "held") a.depth = "warm";
    if (!a.depth && a.aftertaste === "lighter") a.depth = "fun";
    if (!a.tone && a.atmosphere && ["rain_neon", "cold_house", "storm_pressure", "ash_city", "skin_low_light"].includes(a.atmosphere)) a.tone = "dark";
    if (!a.tone && a.atmosphere && ["warm_room", "open_sun", "gold_memory"].includes(a.atmosphere)) a.tone = "light";
    const sentences = [];

    // ── Sentence 1: where they're standing right now (state × depth)
    //    Slightly longer, interpretive — should read as a diagnosis, not a tag.
    const opener = (() => {
      if (a.state === "drained" && a.depth === "warm") {
        return ES ? "Llegas con la batería baja y algo dentro tuyo pide una mano tendida, no un desafío. Hoy vienes a recostarte, no a demostrar nada."
                  : "You're arriving low on fuel, and something in you is asking for a hand to hold, not a test. Tonight you came to lean back, not to prove anything.";
      }
      if (a.state === "drained" && a.depth === "ruined") {
        return ES ? "Vienes sin energía pero con un hambre que el descanso no calma. Quieres que algo te toque hondo, aunque te deje peor: no buscas alivio, buscas confirmación."
                  : "You arrive empty but hungry in a way rest can't fix. You want something that lands deep, even if it leaves you worse — you're not after relief, you're after confirmation.";
      }
      if (a.state === "drained" && a.depth === "thoughtful") {
        return ES ? "Llegas cansado pero con la cabeza encendida. Hoy la película tiene que pensar contigo, sostenerte el pensamiento sin pedirte que cargues con ella."
                  : "You're tired but your head is still on. Tonight the film has to think with you, hold the thought without making you carry it.";
      }
      if (a.state === "drained") {
        return ES ? "Vienes con la cuerda corta. Lo que veas tiene que sostenerse solo, sin pedirte casi nada a cambio."
                  : "You're running on a short rope. Whatever you watch has to carry itself, with almost nothing asked of you.";
      }
      if (a.state === "restless" && a.depth === "ruined") {
        return ES ? "Estás inquieto y ya pasaste la línea de los pasatiempos. Buscas algo que golpee, no algo que entretenga: quieres salir distinto a como entraste."
                  : "You're restless and you've already crossed the line of pastimes. You're after something that hits, not something that entertains — you want to walk out different from how you walked in.";
      }
      if (a.state === "restless" && a.depth === "uneasy") {
        return ES ? "Hay algo agitado adentro que todavía no encuentra forma. Vienes a que una imagen lo nombre por ti, aunque sea por un rato."
                  : "Something agitated inside you hasn't found a shape yet. You came so that an image could name it for you, even for a little while.";
      }
      if (a.state === "restless") {
        return ES ? "Vienes inquieto: la quietud no te alcanza. Necesitas movimiento, presión, algo que no te deje sentarte del todo."
                  : "You arrive restless: stillness isn't enough. You need movement, pressure, something that won't quite let you sit down.";
      }
      if (a.state === "pensive" && a.depth === "thoughtful") {
        return ES ? "Llegas pensando, y ese pensamiento no quiere que lo interrumpan. Quieres una película que camine al lado, no una que te tape la voz."
                  : "You arrive already thinking, and that thought doesn't want to be interrupted. You want a film that walks beside you, not one that talks over you.";
      }
      if (a.state === "pensive" && a.depth === "ruined") {
        return ES ? "Llegas en modo reflexivo pero con un fondo que no termina de decantar. Hay algo que quieres mover, y necesitas la película para destrabarlo."
                  : "You arrive reflective but something underneath hasn't settled. There's something you want to move, and you need the film to unstick it.";
      }
      if (a.state === "pensive") {
        return ES ? "Llegas en modo reflexivo, con espacio para que la película respire. No tienes apuro: quieres que la imagen elija el tiempo."
                  : "You arrive reflective, with room for the film to breathe. You're in no hurry — you want the image to set the pace.";
      }
      if (a.depth === "fun") {
        return ES ? "Hoy vienes liviano. Nada de pesadez, nada de doblez: la noche pide algo que se quede en la superficie y haga su trabajo bien."
                  : "Tonight you come light. Nothing heavy, nothing layered — the night calls for something that stays on the surface and does its job well.";
      }
      if (a.depth === "ruined") {
        return ES ? "Estás listo para algo que duela. Quieres salir distinto a como entraste, y ya hiciste las paces con eso."
                  : "You're ready for something that hurts. You want to walk out different from how you walked in, and you've already made peace with that.";
      }
      if (a.depth === "warm") {
        return ES ? "Vienes con ganas de que algo te abrace. Que la imagen sea cálida, que la voz se acerque, que nadie te pida demostrar nada."
                  : "You came wanting something to wrap around you. A warm image, a voice that comes close, no one asking you to prove anything.";
      }
      if (a.appetite === "horror" || a.trust === "horror") {
        return ES ? "Esta ruta pide tensión con forma: no ruido por ruido, sino una amenaza que tenga atmósfera y paciencia."
                  : "This route asks for tension with shape: not noise for noise’s sake, but a threat with atmosphere and patience.";
      }
      if (a.appetite === "comfort" || a.session_mode === "together") {
        return ES ? "La noche necesita una película que abra espacio para verla con calma: clara, conversable y sin castigar la atención."
                  : "The night needs a film that makes room: clear, easy to sit with, and not punishing your attention.";
      }
      if (a.quality_vs_popularity === "hidden" || a.risk_taste === "gem") {
        return ES ? "No estás pidiendo lo obvio. La ruta busca una buena película que todavía conserve algo de descubrimiento."
                  : "You are not asking for the obvious. The route is looking for a good film that still feels like a discovery.";
      }
      if (a.quality_vs_popularity === "canon" || a.risk_taste === "classic") {
        return ES ? "Hoy conviene apostar por algo probado: una película con reputación real, no solo una rareza lanzada al azar."
                  : "Tonight calls for a proven bet: a film with real reputation, not just a random oddity.";
      }
      return ES ? "La ruta queda clara: una película buena primero, y recién después el ajuste fino del mood."
                : "The route is clear: a good film first, then the finer mood fit.";
    })();
    if (opener) sentences.push(opener);

    // ── Sentence 2: what you're moving TOWARD (tone × door × energy)
    //    Reads as a psychological direction. Less list, more interpretation.
    const direction = (() => {
      if (a.tone === "dark" && a.door === "mystery") {
        return ES ? "Lo que persigues está más cerca de la pregunta que de la respuesta: una imagen que no se cierre del todo, que te deje un cabo suelto en la mano."
                  : "What you're chasing is closer to the question than the answer: an image that won't quite close, that leaves a loose thread in your hand.";
      }
      if (a.tone === "dark" && a.door === "intensity") {
        return ES ? "Vas a buscar la corriente, no la orilla. La intensidad es la única forma que te suena honesta esta noche."
                  : "You're heading for the current, not the shore. Intensity is the only register that sounds honest to you tonight.";
      }
      if (a.tone === "dark" && a.door === "intimacy") {
        return ES ? "Quieres bajar la voz, no apagarla. Algo cercano, en sombra, que no necesite hacer ruido para existir."
                  : "You want to lower the voice, not turn it off. Something close, in shadow, that doesn't need to make noise to exist.";
      }
      if (a.tone === "light" && a.door === "fantasy") {
        return ES ? "Te tira lo que se desprende de lo real. Una lógica que no se compromete a ser verosímil, una habitación con la puerta abierta a otro lado."
                  : "You're drawn to what unhooks from the real. A logic that won't promise to be plausible, a room with a door open to somewhere else.";
      }
      if (a.tone === "light" && a.door === "intimacy") {
        return ES ? "Pides cercanía, no espectáculo. Cámara cerca, voces bajas, lo que importa cabe en una mesa."
                  : "You're asking for closeness, not spectacle. Camera close, voices low — what matters fits on a table.";
      }
      if (a.tone === "light" && a.door === "mystery") {
        return ES ? "Buscas preguntas suaves, sin garra. Algo que se quede dando vueltas pero que no llegue a lastimarte."
                  : "You're after soft questions, no claws. Something that lingers but doesn't quite cut.";
      }
      if (a.tone === "dark" && a.energy === "engage") {
        return ES ? "Estás dispuesto a entrar. Si la película te pide algo, lo vas a entregar; tienes paciencia para el descenso."
                  : "You're willing to step in. If the film asks something of you, you'll give it — you have patience for the descent.";
      }
      if (a.tone === "light" && a.energy === "unwind") {
        return ES ? "Vienes a soltar, no a apretar. Que la película respire por ti un rato, sin que tengas que poner el hombro."
                  : "You came to let go, not to grip. Let the film breathe on your behalf for a while; no shoulder required.";
      }
      if (a.door === "fantasy") {
        return ES ? "Te llama lo que se aleja de lo real, donde la lógica del sueño manda y nadie pide explicaciones."
                  : "You're drawn to what drifts from the real, where dream logic rules and no one demands explanations.";
      }
      if (a.tone === "dark") {
        return ES ? "Buscas algo que diga lo que tú no estás diciendo, aunque sea en un idioma que tampoco sabes hablar entero."
                  : "You're looking for something to say what you aren't saying, even if it speaks a language you don't quite know either.";
      }
      return "";
    })();
    if (direction) sentences.push(direction);

    // ── Sentence 3: texture — pace, runtime, sound, weather, ending, aftertaste
    const tex = [];
    if (a.runtime === "short" || a.appetite === "snack") {
      tex.push(ES ? "algo corto, que no se enrede" : "something short, no detours");
    } else if (a.runtime === "long" || a.appetite === "epic") {
      tex.push(ES ? "tiempo largo, sin apuro" : "long stretches of time, no hurry");
    }
    if (a.pace === "slow") tex.push(ES ? "ritmo lento" : "slow rhythm");
    if (a.pace === "fast") tex.push(ES ? "ritmo nervioso" : "nervous pace");
    if (a.sound === "silence") tex.push(ES ? "silencios largos" : "long silences");
    if (a.sound === "music")   tex.push(ES ? "música que pesa" : "music that carries weight");
    if (a.weather === "rain")  tex.push(ES ? "lluvia de fondo" : "rain in the background");
    if (a.weather === "fog")   tex.push(ES ? "niebla, contornos blandos" : "fog, soft edges");
    if (a.weather === "winter")tex.push(ES ? "frío en la imagen" : "cold in the image");
    if (a.ending === "open" || a.ending === "ambiguous") {
      tex.push(ES ? "un final que no necesita cerrarse" : "an ending that doesn't need to close");
    }
    if (a.ending === "closed") {
      tex.push(ES ? "un final que cierre" : "an ending that lands");
    }
    if (a.aftertaste === "haunted" || a.aftertaste === "wrecked") {
      tex.push(ES ? "algo que se quede pegado después" : "something that stays with you after");
    }
    if (tex.length) {
      const pick = tex.slice(0, 3).join(", ");
      sentences.push(ES ? `La forma que pides es esta: ${pick}.`
                        : `The shape you're asking for is this: ${pick}.`);
    }

    // ── Sentence 4: what they're avoiding (only if explicit)
    if (a.avoid === "slow") {
      sentences.push(ES ? "Y dejas afuera el tedio: nada de autoindulgencia esta vez."
                        : "And you're leaving tedium out: no self-indulgence this time.");
    } else if (a.avoid === "violence") {
      sentences.push(ES ? "Y dejas afuera la violencia gratuita: hay otras formas de que algo duela."
                        : "And you're leaving gratuitous violence out: there are other ways for something to hurt.");
    } else if (a.avoid === "sad") {
      sentences.push(ES ? "Y dejas afuera la tristeza: hoy no toca cargar con eso."
                        : "And you're leaving sadness out: not the night to carry that.");
    }

    // ── Sentence 5: ink blot reading — the climax. Always last.
    //    The procedural blot the user picked is read as a closing diagnosis,
    //    framed as the subconscious confirming what the answers already said.
    const inkLine = inkReading(a.ink, ES);
    if (inkLine) sentences.push(inkLine);

    return sentences.join(" ");
  }

  // Read the user's chosen Rorschach blot as a psychological close.
  // The blot value is a JSON-encoded mood object enriched at generation time
  // with: tone, energy, door, dense, sparse, chaotic, broken, symmetry, fragments, spatter.
  function inkReading(inkValue, ES) {
    if (!inkValue) return "";
    let m;
    try { m = JSON.parse(inkValue); } catch { return ""; }
    if (!m || typeof m !== "object") return "";

    // Pick the dominant trait. Order matters: chaotic+broken trumps dense, etc.
    let body = "";
    if (m.broken && m.chaotic) {
      body = ES ? "una mancha rota y dispersa: estás dejando entrar el desorden, no buscas que cierre"
                : "a broken, scattered blot: you're letting disorder in, not looking for closure";
    } else if (m.broken) {
      body = ES ? "una mancha asimétrica: hay algo que no encaja y no quieres forzarlo"
                : "an asymmetric blot: something isn't fitting and you don't want to force it";
    } else if (m.chaotic && m.dense) {
      body = ES ? "una mancha densa y agitada: vienes lleno y necesitas que la pantalla esté igual de ocupada"
                : "a dense, agitated blot: you're full inside and you need the screen just as crowded";
    } else if (m.dense) {
      body = ES ? "una mancha densa y simétrica: pides peso, pero ordenado"
                : "a dense, symmetric blot: you want weight, but contained";
    } else if (m.sparse && m.symmetry) {
      body = ES ? "una mancha despejada y simétrica: pides aire, claridad, una imagen que respire"
                : "a clean, symmetric blot: you want air, clarity, an image that breathes";
    } else if (m.sparse) {
      body = ES ? "una mancha mínima: hoy lo poco te dice más que lo mucho"
                : "a minimal blot: today, less tells you more than more";
    } else if (m.fragments && m.spatter) {
      body = ES ? "una mancha con fragmentos y salpicaduras: te atrae lo que se desarma en partes"
                : "a blot with fragments and spatter: you're drawn to what comes apart in pieces";
    } else if (m.tone === "dark" && m.door === "intensity") {
      body = ES ? "una mancha oscura y tensa: vas directo a la intensidad"
                : "a dark, tense blot: you're heading straight for the intensity";
    } else if (m.tone === "dark" && m.door === "mystery") {
      body = ES ? "una mancha oscura y abierta: te interesa más la pregunta que la respuesta"
                : "a dark, open blot: you're more interested in the question than the answer";
    } else if (m.tone === "light" && m.door === "intimacy") {
      body = ES ? "una mancha clara y cerrada: pides cercanía, no espectáculo"
                : "a light, contained blot: you want closeness, not spectacle";
    } else if (m.tone === "light" && m.door === "fantasy") {
      body = ES ? "una mancha clara y ligera: te llama lo que se aleja de lo real"
                : "a light, airy blot: you're drawn to what drifts from the real";
    } else {
      // generic fallback by tone+energy
      if (m.tone === "dark" && m.energy === "engage") {
        body = ES ? "una mancha oscura: estás dispuesto a entrar"
                  : "a dark blot: you're willing to step in";
      } else if (m.tone === "light" && m.energy === "unwind") {
        body = ES ? "una mancha clara: vienes a soltar, no a apretar"
                  : "a light blot: you came here to let go, not to tense up";
      } else {
        return "";
      }
    }
    return ES ? `Y la tinta lo confirma: elegiste ${body}.`
              : `And the ink confirms it: you chose ${body}.`;
  }

  // ────────────────────────────────────────────────────────────
  // STATE & STEP MGMT
  // ────────────────────────────────────────────────────────────
  const state = { qIdx: 0, answers: {}, user: "", path: null, surpriseProfile: "quality", media: "movie", refineMood: {}, lastData: null, lastMoodLine: "" };

  const steps = {
    intro:    $('[data-step="intro"]'),
    lbAsk:    $('[data-step="lb-ask"]'),
    mediaPick:$('[data-step="media-pick"]'),
    quiz:     $('[data-step="quiz"]'),
    loading:  $('[data-step="loading"]'),
    results:  $('[data-step="results"]'),
    error:    $('[data-step="error"]'),
  };
  const stepKeyByName = {
    "intro": "intro", "lb-ask": "lbAsk", "media-pick": "mediaPick", "quiz": "quiz",
    "loading": "loading", "results": "results", "error": "error",
  };
  let _shownOnce = false;
  function show(name) {
    if (name !== "loading") stopLoader();
    const want = stepKeyByName[name] || name;
    const wasShown = _shownOnce;
    _shownOnce = true;
    Object.entries(steps).forEach(([k, el]) => el && el.classList.toggle("active", k === want));
    document.body.classList.toggle("on-hero", want === "intro");
    document.body.classList.toggle("has-results", want === "results");
    // First call (on page load) → never scroll, leave the user at the top.
    if (!wasShown) return;
    // Hero/intro → always go to 0. Other steps → scroll the section into view.
    requestAnimationFrame(() => {
      if (want === "intro") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
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
      let pool = q.options;
      if (q.randomize) {
        const sticky = q.options.filter(o => o.sticky);
        const pickable = q.options.filter(o => !o.sticky);
        if (pickable.length > q.randomize) {
          // balance: one per bucket first, then random fill, then shuffle
          const buckets = new Map();
          pickable.forEach(o => {
            if (!buckets.has(o.value)) buckets.set(o.value, []);
            buckets.get(o.value).push(o);
          });
          let picked = [];
          for (const arr of buckets.values()) {
            picked.push(arr[Math.floor(Math.random() * arr.length)]);
          }
          if (picked.length > q.randomize) {
            for (let i = picked.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [picked[i], picked[j]] = [picked[j], picked[i]];
            }
            picked = picked.slice(0, q.randomize);
          } else {
            const remaining = pickable.filter(o => !picked.includes(o));
            while (picked.length < q.randomize && remaining.length) {
              const idx = Math.floor(Math.random() * remaining.length);
              picked.push(remaining.splice(idx, 1)[0]);
            }
          }
          for (let i = picked.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [picked[i], picked[j]] = [picked[j], picked[i]];
          }
          pool = [...picked, ...sticky];
        }
      }
      if (q.key === "session_mode" && state.path !== "lb") {
        pool = pool.filter(o => o.value !== "list");
      }
      pool.forEach((o, i) => {
        const b = document.createElement("button");
        b.className = "opt" + (o.sticky ? " opt-any" : "");
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
    const q = QUIZ[state.qIdx];
    if (q?.key === "session_mode" && applySessionMode(state.answers.session_mode)) {
      state.qIdx = Math.min(1, QUIZ.length - 1);
      renderQuestion();
      return;
    }
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
  // ─── loader rotator: cycles caption + cinema icon every ~1.6s ─────────
  let _loaderTimer = null;
  let _loaderStarted = 0;
  function startLoader(useLB = false, mode = "default") {
    stopLoader();
    let msgs;
    if (mode === "psyche") {
      msgs = window.t("loading_msgs_psyche") || [window.t("loading_psyche")];
    } else if (useLB) {
      msgs = window.t("loading_msgs_lb") || [window.t("loading_lb")];
    } else {
      msgs = window.t("loading_msgs") || [window.t("loading")];
    }
    const icons = document.querySelectorAll("#load-icon .lico");
    const txt = document.getElementById("load-msg");
    let i = 0;
    _loaderStarted = Date.now();
    const swap = () => {
      const m = Array.isArray(msgs) ? msgs[i % msgs.length] : msgs;
      if (txt) {
        txt.classList.add("is-fading");
        setTimeout(() => { txt.textContent = m; txt.classList.remove("is-fading"); }, 280);
      }
      icons.forEach((el, idx) => el.classList.toggle("is-on", idx === (i % icons.length)));
      i++;
    };
    swap();
    _loaderTimer = setInterval(swap, 1600);
  }
  function stopLoader() {
    if (_loaderTimer) { clearInterval(_loaderTimer); _loaderTimer = null; }
  }

  async function surpriseFlow({ exclude, profile } = {}) {
    show("loading");
    startLoader(false);
    const country = guessCountry();
    const lang = window.LANG;
    const params = new URLSearchParams({ country, lang });
    const activeProfile = profile || state.surpriseProfile || "quality";
    params.set("profile", activeProfile);
    const m = resolveMedia(state.media);
    params.set("media", m);
    const _autoExclude = recentlyShown(80);
    const _allExclude = (exclude && exclude.length ? [...exclude, ..._autoExclude] : _autoExclude);
    if (_allExclude.length) params.set("exclude", Array.from(new Set(_allExclude)).join(","));
    const liked = tasteIds("liked"); if (liked.length) params.set("liked", liked.slice(-30).join(","));
    const disliked = tasteIds("disliked"); if (disliked.length) params.set("disliked", disliked.slice(-30).join(","));
    params.set("seed", String(Math.floor(Math.random() * 1e9)));
    state.lastMode = "surprise";
    state.lastProfile = activeProfile;
    try {
      const r = await fetchRetry(`${API_BASE}/surprise?${params}`);
      const data = await r.json();
      if (!r.ok) {
        const code = data.error || "generic";
        return showError(window.t(`err_${code}`) || window.t("err_generic"));
      }
      state.shownIds = (state.shownIds || []).concat((data.films || []).map(f => f.id).filter(Boolean));
      renderResults(data);
    } catch {
      showError(window.t("err_generic"));
    }
  }

  // "any" = coin flip per call. Mixes movie/tv across rerolls.
  function resolveMedia(media) {
    if (media === "tv") return "tv";
    if (media === "any") return Math.random() < 0.5 ? "tv" : "movie";
    return "movie";
  }

  async function recommend({ withUser, exclude }) {
    show("loading");
    // When a Letterboxd watchlist is in play, show watchlist-themed copy.
    // Otherwise, fall back to the psicoanálisis flavor.
    const useLB = Boolean(withUser && state.user);
    startLoader(useLB, useLB ? "lb" : "psyche");
    const country = guessCountry();
    const lang = window.LANG;
    const mood = ritualToMood(state.answers);
    if (state.refineMood && Object.keys(state.refineMood).length) Object.assign(mood, state.refineMood);
    // Era chip override (memphid feedback): if user clicked "Recent only",
    // force decade=now regardless of what the quiz inferred.
    if (state.eraOverride === "now") mood.decade = "now";
    if (state.eraOverride === "any") delete mood.decade;
    const moodB64 = btoa(unescape(encodeURIComponent(JSON.stringify(mood))));
    const params = new URLSearchParams({ country, lang, mood: moodB64 });
    if (withUser && state.user) params.set("user", state.user);
    params.set("media", useLB ? "movie" : resolveMedia(state.media));
    const _autoExclude = recentlyShown(80);
    const _allExclude = (exclude && exclude.length ? [...exclude, ..._autoExclude] : _autoExclude);
    if (_allExclude.length) params.set("exclude", Array.from(new Set(_allExclude)).join(","));
    const liked = tasteIds("liked"); if (liked.length) params.set("liked", liked.slice(-30).join(","));
    const disliked = tasteIds("disliked"); if (disliked.length) params.set("disliked", disliked.slice(-30).join(","));
    // cache-bust: the edge cached recommend responses kill rotation
    params.set("seed", String(Math.floor(Math.random() * 1e9)));
    state.lastWithUser = !!withUser;
    state.lastMode = "recommend";
    state.lastMoodB64 = moodB64;
    try {
      const r = await fetchRetry(`${API_BASE}/recommend?${params}`);
      const data = await r.json();
      if (!r.ok) {
        const code = data.error || "generic";
        return showError(window.t(`err_${code}`) || window.t("err_generic"));
      }
      // accumulate shown ids so re-roll excludes them
      state.shownIds = (state.shownIds || []).concat((data.films || []).map(f => f.id).filter(Boolean));
      renderResults(data);
    } catch {
      showError(window.t("err_generic"));
    }
  }


  const REFINE_ACTIONS = [
    ["weirder",     { trust: "weird", risk: "discover", popularity: "low" }],
    ["safer",       { risk: "safe", popularity: "high" }],
    ["less_known",  { popularity: "low", quality: "high", risk: "discover" }],
    ["emotional",   { depth: "thoughtful", energy: "engage" }],
    ["shorter",     { runtime: "short" }],
    ["together",    { company: "shared" }],
  ];
  const REFINE_MAP = Object.fromEntries(REFINE_ACTIONS);
  function rerunWithCurrentMode() {
    if (state.path === "surprise") state.path = "global";
    recommend({ withUser: state.lastWithUser });
  }
  function applyRefine(action) {
    const patch = REFINE_MAP[action];
    if (!patch) return;
    state.refineMood = { ...(state.refineMood || {}), ...patch };
    showToast(window.t(`toast_refine_${action}`) || window.t("toast_refine"));
    rerunWithCurrentMode();
  }
  function renderRefinePanel(data) {
    const panel = document.getElementById("refine-panel");
    if (!panel) return;
    const prefix = state.lastWithUser ? window.t("refine_lb_title") : window.t("refine_title");
    panel.innerHTML = `<div class="refine-title">${escapeHtml(prefix)}</div>`;
    const row = document.createElement("div");
    row.className = "refine-actions";
    for (const [key] of REFINE_ACTIONS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "refine-chip";
      b.dataset.refine = key;
      b.textContent = window.t(`refine_${key}`);
      b.addEventListener("click", () => applyRefine(key));
      row.appendChild(b);
    }
    panel.appendChild(row);
    panel.hidden = false;
  }
  function saveRoute() {
    try {
      const key = "moodwatch.routes.v1";
      const cur = JSON.parse(localStorage.getItem(key) || "[]");
      const item = { at: new Date().toISOString(), answers: state.answers, refineMood: state.refineMood || {}, user: state.lastWithUser ? state.user : "", media: state.media, moodLine: state.lastMoodLine || "" };
      cur.unshift(item);
      localStorage.setItem(key, JSON.stringify(cur.slice(0, 20)));
      showToast(window.t("toast_route_saved"));
    } catch { showToast(window.t("toast_route_save_failed")); }
  }
  async function shareRoute() {
    const text = [window.t("share_route_title"), state.lastMoodLine || "", location.href].filter(Boolean).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "moodwatch", text, url: location.href });
      else { await navigator.clipboard.writeText(text); showToast(window.t("toast_route_copied")); }
    } catch {}
  }
  function renderComparePanel(films) {
    const host = document.getElementById("compare-panel");
    if (!host) return;
    host.innerHTML = "";
    if (!films || films.length < 2) { host.hidden = true; return; }
    const [a, b] = films;
    const ES = window.LANG === "es";
    const mins = (f) => Number(f.runtime || 0);
    const genres = (f) => (f.genres || []).map(x => String(x).toLowerCase());
    const has = (f, ...xs) => genres(f).some(g => xs.some(x => g.includes(x)));
    const newer = Number(a.year || 0) >= Number(b.year || 0) ? a : b;
    const older = newer.id === a.id ? b : a;
    const shorter = mins(a) && mins(b) ? (mins(a) <= mins(b) ? a : b) : a;
    const heavier = has(a, "thriller", "terror", "horror", "crime", "drama") ? a : (has(b, "thriller", "terror", "horror", "crime", "drama") ? b : b);
    const conversational = state.answers?.company === "shared" || state.answers?.session_mode === "together";
    let title = window.t("compare_title");
    let body;
    if (conversational) {
      body = ES
        ? `${a.title} es la apuesta para conversar mientras ocurre. ${b.title} conviene si quieren una película que mande más que la sala.`
        : `${a.title} is the easier room pick. ${b.title} is better if you want the film to take over the room.`;
    } else if (mins(a) && mins(b) && Math.abs(mins(a) - mins(b)) >= 20) {
      body = ES
        ? `Si tienes menos energía, parte con ${shorter.title}: entra antes y pesa menos. Si quieres una sesión más larga, ${shorter.id === a.id ? b.title : a.title} tiene más espacio para crecer.`
        : `If your energy is lower, start with ${shorter.title}: it gets moving sooner. If you want a fuller sit, ${shorter.id === a.id ? b.title : a.title} has more room to grow.`;
    } else if (Number(a.year || 0) && Number(b.year || 0) && Math.abs(Number(a.year) - Number(b.year)) >= 15) {
      body = ES
        ? `${newer.title} se siente más directa para esta noche. ${older.title} es la opción si quieres textura de otra época y más paciencia.`
        : `${newer.title} is the more immediate tonight pick. ${older.title} is the move if you want older texture and more patience.`;
    } else {
      if (heavier.id === a.id) {
        body = ES
          ? `${a.title} tiene peso y entrada limpia. Si quieres algo más ligero, prueba ${b.title}.`
          : `${a.title} has weight and a clean entry. If you want something lighter, try ${b.title}.`;
      } else {
        body = ES
          ? `${a.title} es la entrada más limpia. ${heavier.title} es la opción si quieres más tensión, rareza o conversación después.`
          : `${a.title} is the cleaner entry point. ${heavier.title} is the pick if you want more tension, strangeness, or after-talk.`;
      }
    }
    host.innerHTML = `
      <div class="compare-title">${escapeHtml(title)}</div>
      <p>${escapeHtml(body)}</p>
    `;
    host.hidden = false;
  }

  function renderResults(data) {
    // Wire era chips (memphid: "no quiero pelis tan antiguas").
    const chipsEl = document.getElementById("era-chips");
    if (chipsEl && !chipsEl.dataset.bound) {
      chipsEl.dataset.bound = "1";
      chipsEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".era-chip");
        if (!btn) return;
        const era = btn.dataset.era;
        if (state.eraOverride === era) return; // no-op
        state.eraOverride = era;
        chipsEl.querySelectorAll(".era-chip").forEach(b => b.classList.toggle("is-active", b === btn));
        // Re-run the last query with the new era filter.
        if (state.lastMode === "recommend") {
          recommend({ withUser: state.lastWithUser });
        } else if (state.lastMode === "surprise") {
          surpriseFlow({ profile: state.surpriseProfile });
        }
      });
    }
    // Wire refresh button (replaces the old "Show 4 more" pill).
    const refreshBtn = document.getElementById("era-refresh");
    if (refreshBtn && !refreshBtn.dataset.bound) {
      refreshBtn.dataset.bound = "1";
      refreshBtn.addEventListener("click", () => {
        refreshBtn.classList.remove("spinning");
        // force reflow so the animation restarts on each click
        void refreshBtn.offsetWidth;
        refreshBtn.classList.add("spinning");
        if (state.lastMode === "surprise") {
          surpriseFlow({ exclude: state.shownIds || [], profile: state.surpriseProfile });
        } else {
          recommend({ withUser: state.lastWithUser, exclude: state.shownIds || [] });
        }
      });
    }
    // Hide chips on surprise mode (no quiz, era doesn't apply the same way).
    const eraRow = document.querySelector(".era-chips-row");
    if (eraRow) {
      // Refresh button stays available in surprise; only the era chips themselves hide.
      if (chipsEl) chipsEl.style.display = state.lastMode === "surprise" ? "none" : "";
    }
    const reading = vibeReading(state.answers, window.LANG);
    const moodLine = reading || data?.why?.headline || "";
    state.lastData = data;
    state.lastMoodLine = moodLine;
    renderWhy(data, moodLine);
    renderRefinePanel(data);
    const cards = $("#cards");
    cards.innerHTML = "";
    if (!data.films || !data.films.length) {
      const p = document.createElement("p");
      p.className = "err-msg";
      p.textContent = window.t("no_picks");
      cards.appendChild(p);
      const relax = document.createElement("div");
      relax.className = "no-picks-actions";
      [["safer", "refine_safer"], ["less_known", "refine_less_known"], ["shorter", "refine_shorter"]].forEach(([act, label]) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "refine-chip"; b.textContent = window.t(label); b.addEventListener("click", () => applyRefine(act)); relax.appendChild(b);
      });
      cards.appendChild(relax);
    } else {
      stopLoader();
      data.films.forEach((f, i) => cards.appendChild(filmCard(f, i + 1)));
      renderComparePanel(data.films);
      pushShown(data.films.map(f => f.id).filter(Boolean));
    }
    show("results");
  }
  function renderWhy(data, moodLine) {
    const panel = $("#why-panel");
    if (!panel) return;
    const lists = data?.matched_lists || [];
    const hasMood = !!(moodLine && moodLine.trim());
    const hasLists = lists.length > 0;
    // In surprise mode (no quiz answers) there's nothing meaningful to show here.
    // Hide the panel altogether instead of rendering an empty box with just a title.
    if (state.lastMode === "surprise" || (!hasMood && !hasLists)) {
      panel.hidden = true; panel.innerHTML = ""; return;
    }
    panel.hidden = false;
    const moodLabel = window.t("mood_label") || window.t("why_title");
    const parts = [`<div class="why-title">${escapeHtml(moodLabel)}</div>`];
    if (hasMood) {
      parts.push(`<p class="why-mood">${escapeHtml(moodLine)}</p>`);
    }
    if (hasLists) {
      parts.push(`<p class="why-lists">${window.t("why_lists")} ${lists.map(escapeHtml).join(" · ")}</p>`);
    }
    panel.innerHTML = parts.join("");
  }

  function filmCard(f, rank) {
    const c = document.createElement("article");
    c.className = "card" + (rank === 1 ? " is-primary-pick" : "");
    c._filmId = f.id;
    const taste = getTaste(f.id);
    if (taste === "liked") c.classList.add("is-liked");
    if (taste === "disliked") c.classList.add("is-disliked");
    if (taste === "seen") c.classList.add("is-seen");

    const posterWrap = document.createElement("div");
    posterWrap.className = "poster-wrap";
    const img = document.createElement("img");
    img.className = "poster";
    img.loading = "lazy";
    img.alt = f.title || "";
    img.src = f.poster || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'><rect width='60' height='90' fill='%23d8cfbc'/></svg>";
    posterWrap.appendChild(img);

    // Feedback overlay: Watched (eye) toggle, then 👍/👎 reveal when seen
    const fb = document.createElement("div");
    fb.className = "feedback";
    fb.innerHTML = `
      <button type="button" class="fb-btn fb-seen"  data-act="seen"     title="${window.t("fb_seen")}"     aria-label="${window.t("fb_seen")}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button type="button" class="fb-btn fb-like" data-act="like"     title="${window.t("fb_like")}"     aria-label="${window.t("fb_like")}">↗</button>
      <button type="button" class="fb-btn fb-dis"  data-act="dislike"  title="${window.t("fb_dislike")}"  aria-label="${window.t("fb_dislike")}">👎</button>`;
    fb.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      const cur = getTaste(f.id);
      let next = null;
      if (act === "seen")    next = cur === "seen" ? null : "seen";
      if (act === "like")    next = cur === "liked" ? "seen" : "liked";
      if (act === "dislike") next = cur === "disliked" ? "seen" : "disliked";
      setTaste(f.id, next);
      c.classList.remove("is-liked", "is-disliked", "is-seen");
      if (next === "liked")    c.classList.add("is-liked");
      if (next === "disliked") c.classList.add("is-disliked");
      if (next === "seen")     c.classList.add("is-seen");
      // Toast feedback so the user knows the system learned.
      if (next === "liked")    showToast(window.t("toast_liked"));
      if (next === "disliked") showToast(window.t("toast_disliked"));
      if (next === "seen")     showToast(window.t("toast_seen"));
      // Like → replace with a similar one. Dislike → ask what failed, then replace.
      if (next === "liked") {
        await replaceCardFromFeedback(c, f, rank, "similar");
      } else if (next === "disliked") {
        showDislikeReasons(c, f, rank);
      }
    });
    posterWrap.appendChild(fb);
    c.appendChild(posterWrap);

    const meta = document.createElement("div");
    meta.className = "meta";
    // Country code → flag emoji + label
    const countryLabel = (cc) => {
      if (!cc || cc.length !== 2) return "";
      const flag = String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1A5 + c.charCodeAt(0)));
      return `${flag} ${cc.toUpperCase()}`;
    };
    const showOriginal = f.original_title && f.original_title !== f.title;
    const specsParts = [
      f.runtime ? `${f.runtime} min` : "",
      countryLabel(f.country),
      (f.genres || []).slice(0, 2).join(" · "),
    ].filter(Boolean);
    // Title links to IMDb (imdb.com) or TMDb as fallback. Replaces the old "Detalles" button.
    // Both buttons now use canonical imdb.com (worker switched away from playimdb mirror).
    const titleHref = f.imdb_id
      ? `https://www.imdb.com/title/${f.imdb_id}/`
      : (f.tmdb || null);
    const titleHtml = titleHref
      ? `<a href="${escapeHtml(titleHref)}" target="_blank" rel="noopener" class="title-link">${escapeHtml(f.title || "")}</a>`
      : escapeHtml(f.title || "");
    meta.innerHTML = `
      <span class="card-rank">${rank === 1 ? window.t("pick_main") : window.t("pick_n").replace("{n}", String(rank).padStart(2, "0"))}</span>
      <h3>${titleHtml} ${f.year ? `<span class="yr">(${f.year})</span>` : ""}</h3>
      ${showOriginal ? `<div class="alt-title">${escapeHtml(f.original_title)}</div>` : ""}
      ${f.director ? `<div class="director">${escapeHtml(f.director)}</div>` : ""}
      <div class="specs">${specsParts.join(" — ")}</div>
      ${f.curated_note ? `<span class="editor-badge">${window.t("editor_pick")}</span>` : ""}
      ${f.from_list && !f.curated_note ? `<span class="list-badge">${window.t("from_list")} · ${escapeHtml(f.from_list)}</span>` : ""}
      ${f.from_feedback ? `<span class="taste-badge">${window.t("from_feedback")}</span>` : ""}`;
    if (f.curated_note) meta.appendChild(expandableText(f.curated_note, "note", 220));

    if (f.overview) meta.appendChild(expandableText(f.overview, "overview", 280));
    const actions = document.createElement("div");
    actions.className = "actions";
    if (f.justwatch) {
      const a = document.createElement("a");
      a.href = f.justwatch; a.target = "_blank"; a.rel = "noopener";
      a.className = "action primary";
      a.textContent = window.t("where_to_watch");
      actions.appendChild(a);
    }
    // "Detalles" (TMDb) button removed — the film title now links to IMDb/TMDb.
    // "Ver" (IMDb) button is hidden via CSS for now (kept in code, set display:none).
    if (f.imdb) {
      const a = document.createElement("a");
      a.href = f.imdb; a.target = "_blank"; a.rel = "noopener";
      a.className = "action action-imdb-hidden";
      a.textContent = window.t("on_imdb");
      actions.appendChild(a);
    }
    if (f.id && f.media !== "tv") {
      const a = document.createElement("a");
      a.href = `https://letterboxd.com/tmdb/${f.id}/`;
      a.target = "_blank"; a.rel = "noopener";
      a.className = "action lb";
      a.innerHTML = `<span class="lb-dots" aria-hidden="true"><span style="background:#00e054"></span><span style="background:#40bcf4"></span><span style="background:#ff8000"></span></span><span>${window.t("on_letterboxd")}</span>`;
      actions.appendChild(a);
    }
    meta.appendChild(actions);
    c.appendChild(meta);
    return c;
  }
  function expandableText(text, className, threshold) {
    const wrap = document.createElement("div");
    wrap.className = "expandable";
    const p = document.createElement("p");
    p.className = `${className} expandable-text`;
    p.textContent = text || "";
    wrap.appendChild(p);
    if (String(text || "").length > threshold) {
      p.classList.add("is-clamped");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "expand-toggle";
      b.setAttribute("aria-expanded", "false");
      b.textContent = window.t("read_more");
      b.addEventListener("click", () => {
        const expanded = p.classList.toggle("expanded");
        b.setAttribute("aria-expanded", String(expanded));
        b.textContent = window.t(expanded ? "read_less" : "read_more");
      });
      wrap.appendChild(b);
    }
    return wrap;
  }

  // ────────────────────────────────────────────────────────────
  // TASTE — local-only feedback (seen / liked / disliked)
  // ────────────────────────────────────────────────────────────
  const TASTE_KEY = "moodwatch.taste.v1";
  const SHOWN_KEY = "moodwatch.shown.v1";
  function readShown() {
    try { const a = JSON.parse(localStorage.getItem(SHOWN_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
  }
  function pushShown(ids) {
    try {
      const cur = readShown();
      const merged = [...cur, ...ids.map(Number).filter(Number.isFinite)];
      // keep last 200, dedup keeping recency
      const seen = new Set();
      const out = [];
      for (let i = merged.length - 1; i >= 0; i--) {
        if (seen.has(merged[i])) continue;
        seen.add(merged[i]);
        out.unshift(merged[i]);
        if (out.length >= 200) break;
      }
      localStorage.setItem(SHOWN_KEY, JSON.stringify(out));
    } catch {}
  }
  function recentlyShown(n = 80) { return readShown().slice(-n); }
  function readTaste() {
    try { return JSON.parse(localStorage.getItem(TASTE_KEY) || "{}"); } catch { return {}; }
  }
  function writeTaste(obj) {
    try { localStorage.setItem(TASTE_KEY, JSON.stringify(obj)); } catch {}
  }
  function tasteKind(v) { return typeof v === "string" ? v : (v && v.kind) || null; }
  function getTaste(id) { return tasteKind(readTaste()[String(id)]); }
  function setTaste(id, value, reason = null) {
    const t = readTaste();
    if (!value) delete t[String(id)];
    else t[String(id)] = { kind: value, reason, at: new Date().toISOString() };
    writeTaste(t);
  }
  function tasteIds(kind) {
    const t = readTaste();
    return Object.entries(t).filter(([_, v]) => tasteKind(v) === kind).map(([k]) => parseInt(k, 10)).filter(Number.isFinite);
  }
  function clearTaste() { writeTaste({}); }


  function feedbackReasonToRefine(reason) {
    return {
      not_tone: "weirder",
      too_obvious: "less_known",
      too_heavy: "safer",
      already_seen: "less_known",
      no_genre: "weirder",
    }[reason] || null;
  }
  async function replaceCardFromFeedback(card, film, rank, kind) {
    try {
      const repl = await fetchAltFilm(film.id, kind);
      if (repl) {
        const newCard = filmCard(repl, rank);
        card.style.transition = "opacity .2s";
        card.style.opacity = "0";
        setTimeout(() => card.replaceWith(newCard), 180);
      }
    } catch {}
  }
  function showDislikeReasons(card, film, rank) {
    card.querySelector(".feedback-reasons")?.remove();
    const box = document.createElement("div");
    box.className = "feedback-reasons";
    box.innerHTML = `<div class="feedback-reasons-title">${escapeHtml(window.t("feedback_why"))}</div>`;
    const reasons = ["not_tone", "too_obvious", "too_heavy", "already_seen", "no_genre", "just_swap"];
    for (const reason of reasons) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "feedback-reason";
      b.textContent = window.t(`feedback_${reason}`);
      b.addEventListener("click", () => {
        const kind = reason === "already_seen" ? "seen" : "disliked";
        setTaste(film.id, kind, reason);
        const refine = feedbackReasonToRefine(reason);
        if (refine && REFINE_MAP[refine]) state.refineMood = { ...(state.refineMood || {}), ...REFINE_MAP[refine] };
        showToast(window.t(reason === "just_swap" ? "toast_disliked" : "toast_feedback_reason"));
        box.remove();
        replaceCardFromFeedback(card, film, rank, "opposite");
      });
      box.appendChild(b);
    }
    card.querySelector(".meta")?.prepend(box);
  }

  // Fetch a single replacement film tied to a SPECIFIC seed film.
  // kind="similar" → use TMDb /similar+/recommendations of seed (for likes).
  // kind="opposite" → discover excluding seed's genres (for dislikes).
  async function fetchAltFilm(seedId, kind) {
    const country = guessCountry();
    const lang = window.LANG;
    const onCards = [...document.querySelectorAll("#cards .card")]
      .map(c => c._filmId).filter(Boolean);
    const exclude = (state.shownIds || []).concat(onCards);
    const params = new URLSearchParams({ country, lang, seed: String(seedId), kind });
    // Pass current media (movie/tv) so /alt queries the right TMDb endpoint.
    // Without this, thumb-up on a TV show 404s (worker defaults to /movie/{id}/similar).
    params.set("media", resolveMedia(state.media));
    if (exclude.length) params.set("exclude", exclude.join(","));
    try {
      const r = await fetchRetry(`${API_BASE}/alt?${params}`);
      if (!r.ok) return null;
      const data = await r.json();
      const film = data.film;
      if (film) {
        film.from_feedback = kind === "similar";
        state.shownIds = (state.shownIds || []).concat([film.id]);
      }
      return film || null;
    } catch { return null; }
  }


  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function showError(msg) { $("#err-msg").textContent = msg; show("error"); }

  // Toast notification — bottom of viewport, auto-dismiss.
  // Used for taste-feedback acknowledgement so user knows the system learned.
  let _toastTimer = null;
  function showToast(msg) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("is-visible");
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

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
      if (fig && pick.caption) {
        const q = encodeURIComponent(pick.caption);
        fig.innerHTML = `<a href="https://www.justwatch.com/us/search?q=${q}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;display:block;">${pick.caption}</a>`;
        fig.hidden = false;
        fig.title = `Where to watch: ${pick.caption}`;
      }
      if (hero) {
        const img = new Image();
        img.onload = () => {
          hero.style.backgroundImage =
            `linear-gradient(180deg, rgba(20,22,15,0.4) 0%, rgba(20,22,15,0.65) 60%, rgba(20,22,15,0.85) 100%), url("${pick.file}")`;
          // Also expose the same file for the rest of the journey (quiz/loading/results)
          // so the page never falls onto a flat bone-white background.
          document.documentElement.style.setProperty("--journey-hero", `url("${pick.file}")`);
          document.body.classList.add("has-journey-hero");
        };
        img.src = pick.file;
      }
    } catch {}
  }


  function applyTheme(theme) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("theme-light", next === "light");
    document.documentElement.classList.toggle("theme-dark", next === "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#ede7da" : "#14160f");
    try { localStorage.setItem("moodwatch.theme", next); } catch {}
  }
  function initThemeToggle() {
    let saved = "dark";
    try { saved = localStorage.getItem("moodwatch.theme") || "dark"; } catch {}
    applyTheme(saved);
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      const isLight = document.documentElement.classList.contains("theme-light");
      applyTheme(isLight ? "dark" : "light");
    });
  }

  // ────────────────────────────────────────────────────────────
  // WIRE
  // ────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    show("intro");
    loadRandomHero();
    $("#q-back").addEventListener("click", backQ);
    $("#q-skip").addEventListener("click", skipQ);

    // FAQ modal: open from footer link, close on x or backdrop click.
    const faqModal = $("#faq-modal");
    const faqLink = $("#faq-link");
    const faqClose = $("#faq-modal-close");
    if (faqModal && faqLink) {
      faqLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof faqModal.showModal === "function") faqModal.showModal();
        else faqModal.setAttribute("open", "");
      });
      faqClose?.addEventListener("click", () => faqModal.close?.() || faqModal.removeAttribute("open"));
      faqModal.addEventListener("click", (e) => {
        // Click on backdrop (the dialog itself, not its inner content) closes it.
        if (e.target === faqModal) faqModal.close?.() || faqModal.removeAttribute("open");
      });
    }

    $("#path-global").addEventListener("click", () => {
      state.path = "global";
      state.answers = {};
      state.refineMood = {};
      show("media-pick");
    });

    // Media pick: Movie / TV / Either → then start quiz.
    document.querySelectorAll("[data-media]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.media = btn.dataset.media || "movie";
        if (window.setMediaCtx) window.setMediaCtx(state.media);
        QUIZ = buildSession();
        state.qIdx = 0;
        renderQuestion();
        show("quiz");
      });
    });
    $("#media-back")?.addEventListener("click", () => { show("intro"); });
    $("#path-surprise")?.addEventListener("click", async () => {
      state.path = "surprise";
      state.media = "movie";
      state.refineMood = {};
      if (window.setMediaCtx) window.setMediaCtx(state.media);
      state.answers = {};
      state.shownIds = [];
      state.lastWithUser = false;
      state.surpriseProfile = "quality";
      await surpriseFlow();
    });
    $("#path-lb").addEventListener("click", () => {
      state.path = "lb";
      state.media = "movie";
      state.refineMood = {};
      if (window.setMediaCtx) window.setMediaCtx(state.media);
      state.answers = {};
      state.shownIds = [];
      show("lb-ask");
      // Delay focus until the entrance choreography settles (input reveals at ~0.75s).
      setTimeout(() => $("#user")?.focus(), 850);
    });

    $("#lb-confirm").addEventListener("click", () => {
      const u = ($("#user").value || "").trim().replace(/^@/, "").toLowerCase();
      if (!/^[a-z0-9_-]{1,30}$/.test(u)) {
        $("#user").focus();
        $("#user").style.borderBottomColor = "var(--accent)";
        return;
      }
      state.user = u;
      state.media = "movie";
      if (window.setMediaCtx) window.setMediaCtx(state.media);
      QUIZ = buildSession();
      state.qIdx = 0;
      state.answers = {};
      renderQuestion();
      show("quiz");
    });
    $("#lb-back").addEventListener("click", () => { state.path = null; show("intro"); });

    // LB info popover toggle
    const lbInfoBtn = $("#lb-info-btn");
    const lbPopover = $("#lb-popover");
    if (lbInfoBtn && lbPopover) {
      const closeLB = () => {
        lbPopover.hidden = true;
        lbInfoBtn.setAttribute("aria-expanded", "false");
      };
      lbInfoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = lbPopover.hidden;
        lbPopover.hidden = !open;
        lbInfoBtn.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("click", (e) => {
        if (!lbPopover.hidden && !lbPopover.contains(e.target) && e.target !== lbInfoBtn) closeLB();
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLB(); });
    }

    // Surprise chips: render 4 random + wire shuffle
    renderChips();
    $("#shuffle-chips")?.addEventListener("click", shuffleChipsAnimated);

    $("#brand-home")?.addEventListener("click", () => {
      state.qIdx = 0; state.answers = {}; state.refineMood = {}; state.user = ""; state.path = null; state.surpriseProfile = "quality"; state.media = "movie";
      if (window.setMediaCtx) window.setMediaCtx(state.media);
      state.shownIds = []; state.lastMode = null;
      const inp = $("#user"); if (inp) { inp.value = ""; }
      show("intro");
    });

    $("#restart").addEventListener("click", () => {
      state.qIdx = 0; state.answers = {}; state.refineMood = {}; state.user = ""; state.path = null; state.surpriseProfile = "quality"; state.media = "movie";
      if (window.setMediaCtx) window.setMediaCtx(state.media);
      state.shownIds = [];
      const inp = $("#user"); if (inp) { inp.value = ""; }
      show("intro");
    });
    $("#reroll")?.addEventListener("click", () => {
      if (state.path === "surprise") {
        surpriseFlow({ exclude: state.shownIds || [], profile: state.surpriseProfile });
      } else {
        recommend({ withUser: state.lastWithUser, exclude: state.shownIds || [] });
      }
    });
    $("#retry").addEventListener("click", () => recommend({ withUser: state.path === "lb" }));
    $("#save-route")?.addEventListener("click", saveRoute);
    $("#share-route")?.addEventListener("click", shareRoute);
    $("#clear-taste")?.addEventListener("click", () => {
      if (confirm(t("feedback_clear_confirm"))) {
        clearTaste();
        document.querySelectorAll(".card.is-seen,.card.is-liked,.card.is-disliked").forEach(c =>
          c.classList.remove("is-seen", "is-liked", "is-disliked"));
      }
    });
  });

  // Pool of surprise chips. Each entry: { profile, key }.
  // 'profile' must be a worker preset (see surpriseMoodForProfile).
  // 'key' is the i18n string. We render 4 random per shuffle.
  const CHIP_POOL = [
    { profile: "weird",      key: "chip_weird" },
    { profile: "weird",      key: "chip_fever" },
    { profile: "short",      key: "chip_short" },
    { profile: "short",      key: "chip_quick_bite" },
    { profile: "beautiful",  key: "chip_beautiful" },
    { profile: "beautiful",  key: "chip_soft" },
    { profile: "hurt",       key: "chip_hurt" },
    { profile: "hurt",       key: "chip_devastate" },
    { profile: "pace",       key: "chip_pace" },
    { profile: "pace",       key: "chip_chase" },
    { profile: "horror",     key: "chip_horror" },
    { profile: "horror",     key: "chip_dread" },
    { profile: "classic",    key: "chip_classic" },
    { profile: "quality",    key: "chip_quality" },
    { profile: "rainy",      key: "chip_rainy" },
    { profile: "lonely",     key: "chip_lonely" },
    { profile: "trip",       key: "chip_trip" },
    { profile: "neon",       key: "chip_neon" },
    { profile: "warm",       key: "chip_warm" },
    { profile: "cult",       key: "chip_cult" },
    { profile: "latam",      key: "chip_latam" },
    { profile: "asian",      key: "chip_asian" },
    { profile: "noir",       key: "chip_noir" },
    { profile: "lost-20s",   key: "chip_lost20s" },
  ];

  function renderChips() {
    const host = $("#quick-surprise");
    if (!host) return;
    // Keep the landing clean: three readable chips, no half-cut carousel.
    const shuffled = [...CHIP_POOL].sort(() => Math.random() - 0.5);
    const compact = shuffled.filter(c => (((window.t && window.t(c.key)) || c.profile).length <= 24));
    const pool = (compact.length >= 3 ? compact : shuffled).slice(0, 3);
    host.innerHTML = "";
    for (const c of pool) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.profile = c.profile;
      b.dataset.i18n = c.key;
      b.textContent = (window.t && window.t(c.key)) || c.profile;
      b.addEventListener("click", async () => {
        state.path = "surprise";
        state.media = "movie";
        if (window.setMediaCtx) window.setMediaCtx(state.media);
        state.answers = {};
        state.shownIds = [];
        state.lastWithUser = false;
        state.surpriseProfile = c.profile;
        await surpriseFlow({ profile: c.profile });
      });
      host.appendChild(b);
    }
  }
  function shuffleChipsAnimated() {
    const btn = $("#shuffle-chips");
    if (btn) { btn.classList.remove("spinning"); void btn.offsetWidth; btn.classList.add("spinning"); }
    renderChips();
  }
})();
