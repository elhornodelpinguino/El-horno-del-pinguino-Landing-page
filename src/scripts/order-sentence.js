// The closing section turns "¿Se te antojó?" into the order itself: a
// sentence with three blanks (what, for how many, when) whose WhatsApp link
// sends exactly what the visitor composed. The copy used to ask for those
// three facts in prose and leave the visitor to type them.

const CHEESECAKE = {
  src: "/chesscake-hero.webp",
  alt: "Minitorta de frutos rojos con fresas y arándanos, en su envase",
  width: 1199,
  height: 675,
  position: "42% 62%",
};

export const ORDER_CHOICES = {
  // Each "what" carries the real photo the close shows for it, so the picture
  // never contradicts the order. No mixed shot exists yet, so "mix" keeps the
  // cheesecake.
  what: [
    { value: "minitortas", label: "minitortas", message: "minitortas", photo: CHEESECAKE },
    {
      value: "minidonas",
      label: "minidonas",
      message: "minidonas",
      photo: {
        // A hand holding one small box: the scale of a personal craving,
        // not the wholesale trays.
        src: "/b2b-gallery-individual.webp",
        alt: "Mano sosteniendo una cajita de minidonas decoradas en celeste y blanco",
        width: 1200,
        height: 900,
        position: "38% 50%",
      },
    },
    { value: "mix", label: "un poco de todo", message: "un poco de todo (minitortas y minidonas)", photo: CHEESECAKE },
  ],
  who: [
    { value: "1", label: "solo para mí", message: "solo para mí" },
    { value: "2", label: "para 2", message: "para 2" },
    { value: "4", label: "para 4", message: "para 4" },
    { value: "8", label: "para 8", message: "para 8" },
    { value: "group", label: "para un grupo grande", message: "para un grupo grande" },
  ],
  when: [
    { value: "asap", label: "lo antes posible", message: "lo antes posible" },
    { value: "tomorrow", label: "para mañana", message: "para mañana" },
    { value: "weekend", label: "para el fin de semana", message: "para el fin de semana" },
    { value: "special", label: "para una fecha especial", message: "para una fecha especial" },
  ],
};

/** Default selection, shown before any interaction and in the no-JS link. */
export const DEFAULT_ORDER = { what: "minitortas", who: "4", when: "asap" };

function choice(blank, value) {
  const options = ORDER_CHOICES[blank];
  return options.find((option) => option.value === value) ?? options[0];
}

export function choiceLabel(blank, value) {
  return choice(blank, value).label;
}

/**
 * @param {string} siteName
 * @param {{ what?: string, who?: string, when?: string }} order
 */
export function buildOrderMessage(siteName, order) {
  const what = choice("what", order.what).message;
  const who = choice("who", order.who).message;
  const when = choice("when", order.when).message;
  return `¡Hola, ${siteName}! Se me antojó: quiero ${what} ${who}, ${when}. ¿Qué sabores tienen y cuánto sería?`;
}
