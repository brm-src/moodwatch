// moodwatch — i18n. Auto-detects EN/ES from navigator.language.
const STRINGS = {
  en: {
    kicker: "Cinema · Mood · Pick",
    back: "Back",
    skip: "Skip",
    next: "Next",
    continue: "Continue",
    restart: "Start over",
    retry: "Try again",
    support: "Support moodwatch",
    footer_made: "Built with",

    intro_fig: "",
    intro_title: "A film, <em>chosen by mood.</em>",
    intro_lead: "Pick how I'll choose. Questions vary each visit.",
    path_lb: "Use my Letterboxd watchlist",
    path_global: "Just recommend something",

    lb_label: "Letterboxd",
    lb_ask_title: "Your <em>username.</em>",
    lb_continue: "Continue",
    user_ph: "your_username",

    picks_label: "Picks",
    picks_title: "For your <em>mood.</em>",
    pick_n: "Pick {n}",
    no_picks: "Nothing landed. Try a different mood.",
    where_to_watch: "Where to watch",
    on_tmdb: "Details",

    loading_label: "Searching",
    loading: "Reading the room.",
    loading_lb: "Reading your watchlist.",
    oops_label: "Trouble",
    oops: "Something <em>broke.</em>",
    err_invalid_user: "That username doesn't look right.",
    err_empty_watchlist: "Watchlist is empty or private.",
    err_generic: "Server hiccup. Try again in a moment.",

    q_num: "Q.{n} of {tot}",

    q_door_t: "Choose a <em>door.</em>",
    q_door_intensity: "A red door at the end of a dark hallway.",
    q_door_mystery:   "An old door in an abandoned house.",
    q_door_fantasy:   "A bright door floating in the sky.",
    q_door_intimacy:  "An apartment door with warm light underneath.",

    q_state_t: "How <em>do you feel?</em>",
    q_state_drained:  "Out of battery, it was a long day.",
    q_state_restless: "Restless. Need something.",
    q_state_pensive:  "Heavy. Ruminating.",
    q_state_good:     "Good. Up for whatever.",

    q_scene_t: "Which scene <em>is you right now?</em>",
    q_scene_road:      "A car driving with no destination.",
    q_scene_city:      "A vast city where nobody knows anyone.",
    q_scene_house:     "A quiet house hiding something strange.",
    q_scene_dialogue:  "Two people talking until everything changes.",
    q_scene_survival:  "A group trying to survive something.",
    q_scene_discovery: "Someone finding out a truth they didn't want.",

    q_ink_t: "Choose a <em>blot.</em>",

    q_intent_t: "What do you want <em>from the film?</em>",
    q_intent_escape:  "To escape.",
    q_intent_feel:    "To feel something.",
    q_intent_think:   "Something to chew on.",
    q_intent_company: "Warmth. Company.",

    q_depth_t: "How <em>deep?</em>",
    q_depth_fun:        "Just a good time.",
    q_depth_warm:       "Some emotion, no destruction.",
    q_depth_thoughtful: "Leave me thinking.",
    q_depth_uneasy:     "Elegant discomfort.",
    q_depth_ruined:     "Wreck me, but wreck me well.",

    q_weather_t: "Pick the <em>weather.</em>",
    q_weather_rain:   "Rain on the window.",
    q_weather_fog:    "Fog you can't see through.",
    q_weather_sun:    "Late afternoon sun.",
    q_weather_storm:  "A coming storm.",
    q_weather_winter: "Cold without snow.",

    q_sound_t: "What do you <em>hear?</em>",
    q_sound_silence: "Silence.",
    q_sound_voices:  "Voices in the next room.",
    q_sound_music:   "Music coming from somewhere.",
    q_sound_noise:   "Noise. A lot of it.",

    q_company_t: "And <em>who else?</em>",
    q_company_alone:  "I'd rather watch alone.",
    q_company_shared: "Someone next to me.",
    q_company_stray:  "A stray cat will do.",

    q_pace_t: "What <em>pace?</em>",
    q_pace_slow:   "Slow. Let it breathe.",
    q_pace_steady: "Steady, no rush.",
    q_pace_fast:   "Fast. Don't let me look away.",

    q_ending_t: "How should it <em>end?</em>",
    q_ending_closed: "Closed. Tied up.",
    q_ending_open:   "Open. Let it linger.",
    q_ending_twist:  "Twist. Pull the rug.",
    q_ending_bitter: "Bitter. No mercy.",

    q_phrase_t: "I want something that <em>feels like…</em>",
    q_phrase_ph: "(write a few words)",
    q_phrase_c1: "a strange dream",
    q_phrase_c2: "a rainy afternoon",
    q_phrase_c3: "an emotional gut-punch",
    q_phrase_c4: "beautiful but sad",
    q_phrase_c5: "low effort, high reward",
    q_phrase_c6: "end-of-the-world vibes",
  },

  es: {
    kicker: "Cine · Mood · Pick",
    back: "Atrás",
    skip: "Saltar",
    next: "Siguiente",
    continue: "Continuar",
    restart: "Volver a empezar",
    retry: "Reintentar",
    support: "Apoya moodwatch",
    footer_made: "Hecho con",

    intro_fig: "",
    intro_title: "Una película, <em>según tu mood.</em>",
    intro_lead: "Elige cómo busco. Las preguntas cambian cada visita.",
    path_lb: "Usar mi watchlist de Letterboxd",
    path_global: "Solo recomiéndame algo",

    lb_label: "Letterboxd",
    lb_ask_title: "Tu <em>usuario.</em>",
    lb_continue: "Continuar",
    user_ph: "tu_usuario",

    picks_label: "Picks",
    picks_title: "Para tu <em>mood.</em>",
    pick_n: "Pick {n}",
    no_picks: "Nada cuajó. Prueba otro mood.",
    where_to_watch: "Dónde verla",
    on_tmdb: "Detalles",

    loading_label: "Buscando",
    loading: "Leyendo el ambiente.",
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

    q_state_t: "¿Cómo te <em>sientes?</em>",
    q_state_drained:  "Sin batería, fue un día largo.",
    q_state_restless: "Con inquietud. Necesito algo.",
    q_state_pensive:  "Con pesadez, rumiando mis pensamientos.",
    q_state_good:     "Bien. Con disposición a lo que sea.",

    q_scene_t: "¿Qué escena te <em>representa en este momento?</em>",
    q_scene_road:      "Un auto manejando sin destino.",
    q_scene_city:      "Una ciudad enorme donde nadie se conoce.",
    q_scene_house:     "Una casa tranquila con algo raro escondido.",
    q_scene_dialogue:  "Dos personas hablando hasta que todo cambia.",
    q_scene_survival:  "Un grupo tratando de sobrevivir a algo.",
    q_scene_discovery: "Alguien descubriendo una verdad que no quería saber.",

    q_ink_t: "Elige una <em>mancha.</em>",

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
    q_depth_ruined:     "Destrúyeme, pero hazlo bien.",

    q_weather_t: "Elige el <em>clima.</em>",
    q_weather_rain:   "Lluvia en la ventana.",
    q_weather_fog:    "Niebla espesa, no se ve nada.",
    q_weather_sun:    "Sol del atardecer.",
    q_weather_storm:  "Una tormenta acercándose.",
    q_weather_winter: "Frío sin nieve.",

    q_sound_t: "¿Qué <em>escuchas?</em>",
    q_sound_silence: "Silencio.",
    q_sound_voices:  "Voces en la pieza de al lado.",
    q_sound_music:   "Música viniendo de alguna parte.",
    q_sound_noise:   "Ruido. Mucho.",

    q_company_t: "¿Y <em>con quién?</em>",
    q_company_alone:  "Prefiero verla solo.",
    q_company_shared: "Alguien al lado.",
    q_company_stray:  "Un gato perdido sirve.",

    q_pace_t: "¿Qué <em>ritmo?</em>",
    q_pace_slow:   "Lento. Que respire.",
    q_pace_steady: "Sostenido, sin apuro.",
    q_pace_fast:   "Rápido. Que no me deje mirar a otro lado.",

    q_ending_t: "¿Cómo debe <em>terminar?</em>",
    q_ending_closed: "Cerrado. Bien atado.",
    q_ending_open:   "Abierto. Que quede flotando.",
    q_ending_twist:  "Con vuelta. Que me saque la silla.",
    q_ending_bitter: "Amargo. Sin piedad.",

    q_phrase_t: "Quiero algo que se <em>sienta como…</em>",
    q_phrase_ph: "(escribe unas palabras)",
    q_phrase_c1: "un sueño raro",
    q_phrase_c2: "una tarde de lluvia",
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
