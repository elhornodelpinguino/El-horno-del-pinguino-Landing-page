/**
 * Generate section-specific pixel-art penguin sprite sheets.
 *
 * Outputs 5 transparent PNG sprite sheets, each 256×64 (4 frames × 64×64):
 * - public/penguin-phone-sprite.png
 * - public/penguin-baking-sprite.png
 * - public/penguin-delivery-sprite.png
 * - public/penguin-trust-sprite.png
 * - public/penguin-faq-sprite.png
 */

import sharp from "sharp";
import { writeFileSync } from "fs";

const FRAME = 64;
const FRAMES = 4;
const EMPTY = ".";

const PALETTE = {
  K: [0x0b, 0x10, 0x1e, 0xff], // black/navy outline
  N: [0x1d, 0x2b, 0x48, 0xff], // penguin dark blue
  C: [0xff, 0xfa, 0xf2, 0xff], // warm white belly
  W: [0xff, 0xff, 0xff, 0xff], // white hat/highlight
  S: [0xa4, 0xbb, 0xd8, 0xff], // cool white shadow
  M: [0xa8, 0x14, 0x52, 0xff], // brand magenta
  m: [0x70, 0x08, 0x36, 0xff], // magenta shadow
  O: [0xf6, 0x91, 0x12, 0xff], // orange beak/feet
  o: [0xc8, 0x5c, 0x08, 0xff], // orange shadow
  B: [0xb4, 0x68, 0x24, 0xff], // wood/bread
  b: [0x76, 0x38, 0x16, 0xff], // brown outline
  G: [0x25, 0xd3, 0x66, 0xff], // WhatsApp green
  g: [0x12, 0x8c, 0x7e, 0xff], // green shadow
  R: [0xef, 0x44, 0x44, 0xff], // red heat/check detail
  Y: [0xff, 0xd1, 0x66, 0xff], // warm yellow
  L: [0xd8, 0xde, 0xe8, 0xff], // light gray
  D: [0x6b, 0x72, 0x80, 0xff], // dark gray
};

function canvas() {
  return Array.from({ length: FRAME }, () => Array.from({ length: FRAME }, () => EMPTY));
}

function px(c, x, y, ch) {
  if (x >= 0 && x < FRAME && y >= 0 && y < FRAME) c[y][x] = ch;
}

function rect(c, x1, y1, x2, y2, ch) {
  for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) px(c, x, y, ch);
}

function ellipse(c, cx, cy, rx, ry, ch) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(c, x, y, ch);
    }
  }
}

function circle(c, cx, cy, r, ch) {
  ellipse(c, cx, cy, r, r, ch);
}

function line(c, x1, y1, x2, y2, ch) {
  const dx = Math.abs(x2 - x1);
  const dy = -Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx + dy;
  let x = x1;
  let y = y1;
  while (true) {
    px(c, x, y, ch);
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function tri(c, x1, y1, x2, y2, x3, y3, ch) {
  const minX = Math.max(0, Math.min(x1, x2, x3));
  const maxX = Math.min(FRAME - 1, Math.max(x1, x2, x3));
  const minY = Math.max(0, Math.min(y1, y2, y3));
  const maxY = Math.min(FRAME - 1, Math.max(y1, y2, y3));
  const sign = (px1, py1, px2, py2, px3, py3) => (px1 - px3) * (py2 - py3) - (px2 - px3) * (py1 - py3);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const d1 = sign(x, y, x1, y1, x2, y2);
    const d2 = sign(x, y, x2, y2, x3, y3);
    const d3 = sign(x, y, x3, y3, x1, y1);
    if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) px(c, x, y, ch);
  }
}

function drawChefHat(c, x, y) {
  circle(c, x, y - 30, 7, "W");
  circle(c, x - 6, y - 29, 5, "W");
  circle(c, x + 6, y - 29, 5, "W");
  rect(c, x - 10, y - 25, x + 10, y - 22, "W");
  rect(c, x - 9, y - 22, x + 9, y - 21, "S");
  px(c, x - 8, y - 33, "S");
  px(c, x + 7, y - 32, "S");
}

function drawPenguin(c, x, y, opts = {}) {
  const bob = opts.bob ?? 0;
  const blink = opts.blink ?? false;
  const wing = opts.wing ?? 0;
  y += bob;

  // feet behind body
  ellipse(c, x - 8, y + 18, 5, 3, "O"); ellipse(c, x + 8, y + 18, 5, 3, "O");
  px(c, x - 12, y + 18, "o"); px(c, x + 12, y + 18, "o");

  // body/head
  ellipse(c, x, y + 3, 16, 18, "K");
  ellipse(c, x, y + 4, 13, 15, "N");
  ellipse(c, x, y + 7, 10, 12, "C");
  circle(c, x, y - 16, 12, "K");
  circle(c, x, y - 15, 9, "C");

  // apron
  rect(c, x - 8, y + 3, x + 8, y + 16, "M");
  rect(c, x - 8, y + 14, x + 8, y + 16, "m");
  rect(c, x - 4, y + 10, x + 4, y + 14, "m");

  // wings
  ellipse(c, x - 15, y + wing, 5, 9, "K");
  ellipse(c, x + 15, y - wing, 5, 9, "K");

  // face
  if (blink) {
    rect(c, x - 6, y - 18, x - 3, y - 18, "K");
    rect(c, x + 3, y - 18, x + 6, y - 18, "K");
  } else {
    rect(c, x - 6, y - 19, x - 4, y - 17, "K");
    rect(c, x + 4, y - 19, x + 6, y - 17, "K");
    px(c, x - 6, y - 19, "W"); px(c, x + 4, y - 19, "W");
  }
  tri(c, x - 3, y - 14, x + 3, y - 14, x, y - 10, "O");
  px(c, x - 9, y - 13, "M"); px(c, x + 9, y - 13, "M");

  drawChefHat(c, x, y);
}

