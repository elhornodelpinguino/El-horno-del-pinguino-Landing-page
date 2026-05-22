/**
 * Generate Pixel-Art Penguin Chef Sprite Sheet
 *
 * Creates a 256×64 PNG sprite sheet (4 frames × 64×64) of a penguin chef
 * mixing in a bowl. Uses brand colors: magenta #a81452, cream #fbebde,
 * orange #f49d50, black outline #1a1a1a.
 *
 * Usage: node scripts/generate-penguin-sprite.js
 */

import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

export const PALETTE = {
  "#": [0x1a, 0x1a, 0x1a, 0xff], // ink outline, eyes, feet
  M: [0xa8, 0x14, 0x52, 0xff], // magenta — apron, hat band
  C: [0xfb, 0xeb, 0xde, 0xff], // cream — belly, face
  O: [0xf4, 0x9d, 0x50, 0xff], // orange — beak, feet accents
  W: [0xff, 0xff, 0xff, 0xff], // white — chef hat
};

const EMPTY = "."; // transparent

export const FRAME_SIZE = 64;
export const TOTAL_FRAMES = 4;

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

function createCanvas() {
  return Array.from({ length: FRAME_SIZE }, () =>
    Array.from({ length: FRAME_SIZE }, () => EMPTY),
  );
}

function setPixel(canvas, x, y, char) {
  if (x >= 0 && x < FRAME_SIZE && y >= 0 && y < FRAME_SIZE) {
    canvas[y][x] = char;
  }
}

function fillCircle(canvas, cx, cy, r, char) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        setPixel(canvas, cx + dx, cy + dy, char);
      }
    }
  }
}

function fillEllipse(canvas, cx, cy, rx, ry, char) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
        setPixel(canvas, cx + dx, cy + dy, char);
      }
    }
  }
}

function fillRect(canvas, x1, y1, x2, y2, char) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setPixel(canvas, x, y, char);
    }
  }
}

