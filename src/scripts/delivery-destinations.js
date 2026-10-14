// Places the final-CTA penguin delivers to. The sprites are drawn in the
// penguin's own style (thick outline, its palette, a kawaii face) by
// scripts/generate-destinations.py, in two states: asleep (lights off, eyes
// closed) and awake (lights on, eyes open), swapped when the order arrives.

const SPRITE_SIZE = 96;

export const DESTINATIONS = [
  { slug: "casa", chip: "¡Entregado en casa!" },
  { slug: "club", chip: "¡Entregado en el club!" },
  { slug: "escuela", chip: "¡Entregado en la escuela!" },
  { slug: "oficina", chip: "¡Entregado en la oficina!" },
].map((destination) => ({
  ...destination,
  src: `/destinations/${destination.slug}.png`,
  litSrc: `/destinations/${destination.slug}-lit.png`,
}));

/** Both states stacked; CSS shows one or the other via `.is-lit`. */
export function buildingMarkup(destination) {
  const img = (state, src) =>
    `<img class="dest-building dest-${state}" src="${src}" alt="" aria-hidden="true" ` +
    `width="${SPRITE_SIZE}" height="${SPRITE_SIZE}" decoding="async" />`;
  return img("asleep", destination.src) + img("awake", destination.litSrc);
}

/** Fraction (0..1) along `path` whose point is closest to `target`. */
export function fractionNear(path, target, samples = 400) {
  const length = path.getTotalLength();
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i <= samples; i += 1) {
    const point = path.getPointAtLength((i / samples) * length);
    const distance = (point.x - target.x) ** 2 + (point.y - target.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i / samples;
    }
  }
  return best;
}
