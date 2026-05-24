// i18n: detect browser language, expose t() and apply data-i18n attrs.
const STRINGS = {
  en: {
    tagline: "A mood-based pick. Free, no signup.",
    user_label: "Letterboxd username (optional)",
    user_ph: "your_username",
    use_lb: "Personalize with my watchlist",
    skip_lb: "Just recommend me something",
    next: "Next",
    back: "Back",
    skip: "Skip",
    loading: "Reading the vibes…",
    loading_lb: "Reading your watchlist… this may take a few seconds.",
    picks: "Tonight's picks",
    no_picks: "Couldn't find a good match. Try different moods.",
    restart: "Start over",
    oops: "Something broke",
    retry: "Try again",
    err_invalid_user: "That username doesn't look right.",
    err_empty: "Watchlist is empty or private.",
    err_generic: "Server error. Try again in a bit.",
    where_to_watch: "Where to watch",
    on_tmdb: "On TMDb",
    support: "Support moodwatch",
    footer_made: "Made with",
    // quiz
    q_time_t: "How much time do you have?",
    q_time_short: "Under 95 min",
    q_time_medium: "95–130 min",
    q_time_long: "130 min+",
    q_energy_t: "What kind of headspace?",
    q_energy_engage: "I want to engage",
    q_energy_unwind: "I want to unwind",
    q_tone_t: "Tone?",
    q_tone_dark: "Dark / heavy",
    q_tone_light: "Light / warm",
    q_company_t: "Watching with…?",
    q_company_alone: "Alone",
    q_company_shared: "With someone",
    q_risk_t: "Known territory or new?",
    q_risk_safe: "Something safe",
    q_risk_discover: "Surprise me",
  },
  es: {
    tagline: "Una recomendación según tu mood. Gratis, sin registro.",
    user_label: "Usuario de Letterboxd (opcional)",
    user_ph: "tu_usuario",
    use_lb: "Personaliza con mi watchlist",
    skip_lb: "Solo recomiéndame algo",
    next: "Siguiente",
    back: "Atrás",
    skip: "Saltar",
    loading: "Leyendo la onda…",
    loading_lb: "Leyendo tu watchlist… puede tomar unos segundos.",
    picks: "Tus picks",
    no_picks: "No encontré un buen match. Prueba otras combinaciones.",
    restart: "Empezar de nuevo",
    oops: "Algo se rompió",
    retry: "Reintentar",
    err_invalid_user: "Ese usuario no se ve bien.",
    err_empty: "La watchlist está vacía o es privada.",
    err_generic: "Error del servidor. Prueba de nuevo en un momento.",
    where_to_watch: "Dónde verla",
    on_tmdb: "Ver en TMDb",
    support: "Apoya moodwatch",
    footer_made: "Hecho con",
    q_time_t: "¿Cuánto tiempo tienes?",
    q_time_short: "Menos de 95 min",
    q_time_medium: "95–130 min",
    q_time_long: "Más de 130 min",
    q_energy_t: "¿Qué cabeza tienes?",
    q_energy_engage: "Quiero engancharme",
    q_energy_unwind: "Quiero desconectar",
    q_tone_t: "¿Qué tono?",
    q_tone_dark: "Oscuro / pesado",
    q_tone_light: "Liviano / cálido",
    q_company_t: "¿Vas a verla…?",
    q_company_alone: "Solo/a",
    q_company_shared: "Acompañado/a",
    q_risk_t: "¿Algo conocido o nuevo?",
    q_risk_safe: "Algo seguro",
    q_risk_discover: "Sorpréndeme",
  },
};

function detectLang() {
  const raw = (navigator.language || "en").toLowerCase();
  return raw.startsWith("es") ? "es" : "en";
}
const LANG = detectLang();
const T = STRINGS[LANG];
window.LANG = LANG;
window.t = (key) => T[key] ?? STRINGS.en[key] ?? key;

document.documentElement.lang = LANG;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    el.textContent = window.t(k);
  });
  document.querySelectorAll("[data-i18n-attr]").forEach(el => {
    const spec = el.getAttribute("data-i18n-attr");
    spec.split(",").forEach(pair => {
      const [attr, key] = pair.split(":");
      el.setAttribute(attr.trim(), window.t(key.trim()));
    });
  });
});
