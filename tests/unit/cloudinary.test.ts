import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import { cloudinaryImage, cloudinaryUrl } from "~/lib/cloudinary";

const original = "https://res.cloudinary.com/jvgcyq4f/image/upload/v1785776783/horno/products/p1vnfrgzoagonmieaezh.jpg";

describe("cloudinaryUrl", () => {
  it("inserts format, quality and a width cap right after /upload/", () => {
    expect(cloudinaryUrl(original, 640)).toBe(
      "https://res.cloudinary.com/jvgcyq4f/image/upload/f_auto,q_auto,c_limit,w_640/v1785776783/horno/products/p1vnfrgzoagonmieaezh.jpg",
    );
  });

  it("leaves other hosts untouched", () => {
    for (const url of [
      "https://example.com/image/upload/v1/a.jpg",
      "/producto-mini-donas.jpg",
      "data:image/webp;base64,AAAA",
      "https://res.cloudinary.com.evil.example/jvgcyq4f/image/upload/v1/a.jpg",
      "http://res.cloudinary.com/jvgcyq4f/image/upload/v1/a.jpg",
      "",
      "not a url",
    ]) {
      expect(cloudinaryUrl(url, 640), url).toBe(url);
    }
  });

  it("does not stack transforms onto a URL that already has one", () => {
    const edited = "https://res.cloudinary.com/jvgcyq4f/image/upload/c_fill,w_300/v1/a.jpg";
    expect(cloudinaryUrl(edited, 640)).toBe(edited);
  });

  it("does not touch non-image delivery types", () => {
    const video = "https://res.cloudinary.com/jvgcyq4f/video/upload/v1/a.mp4";
    expect(cloudinaryUrl(video, 640)).toBe(video);
  });

  it("rejects nonsense widths instead of emitting w_NaN", () => {
    for (const w of [0, -5, Number.NaN, 1.5]) expect(cloudinaryUrl(original, w)).toBe(original);
  });
});

describe("cloudinaryImage", () => {
  it("returns a srcset of the requested widths plus a default src", () => {
    const image = cloudinaryImage(original, { widths: [360, 720], defaultWidth: 720 });
    expect(image.src).toContain("w_720/");
    expect(image.srcset).toBe(`${cloudinaryUrl(original, 360)} 360w, ${cloudinaryUrl(original, 720)} 720w`);
  });

  it("has no srcset for URLs it does not own", () => {
    const image = cloudinaryImage("/producto-mini-donas.jpg", { widths: [360, 720], defaultWidth: 720 });
    expect(image.src).toBe("/producto-mini-donas.jpg");
    expect(image.srcset).toBeUndefined();
  });
});

describe("ProductCard", () => {
  const card = readFileSync(path.resolve(__dirname, "../../src/components/ProductCard.astro"), "utf8");

  it("renders product photos through the helper with srcset, sizes and explicit dimensions", () => {
    expect(card).toMatch(/cloudinaryImage\(/);
    const img = card.match(/<img[^>]*>/)?.[0] ?? "";
    expect(img).toMatch(/srcset=\{/);
    expect(img).toMatch(/sizes=\{?/);
    expect(img).toMatch(/\bwidth=\{/);
    expect(img).toMatch(/\bheight=\{/);
    expect(img).toMatch(/decoding="async"/);
  });
});
