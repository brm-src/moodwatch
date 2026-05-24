// moodwatch — i18n. Auto-detects EN/ES from navigator.language.
const STRINGS = {
  en: {
    // chrome
    kicker: "Cinema · Mood · Tonight",
    back: "Back",
    skip: "Skip",
    next: "Next",
    continue: "Continue",
    restart: "Start over",
    retry: "Try again",
    support: "Support moodwatch",
    footer_made: "Built with",

    // intro
    intro_fig: "FIG. A — Caligari, 1920",
    intro_title: "A film <em>for tonight.</em>",
    intro_lead: "Pick how I'll choose. The questions are the same.",
    path_lb: "Use my Letterboxd watchlist",
    path_global: "Just recommend something",

    // lb
    lb_label: "Letterboxd",
    lb_ask_title: "Your <em>username.</em>",
    lb_continue: "Continue",
    user_ph: "your_username",

    // results
    picks_label: "Tonight",
    picks_title: "For your <em>night.</em>",
    pick_n: "Pick {n}",
    no_picks: "Nothing landed. Try a different mood.",
    where_to_watch: "Where to watch",
    on_tmdb: "Details",

    // loading / error
    loading_label: "Searching",
    loading: "Looking through the night.",
    loading_lb: "Reading your watchlist.",
    oops_label: "Trouble",
    oops: "Something <em>broke.</em>",
    err_invalid_user: "That username doesn't look right.",
    err_empty_watchlist: "Watchlist is empty or private.",
    err_generic: "Server hiccup. Try again in a moment.",

    // q numbering
    q_num: "Q.{n} of {tot}",

    // Q1 — door
    q_door_t: "Choose a <em>door.</em>",
    q_door_intensity: "A red door at the end of a dark hallway.",
    q_door_mystery:   "An old door in an abandoned house.",
    q_door_fantasy:   "A bright door floating in the sky.",
    q_door_intimacy:  "An apartment door with warm light underneath.",

    // Q2 — state (gender-neutral)
    q_state_t: "How are you <em>tonight?</em>",
    q_state_drained:  "Drained. Long day.",
    q_state_restless: "Restless. Need something.",
    q_state_pensive:  "Heavy. Sitting with things.",
    q_state_good:     "Fine. Open to anything.",

    // Q3 — scene
    q_scene_t: "Which scene <em>pulls?</em>",
    q_scene_road:      "A car driving at night with no destination.",
    q_scene_city:      "A vast city where nobody knows anyone.",
    q_scene_house:     "A quiet house hiding something strange.",
    q_scene_dialogue:  "Two people talking until everything changes.",
    q_scene_survival:  "A group trying to survive something.",
    q_scene_discovery: "Someone finding out a truth they didn't want.",

    // Q4 — ink
    q_ink_t: "Pick the <em>ink.</em>",
    q_ink_dark:  "the deep one",
    q_ink_light: "the open one",

    // Q5 — intent (neutral)
    q_intent_t: "What do you want <em>from the film?</em>",
    q_intent_escape:  "To escape.",
    q_intent_feel:    "To feel something.",
    q_intent_think:   "Something to chew on.",
    q_intent_company: "Warmth. Company.",

    // Q6 — depth
    q_depth_t: "How <em>deep?</em>",
    q_depth_fun:        "Just a good time.",
    q_depth_warm:       "Some emotion, no destruction.",
    q_depth_thoughtful: "Leave me thinking.",
    q_depth_uneasy:     "Elegant discomfort.",
    q_depth_ruined:     "Ruin my night, but ruin it well.",

    // Q7 — phrase
    q_phrase_t: "Tonight I want something that <em>feels like…</em>",
    q_phrase_ph: "(write a few words)",
    q_phrase_c1: "a strange dream",
    q_phrase_c2: "a rainy night",
    q_phrase_c3: "an emotional gut-punch",
    q_phrase_c4: "beautiful but sad",
    q_phrase_c5: "low effort, high reward",
    q_phrase_c6: "end-of-the-world vibes",
  },

  es: {
    kicker: "Cine · Mood · Esta noche",
    back: "Atrás",
    skip: "Saltar",
    next: "Siguiente",
    continue: "Continuar",
    restart: "Volver a empezar",
    retry: "Reintentar",
    support: "Apoya moodwatch",
    footer_made: "Hecho con",

    intro_fig: "FIG. A — Caligari, 1920",
    intro_title: "Una película <em>para esta noche.</em>",
    intro_lead: "Elige cómo busco. Las preguntas son las mismas.",
    path_lb: "Usar mi watchlist de Letterboxd",
    path_global: "Solo recomiéndame algo",

    lb_label: "Letterboxd",
    lb_ask_title: "Tu <em>usuario.</em>",
    lb_continue: "Continuar",
    user_ph: "tu_usuario",

    picks_label: "Esta noche",
    picks_title: "Para tu <em>noche.</em>",
    pick_n: "Pick {n}",
    no_picks: "Nada cuajó. Prueba otro mood.",
    where_to_watch: "Dónde verla",
    on_tmdb: "Detalles",

    loading_label: "Buscando",
    loading: "Mirando entre la noche.",
    loading_lb: "Leyendo tu watchlist.",
    oops_label: "Problema",
    oops: "Algo se <em>rompió.</em>",
    err_invalid_user: "Ese usuario no se ve bien.",
    err_empty_watchlist: "Tu watchlist está vacía o es privada.",
    err_generic: "Hipo del servidor. Prueba de nuevo en un momento.",

    q_num: "Q.{n} de {tot}",

    q_door_t: "Elige una <em>puerta.</em>",
    q_door_intensity: "Una puerta roja al fondo de un pasillo oscuro.",
    q_door_mystery:   "Una puerta vieja en una casa abandonada.",
    q_door_fantasy:   "Una puerta brillante flotando en el cielo.",
    q_door_intimacy:  "La puerta de un departamento con luz cálida debajo.",

    q_state_t: "¿Cómo estás <em>esta noche?</em>",
    q_state_drained:  "Sin batería. Día largo.",
    q_state_restless: "Inquietud. Necesito algo.",
    q_state_pensive:  "Pesado. Rumiando.",
    q_state_good:     "Bien. Abierto a lo que sea.",

    q_scene_t: "¿Qué escena te <em>tira?</em>",
    q_scene_road:      "Un auto manejando de noche sin destino.",
    q_scene_city:      "Una ciudad enorme donde nadie se conoce.",
    q_scene_house:     "Una casa tranquila con algo raro escondido.",
    q_scene_dialogue:  "Dos personas hablando hasta que todo cambia.",
    q_scene_survival:  "Un grupo tratando de sobrevivir a algo.",
    q_scene_discovery: "Alguien descubriendo una verdad que no quería saber.",

    q_ink_t: "Elige la <em>tinta.</em>",
    q_ink_dark:  "la profunda",
    q_ink_light: "la abierta",

    q_intent_t: "¿Qué quieres <em>de la película?</em>",
    q_intent_escape:  "Escapar.",
    q_intent_feel:    "Sentir algo.",
    q_intent_think:   "Algo para masticar.",
    q_intent_company: "Compañía. Calor.",

    q_depth_t: "¿Qué tan <em>profundo?</em>",
    q_depth_fun:        "Solo pasarla bien.",
    q_depth_warm:       "Emoción, sin destrucción.",
    q_depth_thoughtful: "Quedar pensando.",
    q_depth_uneasy:     "Incomodidad elegante.",
    q_depth_ruined:     "Arruina mi noche, pero bien.",

    q_phrase_t: "Quiero algo que se <em>sienta como…</em>",
    q_phrase_ph: "(escribe unas palabras)",
    q_phrase_c1: "un sueño raro",
    q_phrase_c2: "una noche de lluvia",
    q_phrase_c3: "un golpe emocional",
    q_phrase_c4: "bonito pero triste",
    q_phrase_c5: "no me hace pensar mucho",
    q_phrase_c6: "vibra de fin del mundo",
  },
};

function detectLang() {
  const raw = (navigator.language || "en").toLowerCase();
  return raw.startsWith("es") ? "es" : "en";
}
const LANG = detectLang();
const T = STRINGS[LANG];
window.LANG = LANG;
window.t = (key) => (T[key] !== undefined ? T[key] : (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key));
document.documentElement.lang = LANG;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    el.innerHTML = window.t(k);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach(el => {
    const spec = el.getAttribute("data-i18n-attr");
    spec.split(",").forEach(pair => {
      const [attr, key] = pair.split(":");
      el.setAttribute(attr.trim(), window.t(key.trim()));
    });
  });
});
