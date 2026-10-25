/* Catálogo de agujeros negros reales.
   Cada modelo fija la masa y una puesta en escena (color, inclinación, velocidad, brillo, chorros, ángulo de cámara).
   Las masas y distancias son estimaciones publicadas; la puesta en escena es artística. */
(function (BH) {
  'use strict';

  BH.MODELS = [
    {
      id: 'estelar',
      name: 'Estelar',
      kind: 'Agujero negro estelar (modelo genérico)',
      M: 10,
      distance: 'Hay millones en la Vía Láctea',
      color: '#ff8a3a', tilt: 8, speed: 1.0, bright: 1.0, jets: false, phi: 1.4,
      desc: 'Es lo que queda cuando una estrella muy masiva agota su combustible y su núcleo colapsa. Con diez veces la masa del Sol, su horizonte mide menos que una ciudad.',
      fact: 'Una masa 10 veces la del Sol comprimida en un radio de unos 30 km.'
    },
    {
      id: 'cygx1',
      name: 'Cygnus X-1',
      kind: 'Binaria de rayos X · agujero negro estelar',
      M: 21.2,
      distance: '≈ 7 300 años luz',
      color: '#8ec5ff', tilt: 27, speed: 1.7, bright: 1.15, jets: true, phi: 1.05,
      desc: 'Fuente de rayos X detectada en 1964 y uno de los primeros candidatos sólidos a agujero negro. Le arranca gas a una supergigante azul, HDE 226868, que lo orbita cada 5,6 días.',
      fact: 'Medidas de 2021 elevaron su masa a unas 21 veces la del Sol.'
    },
    {
      id: 'sgra',
      name: 'Sagitario A*',
      kind: 'Agujero negro supermasivo · centro de la Vía Láctea',
      M: 4.3e6,
      distance: '≈ 27 000 años luz',
      color: '#ff8a3a', tilt: 10, speed: 1.0, bright: 0.8, jets: false, phi: 1.25,
      desc: 'Ocupa el centro de nuestra galaxia. Es tranquilo: devora muy poco gas, así que su disco brilla poco. El Event Horizon Telescope publicó su imagen en 2022.',
      fact: 'Su horizonte cabe dentro de la órbita de Mercurio.'
    },
    {
      id: 'm87',
      name: 'M87*',
      kind: 'Agujero negro supermasivo · galaxia M87',
      M: 6.5e9,
      distance: '≈ 55 millones de años luz',
      color: '#ffb347', tilt: 18, speed: 0.7, bright: 1.1, jets: true, phi: 0.65,
      desc: 'Fue el primer agujero negro fotografiado, en 2019. Lanza un chorro de plasma de miles de años luz y lo vemos casi de frente.',
      fact: 'Su horizonte es unas 4 veces mayor que la órbita de Neptuno.'
    },
    {
      id: 'ngc4889',
      name: 'NGC 4889',
      kind: 'Agujero negro supermasivo · cúmulo de Coma',
      M: 2.1e10,
      distance: '≈ 300 millones de años luz',
      color: '#a77bff', tilt: 12, speed: 0.6, bright: 0.9, jets: false, phi: 1.3,
      desc: 'Vive en una galaxia elíptica gigante del cúmulo de Coma. Su masa se midió por el movimiento de las estrellas que lo rodean, con una incertidumbre grande: entre 6 000 y 37 000 millones de soles.',
      fact: 'Está casi dormido y brilla muy poco para su masa.'
    },
    {
      id: 'ton618',
      name: 'TON 618',
      kind: 'Cuásar hiperluminoso',
      M: 6.6e10,
      distance: '≈ 10 800 millones de años luz',
      color: '#cfe3ff', tilt: 14, speed: 1.3, bright: 1.5, jets: true, phi: 1.3,
      desc: 'Un cuásar tan lejano que lo vemos como era cuando el universo tenía unos 3 000 millones de años. Las estimaciones de su masa van de unos 41 000 a 66 000 millones de soles.',
      fact: 'Su luminosidad, unos 4 × 10⁴⁰ W, equivale a unos 140 billones de soles.'
    },
    {
      id: 'phoenixa',
      name: 'Phoenix A',
      kind: 'Candidato a agujero negro ultramasivo',
      M: 1e11,
      distance: '≈ 5 900 millones de años luz',
      color: '#ff4fa3', tilt: 9, speed: 0.5, bright: 1.2, jets: false, phi: 1.35,
      desc: 'Galaxia central del cúmulo de Phoenix, el cúmulo más luminoso en rayos X que se conoce. La masa de su agujero negro, del orden de 100 000 millones de soles, es una estimación indirecta y sin barras de error.',
      fact: 'Si la cifra se confirma, sería uno de los mayores que se conocen.'
    }
  ];

  /** Paletas rápidas para el disco. */
  BH.PALETTES = [
    {name: 'Brasa', color: '#ff8a3a'},
    {name: 'Plasma', color: '#4aa3ff'},
    {name: 'Violeta', color: '#a77bff'},
    {name: 'Magenta', color: '#ff4fa3'},
    {name: 'Esmeralda', color: '#3be0a0'},
    {name: 'Blanco', color: '#f4f1ea'}
  ];
})(window.BH = window.BH || {});