function fillTriangle(canvas, x1, y1, x2, y2, x3, y3, char) {
  // Barycentric fill for small triangles
  const minX = Math.max(0, Math.min(x1, x2, x3));
  const maxX = Math.min(FRAME_SIZE - 1, Math.max(x1, x2, x3));
  const minY = Math.max(0, Math.min(y1, y2, y3));
  const maxY = Math.min(FRAME_SIZE - 1, Math.max(y1, y2, y3));

  function sign(px1, py1, px2, py2, px3, py3) {
    return (px1 - px3) * (py2 - py3) - (px2 - px3) * (py1 - py3);
  }

  const d1 = sign(x1, y1, x2, y2, x3, y3);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d2 = sign(x, y, x1, y1, x2, y2);
      const d3 = sign(x, y, x2, y2, x3, y3);
      const d4 = sign(x, y, x3, y3, x1, y1);
      const hasNeg = d2 < 0 || d3 < 0 || d4 < 0;
      const hasPos = d2 > 0 || d3 > 0 || d4 > 0;
      if (!(hasNeg && hasPos)) {
        setPixel(canvas, x, y, char);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Penguin character assembly
// ---------------------------------------------------------------------------

/** Draw base penguin (body, head, hat) shared across all frames */
function drawBasePenguin(canvas) {
  // ---- Body (black outer) ----
  fillEllipse(canvas, 32, 36, 15, 18, "#");

  // ---- Belly (cream inner) ----
  fillEllipse(canvas, 32, 38, 11, 14, "C");

  // ---- Head (black) ----
  fillCircle(canvas, 32, 18, 10, "#");

  // ---- Face / cheek area (cream) ----
  fillCircle(canvas, 32, 19, 8, "C");

  // ---- Eyes (black dots) ----
  setPixel(canvas, 28, 16, "#");
  setPixel(canvas, 29, 16, "#");
  setPixel(canvas, 35, 16, "#");
  setPixel(canvas, 36, 16, "#");
  // Eye white highlights
  setPixel(canvas, 28, 15, "W");
  setPixel(canvas, 35, 15, "W");

  // ---- Beak (orange triangle) ----
  fillTriangle(canvas, 30, 20, 34, 20, 32, 24, "O");

  // ---- Chef hat (white puffy) ----
  // Main hat puff
  fillCircle(canvas, 32, 8, 9, "W");
  // Hat puff details (extra roundness)
  fillCircle(canvas, 26, 9, 6, "W");
  fillCircle(canvas, 38, 9, 6, "W");
  // Hat base / band
  fillRect(canvas, 24, 12, 40, 14, "M");

  // ---- Feet (orange) ----
  fillEllipse(canvas, 24, 50, 5, 3, "O");
  fillEllipse(canvas, 40, 50, 5, 3, "O");
  // Feet outline accents
  setPixel(canvas, 21, 49, "#");
  setPixel(canvas, 43, 49, "#");
}

// ---------------------------------------------------------------------------
// Frame-specific elements
// ---------------------------------------------------------------------------

/**
 * Draw the apron
 */
function drawApron(canvas) {
  // Apron bib (magenta)
  fillRect(canvas, 25, 28, 39, 44, "M");
  // Apron outline (black)
  fillRect(canvas, 24, 28, 24, 44, "#");
  fillRect(canvas, 40, 28, 40, 44, "#");
  // Apron neck strap
  setPixel(canvas, 26, 26, "#");
  setPixel(canvas, 38, 26, "#");
  setPixel(canvas, 30, 27, "M");
  setPixel(canvas, 34, 27, "M");
}

/**
 * Draw the mixing bowl
 * @param {number} cx - center x
 * @param {number} cy - center y
 */
function drawBowl(canvas, cx, cy) {
  // Bowl body (cream-colored bowl)
  fillEllipse(canvas, cx, cy + 2, 9, 5, "C");
  // Bowl rim (black outline)
  fillRect(canvas, cx - 9, cy - 1, cx + 9, cy, "#");
  // Bowl outline
  setPixel(canvas, cx - 10, cy, "#");
  setPixel(canvas, cx - 10, cy + 1, "#");
  setPixel(canvas, cx + 10, cy, "#");
  setPixel(canvas, cx + 10, cy + 1, "#");
  // Bowl content (orange/magenta - mixing batter)
  setPixel(canvas, cx - 3, cy + 1, "O");
  setPixel(canvas, cx, cy + 1, "M");
  setPixel(canvas, cx + 3, cy + 1, "O");
}

/**
 * Draw left wing (behind body)
 */
function drawLeftWing(canvas, offsetY = 0) {
  const baseY = 32 + offsetY;
  fillEllipse(canvas, 14, baseY, 5, 9, "#");
  // Wing inner highlight
  setPixel(canvas, 14, baseY - 3, "C");
  setPixel(canvas, 14, baseY, "C");
}

/**
 * Draw right wing (over body, mixing)
 */
function drawRightWing(canvas, angle, cx, cy) {
  // angle: 0 = at bowl, -1 = up, 1 = down
  const wx = cx + 12;
  const wy = cy + angle * 3;
  // Wing / arm reaching to bowl
  fillCircle(canvas, wx, wy, 4, "#");
  // Wing tip / flipper
  fillCircle(canvas, wx + 2, wy + 1, 2, "#");
  // Accent
  setPixel(canvas, wx, wy, "C");
}

/**
 * Draw a small mixing spoon/stick
 */
function drawSpoon(canvas, cx, cy, angle) {
  // Spoon handle
  const tipX = cx - 3 + angle * 2;
  const tipY = cy - 6;
  setPixel(canvas, cx + 4, cy - 2, "#");
  setPixel(canvas, cx + 3, cy - 3, "#");
  // Spoon head
  fillCircle(canvas, tipX, tipY, 2, "W");
  setPixel(canvas, tipX, tipY - 1, "#");
}

// ---------------------------------------------------------------------------
// Frame builders
// ---------------------------------------------------------------------------

function buildFrame1() {
  const c = createCanvas();
  drawBasePenguin(c);
  drawApron(c);

  // Left wing (static)
  drawLeftWing(c);

  // Bowl at chest level
  drawBowl(c, 32, 38);

  // Right wing holding spoon at bowl
  drawRightWing(c, 0, 32, 38);
  drawSpoon(c, 38, 36, 1);

  return c;
}

function buildFrame2() {
  const c = createCanvas();
  drawBasePenguin(c);
  drawApron(c);

  // Left wing (static)
  drawLeftWing(c);

  // Bowl slightly lowered
  drawBowl(c, 32, 40);

  // Right wing stirring down
  drawRightWing(c, 2, 32, 40);
  drawSpoon(c, 40, 40, 3);

  return c;
}

function buildFrame3() {
  const c = createCanvas();
  drawBasePenguin(c);
  drawApron(c);

  // Left wing (static)
  drawLeftWing(c);

  // Bowl back up
  drawBowl(c, 32, 38);

  // Right wing stirring up
  drawRightWing(c, -1, 32, 36);
  drawSpoon(c, 36, 32, -2);

  return c;
}

function buildFrame4() {
  // Return transitional frame (similar to frame 1 but slightly different pose)
  const c = createCanvas();
  drawBasePenguin(c);
  drawApron(c);

  drawLeftWing(c, 1);

  drawBowl(c, 32, 39);

  drawRightWing(c, 1, 32, 37);
  drawSpoon(c, 37, 34, -1);

  return c;
}

// ---------------------------------------------------------------------------
// Frame data (exported for testing)
// ---------------------------------------------------------------------------

export const FRAMES = [buildFrame1(), buildFrame2(), buildFrame3(), buildFrame4()];

// ---------------------------------------------------------------------------
// Compositing
// ---------------------------------------------------------------------------

/**
 * Convert a 2D character grid to RGBA buffer
 * @param {string[][]} frames - array of frames (each is FRAME_SIZE × FRAME_SIZE chars)
 * @returns {{ data: ArrayBuffer, width: number, height: number }}
 */
export function compositeSprite(frames) {
  const totalWidth = FRAME_SIZE * frames.length;
  const totalHeight = FRAME_SIZE;
  const buf = new ArrayBuffer(totalWidth * totalHeight * 4);
  const rgba = new Uint8ClampedArray(buf);

  for (let fi = 0; fi < frames.length; fi++) {
    const frame = frames[fi];
    for (let y = 0; y < FRAME_SIZE; y++) {
      for (let x = 0; x < FRAME_SIZE; x++) {
        const char = frame[y][x];
        const palette = PALETTE[char];
        const targetX = fi * FRAME_SIZE + x;
        const idx = (y * totalWidth + targetX) * 4;
        if (palette) {
          rgba[idx] = palette[0];
          rgba[idx + 1] = palette[1];
          rgba[idx + 2] = palette[2];
          rgba[idx + 3] = palette[3];
        } else {
          rgba[idx] = 0;
          rgba[idx + 1] = 0;
          rgba[idx + 2] = 0;
          rgba[idx + 3] = 0; // transparent
        }
      }
    }
  }

  return { data: buf, width: totalWidth, height: totalHeight };
}

// ---------------------------------------------------------------------------
// Main — CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  const { data, width, height } = compositeSprite(FRAMES);
  const pngBuffer = await sharp(Buffer.from(data), {
    raw: { width, height, channels: 4 },
  })
    .png({ palette: true, colors: 6 })
    .toBuffer();

  writeFileSync("public/penguin-sprite.png", pngBuffer);
  console.log(`✅ Generated public/penguin-sprite.png (${width}×${height})`);
  console.log(`   PNG size: ${(pngBuffer.length / 1024).toFixed(1)} KB`);
}

// Run when executed directly (not imported)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((err) => {
    console.error("❌ Failed to generate sprite:", err);
    process.exit(1);
  });
}
