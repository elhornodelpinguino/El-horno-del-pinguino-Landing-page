import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import tailwindConfig from "../../tailwind.config.mjs";

// The brand orange (#f49d50) is a fill colour, not an ink. Painted as text it
// scored 1.84:1 on cream and 2.15:1 on white — under half of WCAG AA. Two
// dedicated ink tokens carry text instead, one per surface family, so the
// brand fill keeps its exact value on buttons, borders and sprites.
const brand = (tailwindConfig as { theme: { extend: { colors: { horno: Record<string, string> } } } })
  .theme.extend.colors.horno;

/** Surfaces that orange text is painted on in light sections. */
const LIGHT_SURFACES = ["cream", "creamDark"] as const;
/** Surfaces that orange text is painted on in magenta bands. */
const DARK_SURFACES = ["magenta", "magentaDeep"] as const;

const WHITE = "#ffffff";

/** WCAG 2.1 minimum for body-sized text. Large text may drop to 3.0, but the
 * ink tokens are held to the stricter bar so a size change can never silently
 * demote a passing pair. */
const AA_NORMAL = 4.5;

function channels(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((raw) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, acc);
    else if (/\.(astro|ts|css)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

describe("brand contrast tokens", () => {
  it("exposes an ink token that clears AA on every light surface", () => {
    expect(brand.orangeInk).toBeDefined();

    for (const surface of LIGHT_SURFACES) {
      expect(contrastRatio(brand.orangeInk, brand[surface])).toBeGreaterThanOrEqual(AA_NORMAL);
    }
    expect(contrastRatio(brand.orangeInk, WHITE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("exposes an ink token that clears AA on every magenta band", () => {
    expect(brand.orangeOnDark).toBeDefined();

    for (const surface of DARK_SURFACES) {
      expect(contrastRatio(brand.orangeOnDark, brand[surface])).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("keeps the brand fill orange at its original value", () => {
    // Changing this would repaint buttons, borders and the penguin sprite.
    // The contrast fix is a text-only change by construction.
    expect(brand.orange).toBe("#f49d50");
  });
});

describe("orange is never used as a text colour", () => {
  // The regression this guards: `text-horno-orange` reads as a reasonable
  // Tailwind class, so it invites itself back on every new section. This test
  // fails the build instead of waiting for an audit to catch it again.
  it("has no `text-horno-orange` class left in source", () => {
    const root = path.resolve(__dirname, "../../src");
    const offenders: string[] = [];

    for (const file of sourceFiles(root)) {
      const contents = readFileSync(file, "utf8");
      contents.split("\n").forEach((line, index) => {
        // Match the fill token used as ink, but not the ink tokens themselves.
        if (/text-horno-orange(?![A-Za-z])/.test(line)) {
          offenders.push(`${path.relative(root, file)}:${index + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  // The Tailwind class is only half the surface: global.css writes colours as
  // raw hex, where the same mistake is invisible to the class guard above.
  it("has no raw fill-orange `color:` declaration in CSS", () => {
    const root = path.resolve(__dirname, "../../src");
    const offenders: string[] = [];

    for (const file of sourceFiles(root).filter((f) => f.endsWith(".css"))) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (/color:\s*#f49d50/i.test(line)) {
            offenders.push(`${path.relative(root, file)}:${index + 1}`);
          }
        });
    }

    expect(offenders).toEqual([]);
  });
});
