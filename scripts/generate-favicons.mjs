// Generates the favicon set from public/isotipo.png.
//
// Google Search requires a square icon whose side is a multiple of 48px, and
// it also probes /favicon.ico. The source mark is 181x183, so every output is
// padded onto a transparent square canvas before resizing.
//
// Usage: node scripts/generate-favicons.mjs
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const SOURCE = path.join(PUBLIC, "isotipo.png");

const PNG_OUTPUTS = [
  ["favicon-96.png", 96],
  ["favicon-192.png", 192],
  ["apple-touch-icon.png", 180],
];

const ICO_SIZE = 48;

function squarePng(size) {
  return sharp(SOURCE)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

// Wraps a single PNG in an ICO container (PNG-in-ICO, supported by every
// modern browser and by Googlebot).
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image size
  entry.writeUInt32LE(header.length + entry.length, 12); // image offset

  return Buffer.concat([header, entry, png]);
}

for (const [file, size] of PNG_OUTPUTS) {
  await writeFile(path.join(PUBLIC, file), await squarePng(size));
  console.log(`wrote public/${file} (${size}x${size})`);
}

await writeFile(path.join(PUBLIC, "favicon.ico"), pngToIco(await squarePng(ICO_SIZE), ICO_SIZE));
console.log(`wrote public/favicon.ico (${ICO_SIZE}x${ICO_SIZE})`);