function phone(c, x, y, on = true) {
  rect(c, x, y, x + 9, y + 15, "K");
  rect(c, x + 2, y + 2, x + 7, y + 12, on ? "G" : "L");
  px(c, x + 4, y + 14, "L");
  if (on) { rect(c, x + 3, y + 4, x + 6, y + 4, "W"); rect(c, x + 3, y + 7, x + 6, y + 7, "W"); }
}

function oven(c, x, y, heat = 0) {
  rect(c, x, y, x + 24, y + 20, "K");
  rect(c, x + 2, y + 2, x + 22, y + 18, "L");
  rect(c, x + 4, y + 6, x + 20, y + 15, "D");
  rect(c, x + 7, y + 10, x + 17, y + 13, heat ? "Y" : "O");
  px(c, x + 5, y + 4, "R"); px(c, x + 9, y + 4, "G");
}

function deliveryBox(c, x, y, bounce = 0) {
  y += bounce;
  rect(c, x, y, x + 18, y + 13, "b");
  rect(c, x + 2, y + 2, x + 16, y + 11, "B");
  line(c, x + 2, y + 2, x + 16, y + 11, "Y");
  line(c, x + 16, y + 2, x + 2, y + 11, "Y");
}

function checklist(c, x, y, tick = 0) {
  rect(c, x, y, x + 19, y + 24, "K");
  rect(c, x + 2, y + 2, x + 17, y + 22, "W");
  rect(c, x + 6, y, x + 13, y + 3, "M");
  for (let i = 0; i < 3; i++) {
    const yy = y + 7 + i * 5;
    rect(c, x + 7, yy, x + 14, yy, "D");
    if (tick >= i) { px(c, x + 4, yy, "G"); px(c, x + 5, yy - 1, "G"); px(c, x + 6, yy - 2, "G"); }
  }
}

function drawPhoneFrame(i, variant = "order") {
  const c = canvas();
  drawPenguin(c, 29, 36, { bob: i % 2, wing: i % 2 });
  phone(c, 43, 27 + (i % 2), true);
  if (variant === "faq") {
    rect(c, 5, 14, 20, 24, "W"); rect(c, 6, 15, 19, 23, "C");
    rect(c, 9, 18, 17, 18, "M"); rect(c, 9, 21, 15, 21, "D");
  }
  return c;
}

function drawBakingFrame(i) {
  const c = canvas();
  oven(c, 39, 35, i % 2);
  drawPenguin(c, 24, 36, { bob: i % 2, wing: i % 2 });
  rect(c, 28, 43 + (i % 2), 45, 46 + (i % 2), "b");
  rect(c, 31, 40 + (i % 2), 41, 44 + (i % 2), "B");
  if (i % 2) { px(c, 42, 32, "Y"); px(c, 44, 30, "Y"); }
  return c;
}

function drawDeliveryFrame(i) {
  const c = canvas();
  drawPenguin(c, 29 + (i % 2), 36, { bob: i % 2, wing: i % 2 });
  deliveryBox(c, 42, 34, i % 2);
  // motion pixels
  if (i % 2) { rect(c, 4, 47, 12, 47, "D"); rect(c, 7, 51, 16, 51, "D"); }
  return c;
}

function drawTrustFrame(i) {
  const c = canvas();
  oven(c, 39, 34, i % 2);
  checklist(c, 4, 26, i % 4);
  drawPenguin(c, 27, 37, { bob: i % 2, wing: i % 2 });
  return c;
}

const SHEETS = {
  "penguin-phone-sprite.png": [0,1,2,3].map((i) => drawPhoneFrame(i, "order")),
  "penguin-baking-sprite.png": [0,1,2,3].map(drawBakingFrame),
  "penguin-delivery-sprite.png": [0,1,2,3].map(drawDeliveryFrame),
  "penguin-trust-sprite.png": [0,1,2,3].map(drawTrustFrame),
  "penguin-faq-sprite.png": [0,1,2,3].map((i) => drawPhoneFrame(i, "faq")),
};

function composite(frames) {
  const width = FRAME * FRAMES;
  const height = FRAME;
  const buf = Buffer.alloc(width * height * 4);
  for (let fi = 0; fi < FRAMES; fi++) {
    const frame = frames[fi];
    for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) {
      const idx = (y * width + fi * FRAME + x) * 4;
      const rgba = PALETTE[frame[y][x]];
      if (rgba) buf.set(rgba, idx);
    }
  }
  return { buf, width, height };
}

for (const [name, frames] of Object.entries(SHEETS)) {
  const { buf, width, height } = composite(frames);
  const png = await sharp(buf, { raw: { width, height, channels: 4 } })
    .png({ palette: true, colors: 16 })
    .toBuffer();
  writeFileSync(`public/${name}`, png);
  console.log(`generated public/${name} (${width}×${height})`);
}
