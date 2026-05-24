// moodwatch app — quiz flow, API call, render
(function () {
  const QUIZ = [
    { key: "time",    title: "q_time_t",    options: [
      { value: "short",   label: "q_time_short" },
      { value: "medium",  label: "q_time_medium" },
      { value: "long",    label: "q_time_long" },
    ] },
    { key: "energy",  title: "q_energy_t",  options: [
      { value: "engage",  label: "q_energy_engage" },
      { value: "unwind",  label: "q_energy_unwind" },
    ] },
    { key: "tone",    title: "q_tone_t",    options: [
      { value: "dark",    label: "q_tone_dark" },
      { value: "light",   label: "q_tone_light" },
    ] },
    { key: "company", title: "q_company_t", options: [
      { value: "alone",   label: "q_company_alone" },
      { value: "shared",  label: "q_company_shared" },
    ] },
    { key: "risk",    title: "q_risk_t",    options: [
      { value: "safe",    label: "q_risk_safe" },
      { value: "discover", label: "q_risk_discover" },
    ] },
  ];

  const state = {
    qIdx: 0,
    answers: {},
    user: "",
  };

  const $ = (sel) => document.querySelector(sel);
  const steps = {
    quiz:    $('[data-step="quiz"]'),
    lb:      $('[data-step="lb"]'),
    loading: $('[data-step="loading"]'),
    results: $('[data-step="results"]'),
    error:   $('[data-step="error"]'),
  };

  function show(name) {
    Object.entries(steps).forEach(([k, el]) => {
      if (el) el.classList.toggle("hidden", k !== name);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- quiz ----------
  function renderQuestion() {
    const q = QUIZ[state.qIdx];
    $("#q-title").textContent = window.t(q.title);
    const opts = $("#q-options");
    opts.innerHTML = "";
    q.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = window.t(opt.label);
      if (state.answers[q.key] === opt.value) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        state.answers[q.key] = opt.value;
        nextQuestion();
      });
      opts.appendChild(btn);
    });
    const pct = (state.qIdx / QUIZ.length) * 100;
    $("#prog").style.width = `${pct}%`;
    $("#q-back").style.visibility = state.qIdx === 0 ? "hidden" : "visible";
  }

  function nextQuestion() {
    if (state.qIdx < QUIZ.length - 1) {
      state.qIdx++;
      renderQuestion();
    } else {
      $("#prog").style.width = "100%";
      show("lb");
    }
  }

  function backQuestion() {
    if (state.qIdx > 0) { state.qIdx--; renderQuestion(); }
  }

  function skipQuestion() {
    delete state.answers[QUIZ[state.qIdx].key];
    nextQuestion();
  }

  // API endpoint — overridable for prod (Cloudflare Worker URL)
  const API_BASE = (window.MOODWATCH_API || "/api").replace(/\/$/, "");

  // ---------- API ----------
  async function recommend({ withUser }) {
    show("loading");
    $("#load-msg").textContent = withUser ? window.t("loading_lb") : window.t("loading");
    const country = guessCountry();
    const lang = window.LANG;
    const moodB64 = btoa(unescape(encodeURIComponent(JSON.stringify(state.answers))));
    const params = new URLSearchParams({ country, lang, mood: moodB64 });
    if (withUser && state.user) params.set("user", state.user);

    try {
      const r = await fetch(`${API_BASE}/recommend?${params}`);
      const data = await r.json();
      if (!r.ok) {
        const code = data.error || "err_generic";
        const msg = window.t(`err_${code}`) || window.t("err_generic");
        return showError(msg);
      }
      renderResults(data);
    } catch (e) {
      showError(window.t("err_generic"));
    }
  }

  function guessCountry() {
    // Try Intl.Locale (browser-resolved region), fallback to language tag, fallback US
    try {
      const loc = new Intl.Locale(navigator.language);
      if (loc.region) return loc.region.toUpperCase();
    } catch {}
    const m = (navigator.language || "").match(/-([A-Z]{2})/i);
    return m ? m[1].toUpperCase() : "US";
  }

  // ---------- results ----------
  function renderResults(data) {
    const cards = $("#cards");
    cards.innerHTML = "";
    if (!data.films || !data.films.length) {
      const empty = document.createElement("p");
      empty.textContent = window.t("no_picks");
      empty.style.color = "#9a9a9a";
      cards.appendChild(empty);
    } else {
      data.films.forEach(f => cards.appendChild(filmCard(f, data.mode)));
    }
    show("results");
  }

  function filmCard(f, mode) {
    const card = document.createElement("article");
    card.className = "card";
    const poster = document.createElement("img");
    poster.className = "poster";
    poster.loading = "lazy";
    poster.alt = f.title || "";
    poster.src = f.poster || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 90'><rect width='60' height='90' fill='%232a2a2e'/><text x='50%25' y='50%25' fill='%23999' text-anchor='middle' font-size='10'>?</text></svg>`;
    card.appendChild(poster);

    const meta = document.createElement("div");
    meta.className = "meta";
    const h = document.createElement("h3");
    h.textContent = `${f.title}${f.year ? ` (${f.year})` : ""}`;
    meta.appendChild(h);

    const sub = document.createElement("p");
    sub.className = "sub";
    const bits = [];
    if (f.runtime) bits.push(`${f.runtime}m`);
    if (f.genres && f.genres.length) bits.push(f.genres.slice(0, 2).join(" · "));
    sub.textContent = bits.join(" · ");
    meta.appendChild(sub);

    if (f.curated_note) {
      const note = document.createElement("p");
      note.className = "sub";
      note.style.color = "#d6c5a8";
      note.style.fontStyle = "italic";
      note.textContent = `“${f.curated_note}”`;
      meta.appendChild(note);
    }

    if (f.reasons && f.reasons.length) {
      const tags = document.createElement("div");
      tags.className = "reasons";
      const reasonLabels = {
        runtime: "⏱", energy: "⚡", tone: "🎭",
        known: "✓", "off-radar": "✦", rated: "★", curated: "🤝"
      };
      f.reasons.forEach(r => {
        const t = document.createElement("span");
        t.className = "tag";
        t.textContent = `${reasonLabels[r] || ""} ${r}`.trim();
        tags.appendChild(t);
      });
      meta.appendChild(tags);
    }

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
    card.appendChild(meta);
    return card;
  }

  function showError(msg) {
    $("#err-msg").textContent = msg;
    show("error");
  }

  // ---------- wire ----------
  document.addEventListener("DOMContentLoaded", () => {
    renderQuestion();
    $("#q-back").addEventListener("click", backQuestion);
    $("#q-skip").addEventListener("click", skipQuestion);

    $("#use-lb").addEventListener("click", () => {
      const u = ($("#user").value || "").trim().replace(/^@/, "").toLowerCase();
      if (!/^[a-z0-9_-]{1,30}$/.test(u)) {
        $("#user").focus();
        $("#user").style.outline = "1px solid #ff8b8b";
        return;
      }
      state.user = u;
      recommend({ withUser: true });
    });
    $("#skip-lb").addEventListener("click", () => recommend({ withUser: false }));
    $("#restart").addEventListener("click", () => {
      state.qIdx = 0; state.answers = {}; state.user = "";
      $("#user").value = "";
      renderQuestion();
      show("quiz");
    });
    $("#retry").addEventListener("click", () => {
      show(state.user ? "lb" : "quiz");
    });
  });
})();
