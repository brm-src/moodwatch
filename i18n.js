// moodwatch — i18n. Auto-detects EN/ES from navigator.language.
const STRINGS = {
  en: {
    // chrome
    kicker: "A ritual, not a form",
    back: "Back",
    skip: "Skip",
    next: "Next",
    continue: "Continue",
    restart: "Start over",
    retry: "Try again",
    support: "Support moodwatch",
    footer_made: "Built with",

    // step labels
    intro_label: "Begin",
    intro_title: "A film for <em>tonight.</em>",
    intro_lead: "Pick how I'll choose. The ritual is the same either way.",
    path_lb: "Personalize with my Letterboxd watchlist",
    path_global: "Just recommend something",
    lb_label: "Letterboxd",
    lb_ask_title: "Your <em>username.</em>",
    lb_ask_lead: "I read your public watchlist. Nothing is stored.",
    lb_continue: "Continue",
    vibe_label: "Your vibe",
    vibe_lead: "Now, the film.",
    vibe_pick: "Pick the film",
    vibe_neutral: "Open to anything",
    user_ph: "your_username",
    picks_label: "Tonight",
    pick_n: "Pick {n}",
    no_picks: "Nothing landed. Try a different vibe.",
    oops_label: "Trouble",
    oops: "Something <em>broke.</em>",
    loading: "Reading the room…",
    loading_lb: "Reading your watchlist… give me a moment.",

    // results
    where_to_watch: "Where to watch",
    on_tmdb: "Details",

    // errors
    err_invalid_user: "That username doesn't look right.",
    err_empty_watchlist: "Watchlist is empty or private.",
    err_generic: "Server error. Try again in a bit.",

    // q numbering
    q_num: "{n} / {tot}",

    // Q1 — door
    q_door_t: "Choose a <em>door.</em>",
    q_door_intensity: "A red door at the end of a dark hallway.",
    q_door_mystery:   "An old door in an abandoned house.",
    q_door_fantasy:   "A bright door floating in the sky.",
    q_door_intimacy:  "An apartment door with warm light underneath.",

    // Q2 — state
    q_state_t: "How are you <em>tonight?</em>",
    q_state_lead: "No filter. Just the truth.",
    q_state_drained:  "Drained. Day was a lot.",
    q_state_restless: "Restless. Need something.",
    q_state_pensive:  "Pensive. Sitting with things.",
    q_state_good:     "Good. Open to anything.",

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

    // Q5 — intent
    q_intent_t: "And from the film, <em>what?</em>",
    q_intent_lead: "Be specific. The vaguer you are, the more generic the pick.",
    q_intent_escape:  "I want to escape.",
    q_intent_feel:    "I want to feel something.",
    q_intent_think:   "I want something to chew on.",
    q_intent_company: "I want company. Warmth.",

    // Q6 — depth
    q_depth_t: "How <em>deep?</em>",
    q_depth_lead: "Where do you want to land at the end.",
    q_depth_fun:        "I just want to have a good time.",
    q_depth_warm:       "Some emotion, but no destruction.",
    q_depth_thoughtful: "I want to be left thinking.",
    q_depth_uneasy:     "Elegant discomfort.",
    q_depth_ruined:     "Ruin my night, but ruin it well.",

    // Q7 — phrase
    q_phrase_t: "Tonight I want something that <em>feels like…</em>",
    q_phrase_ph: "(write it in a few words)",
    q_phrase_c1: "a strange dream",
    q_phrase_c2: "a rainy night",
    q_phrase_c3: "an emotional gut-punch",
    q_phrase_c4: "beautiful but sad",
    q_phrase_c5: "low effort, high reward",
    q_phrase_c6: "end-of-the-world vibes",
  },

  es: {
    kicker: "Un ritual, no un formulario",
    back: "Atrás",
    skip: "Saltar",
    next: "Siguiente",
    continue: "Continuar",
    restart: "Volver a empezar",
    retry: "Reintentar",
    support: "Apoya moodwatch",
    footer_made: "Hecho con",

    intro_label: "Comenzar",
    intro_title: "Una película para <em>esta noche.</em>",
    intro_lead: "Elige cómo te recomiendo. El ritual es el mismo en ambos casos.",
    path_lb: "Personalizar con mi watchlist de Letterboxd",
    path_global: "Solo recomiéndame algo",
    lb_label: "Letterboxd",
    lb_ask_title: "Tu <em>usuario.</em>",
    lb_ask_lead: "Leo tu watchlist pública. No se guarda nada.",
    lb_continue: "Continuar",
    vibe_label: "Tu vibra",
    vibe_lead: "Ahora, la película.",
    vibe_pick: "Elegir la película",
    vibe_neutral: "Abierta a cualquier cosa",
    user_ph: "tu_usuario",
    picks_label: "Esta noche",
    pick_n: "Pick {n}",
    no_picks: "Nada cuajó. Prueba otra vibra.",
    oops_label: "Problema",
    oops: "Algo se <em>rompió.</em>",
    loading: "Leyendo el ambiente…",
    loading_lb: "Leyendo tu watchlist… dame un momento.",

    where_to_watch: "Dónde verla",
    on_tmdb: "Detalles",

    err_invalid_user: "Ese usuario no se ve bien.",
    err_empty_watchlist: "Tu watchlist está vacía o es privada.",
    err_generic: "Error del servidor. Prueba de nuevo en un momento.",

    q_num: "{n} / {tot}",

    q_door_t: "Elige una <em>puerta.</em>",
    q_door_intensity: "Una puerta roja al fondo de un pasillo oscuro.",
    q_door_mystery:   "Una puerta vieja en una casa abandonada.",
    q_door_fantasy:   "Una puerta brillante flotando en el cielo.",
    q_door_intimacy:  "La puerta de un departamento con luz cálida abajo.",

    q_state_t: "¿Cómo estás <em>esta noche?</em>",
    q_state_lead: "Sin filtro. La verdad nomás.",
    q_state_drained:  "Vaciada. El día pesó.",
    q_state_restless: "Inquieta. Necesito algo.",
    q_state_pensive:  "Pensativa. Rumiando cosas.",
    q_state_good:     "Bien. Abierta a lo que sea.",

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

    q_intent_t: "Y de la película, <em>¿qué quieres?</em>",
    q_intent_lead: "Sé específica. Mientras más vaga, más genérica la recomendación.",
    q_intent_escape:  "Quiero escapar.",
    q_intent_feel:    "Quiero sentir algo.",
    q_intent_think:   "Quiero algo para masticar.",
    q_intent_company: "Quiero compañía. Calor.",

    q_depth_t: "¿Qué tan <em>profundo?</em>",
    q_depth_lead: "Dónde quieres aterrizar al final.",
    q_depth_fun:        "Solo quiero pasarla bien.",
    q_depth_warm:       "Algo con emoción, pero sin destrucción.",
    q_depth_thoughtful: "Quiero quedar pensando.",
    q_depth_uneasy:     "Incomodidad elegante.",
    q_depth_ruined:     "Arruíname la noche, pero bien.",

    q_phrase_t: "Esta noche quiero algo que se <em>sienta como…</em>",
    q_phrase_ph: "(escríbelo en pocas palabras)",
    q_phrase_c1: "un sueño raro",
    q_phrase_c2: "una noche de lluvia",
    q_phrase_c3: "un golpe emocional",
    q_phrase_c4: "bonito pero triste",
    q_phrase_c5: "algo que no me haga pensar mucho",
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
