/**
 * Verify section-specific penguin sprite sheets.
 * Checks the same invariants requested for the original chef sprite process:
 * - PNG has alpha/transparent corners
 * - Full sheet is 256×64
 * - 4 horizontal frames, each 64×64
 * - Frame 4 has no distracting detached sparkles/stars
 */

import sharp from "sharp";

const TARGETS = [
  "public/penguin-phone-sprite.png",
  "public/penguin-baking-sprite.png",
  "public/penguin-delivery-sprite.png",
  "public/penguin-trust-sprite.png",
  "public/penguin-faq-sprite.png",
];

const WIDTH = 256;
const HEIGHT = 64;
const FRAME_WIDTH = 64;
const FRAME_COUNT = 4;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function alphaAt(data, width, x, y) {
  return data[(y * width + x) * 4 + 3];
}

function countTinyDetachedComponents(data, width) {
  const x0 = FRAME_WIDTH * 3;
  const seen = new Set();
  let tiny = 0;

  function key(x, y) { return `${x},${y}`; }

  for (let y = 0; y < HEIGHT; y++) {
    for (let lx = 0; lx < FRAME_WIDTH; lx++) {
      const x = x0 + lx;
      if (alphaAt(data, width, x, y) === 0 || seen.has(key(lx, y))) continue;

      const stack = [[lx, y]];
      seen.add(key(lx, y));
      let area = 0;

      while (stack.length) {
        const [cx, cy] = stack.pop();
        area++;
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (nx < 0 || nx >= FRAME_WIDTH || ny < 0 || ny >= HEIGHT) continue;
          const k = key(nx, ny);
          if (seen.has(k)) continue;
          if (alphaAt(data, width, x0 + nx, ny) === 0) continue;
          seen.add(k);
          stack.push([nx, ny]);
        }
      }

      // Sparkle artifacts are usually 1–3 pixel islands. Legit props like phones,
      // boxes, ovens, trays and checklist sheets are much larger.
      if (area <= 3) tiny++;
    }
  }

  return tiny;
}

for (const file of TARGETS) {
  const image = sharp(file).ensureAlpha();
  const meta = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  assert(meta.width === WIDTH, `${file}: expected width ${WIDTH}, got ${meta.width}`);
  assert(meta.height === HEIGHT, `${file}: expected height ${HEIGHT}, got ${meta.height}`);
  assert(WIDTH / FRAME_COUNT === FRAME_WIDTH, `${file}: frame width mismatch`);
  assert(info.channels === 4, `${file}: expected RGBA, got ${info.channels} channels`);

  const cornerAlphas = [
    alphaAt(data, WIDTH, 0, 0),
    alphaAt(data, WIDTH, WIDTH - 1, 0),
    alphaAt(data, WIDTH, 0, HEIGHT - 1),
    alphaAt(data, WIDTH, WIDTH - 1, HEIGHT - 1),
  ];
  assert(cornerAlphas.every((a) => a === 0), `${file}: corners are not transparent: ${cornerAlphas.join(",")}`);

  for (let frame = 0; frame < FRAME_COUNT; frame++) {
    let opaque = 0;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = frame * FRAME_WIDTH; x < (frame + 1) * FRAME_WIDTH; x++) {
        if (alphaAt(data, WIDTH, x, y) > 0) opaque++;
      }
    }
    assert(opaque > 250, `${file}: frame ${frame + 1} looks empty (${opaque} opaque pixels)`);
  }

  const tinyDetached = countTinyDetachedComponents(data, WIDTH);
  assert(tinyDetached === 0, `${file}: frame 4 may contain tiny sparkle artifacts (${tinyDetached} tiny components)`);

  console.log(`✓ ${file}: ${WIDTH}×${HEIGHT}, 4 frames of 64×64, transparent RGBA, frame 4 clean`);
}
