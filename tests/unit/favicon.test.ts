import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Google Search only renders a site favicon when it is square and a multiple
// of 48px, reachable at a stable URL and declared via <link rel="icon">.
// https://developers.google.com/search/docs/appearance/favicon-in-search
const PUBLIC = path.resolve(__dirname, "../../public");
const LAYOUT = path.resolve(__dirname, "../../src/layouts/BaseLayout.astro");

const PNG_ICONS: Array<[file: string, size: number]> = [
  ["favicon-96.png", 96],
  ["favicon-192.png", 192],
];

describe("favicon assets", () => {
  it.each(PNG_ICONS)("%s is a square %ipx PNG", async (file, size) => {
    const meta = await sharp(path.join(PUBLIC, file)).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(size);
    expect(meta.height).toBe(size);
    expect(size % 48).toBe(0);
  });

  it("apple-touch-icon.png is a square 180px PNG", async () => {
    const meta = await sharp(path.join(PUBLIC, "apple-touch-icon.png")).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(180);
    expect(meta.height).toBe(180);
  });

  it("favicon.ico exists at the site root with a valid ICO header", () => {
    const file = path.join(PUBLIC, "favicon.ico");
    expect(existsSync(file)).toBe(true);
    const buf = readFileSync(file);
    // ICONDIR: reserved=0, type=1 (icon), count>=1
    expect(buf.readUInt16LE(0)).toBe(0);
    expect(buf.readUInt16LE(2)).toBe(1);
    expect(buf.readUInt16LE(4)).toBeGreaterThanOrEqual(1);
  });
});

describe("BaseLayout favicon links", () => {
  const html = readFileSync(LAYOUT, "utf8");

  it("declares the 96px PNG icon Google can index", () => {
    expect(html).toMatch(
      /<link\s+rel="icon"\s+type="image\/png"\s+sizes="96x96"\s+href="\/favicon-96\.png"\s*\/>/,
    );
  });

  it("declares favicon.ico and the apple touch icon", () => {
    expect(html).toMatch(/<link\s+rel="icon"\s+href="\/favicon\.ico"\s+sizes="48x48"\s*\/>/);
    expect(html).toMatch(/<link\s+rel="apple-touch-icon"\s+href="\/apple-touch-icon\.png"\s*\/>/);
  });

  it("no longer points the icon at the non-square isotipo", () => {
    expect(html).not.toMatch(/rel="icon"[^>]*href="\/isotipo\.png"/);
  });
});
