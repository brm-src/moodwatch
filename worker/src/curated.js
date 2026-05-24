// Editorial picks. When a candidate matches one of these by TMDb ID, it gets
// boosted in ranking and the note appears as a small badge on the card.

export const CURATED = [
  // ── OSCURO · REFLEXIVO ───────────────────────────────────────────
  { id: 965150,  note: "Charlotte Wells filma el duelo desde el fondo de una pileta. Te parte sin que lo notes." },
  { id: 666277,  note: "Celine Song convierte lo que pudo ser en la película más adulta sobre el amor no elegido." },
  { id: 152601,  note: "Jonze construyó el retrato de soledad más honesto de los 2010s. Phoenix nunca estuvo mejor." },
  { id: 466420,  note: "Scorsese a máxima potencia: codicia, crimen, y la América que borra lo que no quiere ver." },
  { id: 804095,  note: "El Spielberg más personal. El cine que te salva y destruye tu familia al mismo tiempo." },
  { id: 496243,  note: "Sátira social que termina cortando profundo." },
  { id: 491584,  note: "Misterio lento, vacío emocional y rabia contenida." },
  { id: 1018,    note: "Hollywood convertido en sueño roto." },
  { id: 843,     note: "Deseo, silencio y elegancia pura." },
  { id: 1398,    note: "Ciencia ficción espiritual y contemplativa." },
  { id: 68722,   note: "Drama hipnótico sobre vacío, fe y dependencia." },
  { id: 11423,   note: "Policial oscuro con tristeza histórica." },

  // ── OSCURO · TENSO ───────────────────────────────────────────────
  { id: 146233,  note: "Villeneuve en estado puro: thriller moral donde ninguna respuesta llega limpia." },
  { id: 49797,   note: "Kim Jee-woon llevó el thriller de venganza al límite. Obra maestra incómoda." },
  { id: 1422,    note: "Scorsese hizo el mejor thriller americano de los 2000s. Traición, ritmo, adrenalina pura." },
  { id: 949,     note: "Mann inventó la estética del thriller moderno. De Niro y Pacino en el pináculo del género." },
  { id: 395834,  note: "Western tardío que nadie esperaba. Frío, preciso, brutal." },
  { id: 27205,   note: "El blockbuster más inteligente de su era. Arquitectura de sueños que no envejece." },
  { id: 244786,  note: "Chazelle convirtió la ambición en tensión pura. Fletcher, uno de los villanos más reales del cine." },
  { id: 1949,    note: "Obsesión investigativa sin recompensa limpia." },
  { id: 473033,  note: "Ansiedad pura disfrazada de cine criminal." },
  { id: 242582,  note: "Capitalismo, morbo y vacío humano." },
  { id: 273481,  note: "Tensión seca, frontera y moral rota." },

  // ── OSCURO · DEVASTADOR ──────────────────────────────────────────
  { id: 807,     note: "Fincher preguntó qué hay en la caja. Nadie quiere saber la respuesta." },
  { id: 9539,    note: "Laugier en el extremo absoluto. Más allá del torture porn: hay tesis filosófica adentro." },
  { id: 334541,  note: "Dolor humano sin consuelo fácil." },
  { id: 641,     note: "Adicción filmada como caída libre." },
  { id: 25237,   note: "La guerra como trauma absoluto." },
  { id: 12477,   note: "Animación que destruye sin exagerar." },
  { id: 965150,  note: "Memoria, pérdida y tristeza silenciosa." },
  { id: 670,     note: "Venganza enfermiza con golpe emocional." },
  { id: 6977,    note: "Fatalismo seco, violento y perfecto." },

  // ── LUZ · ACOMPAÑAMIENTO ─────────────────────────────────────────
  { id: 840430,  note: "Vieja escuela en el mejor sentido: personajes, invierno de Nueva Inglaterra y mucha humanidad." },
  { id: 505600,  note: "Buddy comedy que también es algo. Wilde debutó como directora y anotó directo." },
  { id: 122906,  note: "Curtis hace trampas con el tiempo y uno lo acepta. Warm sin ser empalagosa." },
  { id: 587792,  note: "Toma el loop de Groundhog Day y le agrega nihilismo cómico. Sorprendentemente bien ejecutada." },
  { id: 976893,  note: "Calma, rutina y belleza mínima." },
  { id: 370755,  note: "La vida cotidiana como poema tranquilo." },
  { id: 11830,   note: "Comida, humor y ternura japonesa." },
  { id: 331482,  note: "Cálida, sensible y muy humana." },
  { id: 505192,  note: "Familia elegida con ternura y dolor." },
  { id: 194,     note: "Fantasía cálida sin perder melancolía." },

  // ── LUZ · ADRENALINA ─────────────────────────────────────────────
  { id: 353081,  note: "El pico del cine de acción contemporáneo. Cada set-piece es clase magistral." },
  { id: 546554,  note: "Rian Johnson revivió el whodunit con pura inteligencia. Ritmo, humor y nadie muere aburrido." },
  { id: 515001,  note: "Waititi equilibra nazis y ternura sin caer en ningún precipicio." },
  { id: 603,     note: "Acción cyberpunk con ideas grandes." },
  { id: 76341,   note: "Energía visual en estado puro." },
  { id: 85,      note: "Aventura clásica con ritmo perfecto." },
  { id: 155,     note: "Blockbuster tenso, elegante y cerebral." },
  { id: 137113,  note: "Sci-fi de acción ligera y precisa." },
  { id: 361743,  note: "Blockbuster limpio, físico y efectivo." },

  // ── FRÍO · CONTEMPLATIVO ─────────────────────────────────────────
  { id: 329865,  note: "Arrival reencuadra la sci-fi como tragedia lingüística. Villeneuve más preciso." },
  { id: 503919,  note: "Eggers encerró a dos hombres en un faro y filmó la locura como mito griego." },
  { id: 254320,  note: "Lanthimos construyó una distopía del afecto. Extraña, fría y con más verdad de lo que parece." },
  { id: 374720,  note: "Nolan filmó Dunkerque como sensación física. Relato bélico sin héroes individuales." },
  { id: 593,     note: "Recuerdos, duelo y espacio interior." },
  { id: 81401,   note: "Silencio, viento y agotamiento existencial." },
  { id: 414453,  note: "Arquitectura, pausa y melancolía." },
  { id: 30020,   note: "Minimalismo moral y contemplación pura." },

  // ── CÁLIDO · ROMÁNTICO ───────────────────────────────────────────
  { id: 531428,  note: "Romance contenido, elegante y devastador." },
  { id: 76,      note: "Enamorarse conversando, sin artificio." },
  { id: 80,      note: "Romance adulto con tiempo encima." },
  { id: 666277,  note: "Amor posible, distancia y madurez." },
  { id: 38,      note: "Romance roto con imaginación emocional." },
  { id: 284,     note: "Romance clásico con tristeza adulta." },

  // ── RARO · DISCOVER ──────────────────────────────────────────────
  { id: 513434,  note: "Una película de zombies dentro de otra. Ueda es un genio caótico." },
  { id: 220289,  note: "$50k en una noche. Física cuántica como paranoia doméstica perfecta." },
  { id: 431,     note: "Kafkiana, matemática y aterradora. Precursora del cine de escape room." },
  { id: 985,     note: "Pesadilla industrial sin explicación segura." },
  { id: 8327,    note: "Misticismo, exceso y locura visual." },
  { id: 662,     note: "Sci-fi mínima, experimental y eterna." },
  { id: 21484,   note: "Ruptura amorosa como posesión demoníaca." },
  { id: 25623,   note: "Terror pop japonés totalmente desquiciado." },
  { id: 97370,   note: "Alienación fría, sexual y extraña." },
  { id: 492,     note: "Comedia absurda con crisis de identidad." },

  // ── ACCIÓN RETRO ─────────────────────────────────────────────────
  { id: 1103,    note: "Carpenter, synth y nihilismo ochentero." },
  { id: 106,     note: "Acción muscular con instinto de horror." },
  { id: 562,     note: "La plantilla perfecta del action moderno." },
  { id: 5548,    note: "Violencia, sátira y metal ochentero." },
  { id: 218,     note: "Sci-fi sucia, nocturna e implacable." },
  { id: 679,     note: "Acción, terror y músculo narrativo." },
  { id: 6978,    note: "Aventura absurda con energía de culto." },

  // ── TERROR ATMOSFÉRICO ───────────────────────────────────────────
  { id: 493922,  note: "Ari Aster redefinió el horror familiar. Te deja sin herramientas para procesar lo que viste." },
  { id: 310131,  note: "Eggers construyó el miedo de adentro hacia afuera. Folk horror en estado puro." },
  { id: 530385,  note: "Horror diurno en flores amarillas. Lo más perturbador es que el culto tiene lógica interna." },
  { id: 293670,  note: "Folklore coreano, exorcismo y paranoia. Absolutamente impredecible." },
  { id: 27374,   note: "La película de terror más melancólica que existe. Documental falso. Duelo como horror." },
  { id: 575776,  note: "Powell filmó la fe como posesión. Horror que nace de la devoción." },
  { id: 503919,  note: "Locura marítima en blanco y negro." },
  { id: 694,     note: "Aislamiento, arquitectura y terror psicológico." },
  { id: 805,     note: "Paranoia doméstica con elegancia diabólica." },
  { id: 36095,   note: "Hipnosis, crimen y miedo invisible." },

  // ── COMEDIA CON ALMA ─────────────────────────────────────────────
  { id: 275,     note: "Humor negro con alma congelada." },
  { id: 120467,  note: "Comedia elegante con melancolía escondida." },
  { id: 121986,  note: "Caótica, honesta y dolorosamente humana." },
  { id: 773,     note: "Indie familiar con corazón genuino." },
  { id: 115,     note: "Absurdo, relajo y filosofía accidental." },
  { id: 8051,    note: "Comedia romántica nerviosa y preciosa." },
  { id: 86829,   note: "Fracaso artístico con humor seco." },

  // ── ANIMACIÓN ADULTA ─────────────────────────────────────────────
  { id: 324857,  note: "Reinventó la animación y el superhéroe en un solo golpe. Estilo, ritmo, corazón." },
  { id: 569094,  note: "Supera al original. La secuencia del Spider-Man 2099 sola vale todo el cine de 2023." },
  { id: 10494,   note: "Identidad, fama y paranoia digital." },
  { id: 9323,    note: "Cyberpunk filosófico y existencial." },
  { id: 128,     note: "Épica ecológica, violenta y madura." },
  { id: 129,     note: "Fantasía total con peso emocional." },
  { id: 149,     note: "Caos urbano, cuerpo y poder." },
  { id: 378064,  note: "Culpa, bullying y redención sensible." },
  { id: 10315,   note: "Wes Anderson en stop motion perfecto." },

  // ── DOCUMENTAL ───────────────────────────────────────────────────
  { id: 682110,  note: "Un hombre aprende de un pulpo durante un año. Suena tonto. Te cambia algo por dentro." },
  { id: 123678,  note: "La realidad más perturbadora que la ficción." },
  { id: 128216,  note: "Memoria familiar y verdad inestable." },
  { id: 501,     note: "Herzog mirando obsesión y naturaleza." },
  { id: 42044,   note: "Monumental, duro e imposible de olvidar." },
  { id: 14275,   note: "Sueños, clase y deporte sin maquillaje." },
  { id: 30017,   note: "Documental, ficción e identidad mezcladas." },
  { id: 26317,   note: "Cine mirando al cine desde el origen." },

  // ── JOYA INVISIBLE ───────────────────────────────────────────────

  { id: 565743,  note: "Sci-fi retro pequeña y elegante." },
  { id: 453278,  note: "Drama íntimo, físico y silencioso." },
  { id: 428449,  note: "Duelo, tiempo y minimalismo fantasma." },
  { id: 585378,  note: "Sci-fi íntima sobre memoria y familia." },

  // ── CLÁSICO VIVO ─────────────────────────────────────────────────
  { id: 9552,    note: "Friedkin filmó el mal como posibilidad real. Sigue siendo la más perturbadora 50 años después." },
  { id: 207,     note: "Dead Poets Society todavía duele. Weir y Williams en estado de gracia pura." },
  { id: 655,     note: "Distancia, culpa y belleza americana." },
  { id: 797,     note: "Identidad quebrada en blanco y negro." },
  { id: 346,     note: "Kurosawa todavía se siente vivo." },
  { id: 18148,   note: "Familia, tiempo y tristeza contenida." },
  { id: 62,      note: "Sci-fi monumental y todavía moderna." },
  { id: 780,     note: "Rostros, fe y cine puro." },
  { id: 147,     note: "Juventud, libertad y tristeza clásica." },
];

