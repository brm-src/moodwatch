// moodwatch — ritual flow.
// 5 questions, each rendered with a custom template.
// Final screen: vibe summary -> optional Letterboxd -> picks.
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const API_BASE = (window.MOODWATCH_API || "/api").replace(/\/$/, "");

  const QUIZ = [
    {
      key: "door",
      kind: "doors",
      titleKey: "q_door_t",
      options: [
        { value: "intensity", labelKey: "q_door_intensity", svg: "door-red" },
        { value: "mystery",   labelKey: "q_door_mystery",   svg: "door-old" },
        { value: "fantasy",   labelKey: "q_door_fantasy",   svg: "door-sky" },
        { value: "intimacy",  labelKey: "q_door_intimacy",  svg: "door-warm" },
      ],
    },
    {
      key: "state",
      kind: "real",
      titleKey: "q_state_t",
      leadKey: "q_state_lead",
      options: [
        { value: "drained",  labelKey: "q_state_drained"  },
        { value: "restless", labelKey: "q_state_restless" },
        { value: "pensive",  labelKey: "q_state_pensive"  },
        { value: "good",     labelKey: "q_state_good"     },
      ],
    },
    {
      key: "scene",
      kind: "real",
      titleKey: "q_scene_t",
      options: [
        { value: "road",      labelKey: "q_scene_road"      },
        { value: "city",      labelKey: "q_scene_city"      },
        { value: "house",     labelKey: "q_scene_house"     },
        { value: "dialogue",  labelKey: "q_scene_dialogue"  },
        { value: "survival",  labelKey: "q_scene_survival"  },
        { value: "discovery", labelKey: "q_scene_discovery" },
      ],
    },
    {
      key: "ink",
      kind: "rorschach",
      titleKey: "q_ink_t",
      options: [
        { value: "dark",  labelKey: "q_ink_dark",  svg: "ink-dark"  },
        { value: "light", labelKey: "q_ink_light", svg: "ink-light" },
      ],
    },
    {
      key: "intent",
      kind: "real",
      titleKey: "q_intent_t",
      leadKey: "q_intent_lead",
      options: [
        { value: "escape",  labelKey: "q_intent_escape"  },
        { value: "feel",    labelKey: "q_intent_feel"    },
        { value: "think",   labelKey: "q_intent_think"   },
        { value: "company", labelKey: "q_intent_company" },
      ],
    },
    {
      key: "depth",
      kind: "real",
      titleKey: "q_depth_t",
      leadKey: "q_depth_lead",
      options: [
        { value: "fun",        labelKey: "q_depth_fun"        },
        { value: "warm",       labelKey: "q_depth_warm"       },
        { value: "thoughtful", labelKey: "q_depth_thoughtful" },
        { value: "uneasy",     labelKey: "q_depth_uneasy"     },
        { value: "ruined",     labelKey: "q_depth_ruined"     },
      ],
    },
    {
      key: "phrase",
      kind: "phrase",
      titleKey: "q_phrase_t",
      placeholderKey: "q_phrase_ph",
      chipsKeys: [
        "q_phrase_c1","q_phrase_c2","q_phrase_c3",
        "q_phrase_c4","q_phrase_c5","q_phrase_c6",
      ],
    },
  ];

  // Maps ritual answers -> backend axes (energy/tone/risk/company).
  function ritualToMood(a) {
    const m = {};

    // door -> tone seed + energy
    if (a.door === "intensity") { m.tone = "dark";  m.energy = "engage"; }
    if (a.door === "mystery")   { m.tone = "dark";  m.energy = "engage"; }
    if (a.door === "fantasy")   { m.tone = "light"; m.energy = "engage"; }
    if (a.door === "intimacy")  { m.tone = "light"; m.energy = "unwind"; }

    // state -> energy + risk
    if (a.state === "drained")  { m.energy = "unwind"; m.risk = "safe"; }
    if (a.state === "restless") { m.energy = "engage"; m.risk = "discover"; }
    if (a.state === "pensive")  { m.energy = "engage"; }
    if (a.state === "good")     { m.risk = m.risk || "discover"; }

    // scene -> company + energy refine
    if (a.scene === "survival" || a.scene === "discovery") m.energy = "engage";
    if (a.scene === "dialogue" || a.scene === "house")     m.company = m.company || "alone";
    if (a.scene === "city" || a.scene === "road")          m.company = m.company || "alone";

    // ink overrides tone (direct visual signal)
    if (a.ink === "dark")  m.tone = "dark";
    if (a.ink === "light") m.tone = "light";

    // intent -> energy/tone refine + company
    if (a.intent === "escape")  { m.energy = "unwind"; m.tone = m.tone || "light"; }
    if (a.intent === "feel")    { m.energy = "engage"; }
    if (a.intent === "think")   { m.energy = "engage"; m.company = "alone"; }
    if (a.intent === "company") { m.company = "shared"; }

    // depth -> final intensity dial
    if (a.depth === "fun")        { m.energy = "unwind"; m.risk = "safe"; }
    if (a.depth === "warm")       { m.risk = "safe"; }
    if (a.depth === "thoughtful") { m.energy = "engage"; }
    if (a.depth === "uneasy")     { m.energy = "engage"; m.risk = "discover"; m.tone = m.tone || "dark"; }
    if (a.depth === "ruined")     { m.energy = "engage"; m.risk = "discover"; m.tone = "dark"; }

    if (a.phrase) m.phrase = a.phrase;
    return m;
  }

  // Vibe summary: 3 stylized adjectives based on answers.
  function vibeWords(a, lang) {
    const words = [];
    const W = (en, es) => (lang === "es" ? es : en);
    if (a.depth === "ruined")     words.push(W("devastating","devastadora"));
    if (a.depth === "uneasy")     words.push(W("unnerving","incómoda"));
    if (a.depth === "thoughtful") words.push(W("slow-burning","de combustión lenta"));
    if (a.depth === "warm")       words.push(W("warm","cálida"));
    if (a.depth === "fun")        words.push(W("breezy","liviana"));
    if (a.state === "drained")    words.push(W("low-energy","de baja energía"));
    if (a.state === "restless")   words.push(W("restless","inquieta"));
    if (a.state === "pensive")    words.push(W("contemplative","contemplativa"));
    if (a.intent === "escape")    words.push(W("escapist","de escape"));
    if (a.intent === "feel")      words.push(W("emotional","emocional"));
    if (a.intent === "think")     words.push(W("cerebral","cerebral"));
    if (a.intent === "company")   words.push(W("warm","cálida"));
    if (a.ink === "dark")         words.push(W("nocturnal","nocturna"));
    if (a.ink === "light")        words.push(W("luminous","luminosa"));
    if (a.door === "mystery")     words.push(W("mysterious","misteriosa"));
    if (a.door === "intensity")   words.push(W("intense","intensa"));
    if (a.door === "fantasy")     words.push(W("dreamlike","onírica"));
    if (a.door === "intimacy")    words.push(W("intimate","íntima"));
    return [...new Set(words)].slice(0, 3);
  }

  // ---------- state ----------
  const state = { qIdx: 0, answers: {}, user: "", path: null /* "lb" | "global" */ };

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- SVG bank (Rorschach + doors) ----------
  function svgFor(name) {
    const ns = "http://www.w3.org/2000/svg";
    const wrap = document.createElementNS(ns, "svg");
    wrap.setAttribute("viewBox", "0 0 200 250");
    wrap.setAttribute("aria-hidden", "true");
    if (name === "ink-dark") {
      wrap.innerHTML = `
        <defs><filter id="b1"><feGaussianBlur stdDeviation="2"/></filter></defs>
        <g fill="#f0eadf" filter="url(#b1)">
          <path d="M100 30 C 60 50 50 80 60 110 C 30 130 35 170 70 180 C 80 210 120 215 130 185 C 165 175 175 130 145 110 C 155 80 140 50 100 30 Z"/>
          <circle cx="100" cy="100" r="6" fill="#0e0e10"/>
          <circle cx="80" cy="140" r="3"/>
          <circle cx="120" cy="140" r="3"/>
        </g>`;
    }
    if (name === "ink-light") {
      wrap.innerHTML = `
        <defs><filter id="b2"><feGaussianBlur stdDeviation="2"/></filter></defs>
        <g fill="#f0eadf" filter="url(#b2)">
          <circle cx="100" cy="80" r="35"/>
          <ellipse cx="100" cy="160" rx="70" ry="40"/>
          <path d="M100 195 Q 70 220 60 240 M100 195 Q 130 220 140 240" stroke="#f0eadf" stroke-width="6" fill="none"/>
        </g>`;
    }
    if (name === "door-red") {
      wrap.innerHTML = `
        <rect x="0" y="0" width="200" height="250" fill="#0a0a0c"/>
        <rect x="70" y="50" width="60" height="180" fill="#c43b2a"/>
        <rect x="70" y="50" width="60" height="180" fill="none" stroke="#7a1c14" stroke-width="2"/>
        <circle cx="120" cy="140" r="3" fill="#f0d36a"/>
        <line x1="0" y1="230" x2="200" y2="230" stroke="#1c1c20" stroke-width="6"/>
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
        <circle cx="125" cy="155" r="2.5" fill="#7a6a4a"/>
        <path d="M0 240 L200 240 L200 245 L0 245 Z" fill="#0d0c0a"/>`;
    }
    if (name === "door-sky") {
      wrap.innerHTML = `
        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a4a6a"/><stop offset="100%" stop-color="#a8b4c8"/>
        </linearGradient></defs>
        <rect width="200" height="250" fill="url(#g1)"/>
        <circle cx="50" cy="60" r="6" fill="#fff" opacity="0.6"/>
        <circle cx="160" cy="40" r="3" fill="#fff" opacity="0.7"/>
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
        <rect x="20" y="180" width="160" height="10" fill="#1a1310"/>
        <ellipse cx="100" cy="240" rx="120" ry="40" fill="#f5a623" opacity="0.18"/>
        <ellipse cx="100" cy="248" rx="80" ry="20" fill="#f5a623" opacity="0.28"/>`;
    }
    return wrap;
  }

  // ---------- render per question kind ----------
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
    $("#q-num").textContent = window.t("q_num").replace("{n}", String(state.qIdx + 1)).replace("{tot}", String(QUIZ.length));
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
      q.options.forEach(o => {
        const b = document.createElement("button");
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

    else if (q.kind === "real") {
      if (q.leadKey) {
        const lead = document.createElement("p");
        lead.className = "lead";
        lead.textContent = window.t(q.leadKey);
        opts.appendChild(lead);
      }
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
      cont.className = "phrase-next";
      cont.textContent = window.t("next");
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

  // ---------- vibe summary ----------
  function renderVibe() {
    const words = vibeWords(state.answers, window.LANG);
    const summary = words.length
      ? words.join(window.LANG === "es" ? " · " : " · ")
      : window.t("vibe_neutral");
    $("#vibe-text").textContent = summary;
    show("vibe");
  }

  // ---------- API ----------
  function guessCountry() {
    try {
      const loc = new Intl.Locale(navigator.language);
      if (loc.region) return loc.region.toUpperCase();
    } catch {}
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
    } catch (e) {
      showError(window.t("err_generic"));
    }
  }

  function renderResults(data) {
    // vibe summary as subtitle
    const words = vibeWords(state.answers, window.LANG);
    const desc = $("#vibe-desc");
    if (desc) desc.textContent = words.length ? words.join(" · ") : window.t("vibe_neutral") || "";

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
    img.src = f.poster || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'><rect width='60' height='90' fill='%231a1815'/></svg>";
    c.appendChild(img);
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span class="card-rank">${window.t("pick_n").replace("{n}", String(rank).padStart(2, "0"))}</span>
      <h3>${escapeHtml(f.title || "")} ${f.year ? `<span class="yr">(${f.year})</span>` : ""}</h3>
      ${f.director ? `<div class="director">${escapeHtml(f.director)}</div>` : ""}
      <div class="specs">${[f.runtime ? `${f.runtime} min` : "", (f.genres || []).slice(0,2).join(" · ")].filter(Boolean).join(" — ")}</div>
      ${f.curated_note ? `<p class="note">${escapeHtml(f.curated_note)}</p>` : ""}
    `;
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

  // ---------- random hero from manifest ----------
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
        // Preload image, then swap background to avoid flash
        const img = new Image();
        img.onload = () => {
          hero.style.backgroundImage =
            `linear-gradient(180deg, rgba(20,22,15,0.4) 0%, rgba(20,22,15,0.65) 60%, rgba(20,22,15,0.85) 100%), url("${pick.file}")`;
        };
        img.src = pick.file;
      }
      if (fig) fig.textContent = `FIG. — ${pick.caption}`;
      if (credit) credit.textContent = `Hero · ${pick.caption} · Public domain`;
    } catch (e) { /* fall through to CSS default */ }
  }

  // ---------- wire ----------
  document.addEventListener("DOMContentLoaded", () => {
    show("intro");
    loadRandomHero();
    $("#q-back").addEventListener("click", backQ);
    $("#q-skip").addEventListener("click", skipQ);

    // intro paths
    $("#path-global").addEventListener("click", () => {
      state.path = "global";
      state.qIdx = 0;
      renderQuestion();
      show("quiz");
    });
    $("#path-lb").addEventListener("click", () => {
      state.path = "lb";
      show("lb-ask");
      setTimeout(() => $("#user")?.focus(), 100);
    });

    // lb-ask
    $("#lb-confirm").addEventListener("click", () => {
      const u = ($("#user").value || "").trim().replace(/^@/, "").toLowerCase();
      if (!/^[a-z0-9_-]{1,30}$/.test(u)) {
        $("#user").focus();
        $("#user").style.borderBottomColor = "var(--accent)";
        return;
      }
      state.user = u;
      state.qIdx = 0;
      renderQuestion();
      show("quiz");
    });
    $("#lb-back").addEventListener("click", () => { state.path = null; show("intro"); });

    // restart / retry
    $("#restart").addEventListener("click", () => {
      state.qIdx = 0; state.answers = {}; state.user = ""; state.path = null;
      const inp = $("#user"); if (inp) { inp.value = ""; inp.style.borderBottomColor = ""; }
      show("intro");
    });
    $("#retry").addEventListener("click", () => {
      recommend({ withUser: state.path === "lb" });
    });
  });
})();
