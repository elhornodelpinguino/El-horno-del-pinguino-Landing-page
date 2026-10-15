// Derives the web-sized assets from the originals in public/.
//
//   - flavour-<name>-sm.webp  640px-wide copy of each flavour photo. The card
//     is at most 320 CSS px wide, so the 738/1200px originals were 2-4x too big
//     for most phones. The originals stay as the larger srcset candidate.
//   - penguin-*.webp  WebP twin of each decorative penguin PNG (sprites excluded; alpha
//     kept). Flat-colour art compresses better lossless, shaded art better
//     lossy, so each file keeps whichever encoding is smaller.
//
// Usage: node scripts/optimize-images.mjs
import sharp from "sharp";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");
const files = await readdir(publicDir);

const flavours = files.filter((f) => /^flavour-[a-z-]+\.webp$/.test(f) && !f.endsWith("-sm.webp"));
for (const file of flavours) {
  const out = file.replace(/\.webp$/, "-sm.webp");
  await sharp(path.join(publicDir, file))
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(path.join(publicDir, out));
  console.log(`${file} -> ${out}`);
}

const penguins = files.filter((f) => /^penguin-(?!.*sprite).*\.png$/.test(f));
for (const file of penguins) {
  const out = file.replace(/\.png$/, ".webp");
  const source = path.join(publicDir, file);
  const lossy = await sharp(source).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer();
  const lossless = await sharp(source).webp({ lossless: true, effort: 6 }).toBuffer();
  await writeFile(path.join(publicDir, out), lossless.length < lossy.length ? lossless : lossy);
  console.log(`${file} -> ${out}`);
}