export const CURATED_GROUPS = {
  "oscuro-reflexivo": [965150, 666277, 152601, 466420, 804095, 496243, 491584, 1018, 843, 1398, 68722, 11423],
  "oscuro-tenso": [146233, 49797, 1422, 949, 395834, 27205, 244786, 1949, 473033, 242582, 273481],
  "oscuro-devastador": [807, 9539, 334541, 641, 25237, 12477, 965150, 670, 6977],
  "luz-acompanamiento": [840430, 505600, 122906, 587792, 976893, 370755, 11830, 331482, 505192, 194],
  "luz-adrenalina": [353081, 546554, 515001, 603, 76341, 85, 155, 137113, 361743],
  "frio-contemplativo": [329865, 503919, 254320, 374720, 593, 81401, 414453, 30020],
  "calido-romantico": [531428, 76, 80, 666277, 38, 284],
  "raro-discover": [513434, 220289, 431, 985, 8327, 662, 21484, 25623, 97370, 492],
  "accion-retro": [1103, 106, 562, 5548, 218, 679, 6978],
  "terror-atmosferico": [493922, 310131, 530385, 293670, 27374, 575776, 503919, 694, 805, 36095],
  "comedia-con-alma": [275, 120467, 121986, 773, 115, 8051, 86829],
  "animacion-adulta": [324857, 569094, 10494, 9323, 128, 129, 149, 378064, 10315],
  "documental": [682110, 123678, 128216, 501, 42044, 14275, 30017, 26317],
  "joya-invisible": [565743, 453278, 428449, 585378],
  "clasico-vivo": [9552, 207, 655, 797, 346, 18148, 62, 780, 147],
};

const _byId = new Map(CURATED.map(c => [c.id, c]));
export function curatedFor(tmdbId) {
  return _byId.get(tmdbId) || null;
}
