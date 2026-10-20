import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";
import { describe, it, expect } from "vitest";

import { BUSINESS_STEP_EVIDENCE, BUSINESS_GALLERY, BUSINESS_PRODUCTS } from "~/lib/business-media";
import { BUSINESS_SEGMENTS } from "~/lib/business-segments";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const widthOf = async (publicPath: string) => (await sharp(path.join(root, "public", publicPath)).metadata()).width;

describe("decorative penguins", () => {
  const css = read("src/styles/global.css");
  const penguins = [...css.matchAll(/url\("(\/penguin-[a-z-]+\.[a-z]+)"\)/g)]
    .map((m) => m[1])
    .filter((url) => !url.includes("sprite"));

  it("are referenced as webp that exists (the PNGs were 4-5x heavier)", () => {
    expect(penguins.length).toBeGreaterThan(0);
    for (const url of penguins) {
      expect(url, url).toMatch(/\.webp$/);
      expect(existsSync(path.join(root, "public", url)), url).toBe(true);
    }
  });

  it("the 404 art uses the webp too", () => {
    expect(read("src/pages/404.astro")).toMatch(/src="\/penguin-chef-oven-transparent\.webp"/);
  });

  it("keeps the alpha channel", async () => {
    const meta = await sharp(path.join(root, "public/penguin-chef-question-bubble.webp")).metadata();
    expect(meta.hasAlpha).toBe(true);
  });
});

describe("flavour photos", () => {
  const showcase = read("src/components/FlavourShowcase.astro");

  it("offer a resized variant per photo, declared with its true width", async () => {
    const entries = [...showcase.matchAll(/image: "(\/flavour-[a-z-]+)\.webp"/g)].map((m) => m[1]);
    expect(entries).toHaveLength(3);
    for (const base of entries) {
      const small = await widthOf(`${base}-sm.webp`);
      const full = await widthOf(`${base}.webp`);
      expect(small, base).toBe(640);
      expect(small).toBeLessThan(full!);
      expect(showcase, base).toContain(`srcset: "${base}-sm.webp 640w, ${base}.webp ${full}w"`);
    }
    expect(showcase).toMatch(/srcset=\{item\.srcset\}/);
    expect(showcase).toMatch(/sizes="[^"]*320px[^"]*"/);
  });

  it("keeps the original as src so non-srcset consumers still work", () => {
    expect(showcase).toMatch(/src=\{item\.image\}/);
  });
});

describe("business photo sizes", () => {
  const all = [
    ...BUSINESS_STEP_EVIDENCE,
    ...BUSINESS_GALLERY,
    ...BUSINESS_PRODUCTS,
    ...BUSINESS_SEGMENTS.map((s) => s.media),
  ];

  // The page keeps 20px of gutter on each side below 640px, so `100vw`
  // over-asks by 40px; on a 412px phone at 1.75x that tipped the pick from the
  // 720w file to the 1200w one.
  it("subtract the mobile gutter instead of claiming the full viewport", () => {
    expect(all.length).toBeGreaterThan(0);
    for (const item of all) {
      expect(item.sizes, item.src).toMatch(/calc\(100vw - 40px\)\s*$/);
    }
  });
});
