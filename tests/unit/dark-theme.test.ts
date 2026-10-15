import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import { contrastRatio } from "./brand-contrast.test";

// Dark mode swaps *roles*, not brand colours. Surfaces (cream sections, white
// cards) and the inks painted on them change with the theme; the brand fills
// (magenta bands, orange bands, buttons) never do. Brand bands are marked
// `.on-brand` and keep the light roles, so their dark ink stays dark on orange.
const css = readFileSync(path.resolve(__dirname, "../../src/styles/global.css"), "utf8");

const SURFACES = ["--surface", "--surface-alt", "--surface-soft", "--surface-raised"] as const;
const INKS = ["--ink", "--ink-brand", "--ink-accent", "--ink-warm"] as const;
const AA_NORMAL = 4.5;

function block(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`${selector} not found in global.css`);
  return Object.fromEntries(
    [...match[1].matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2].toLowerCase()]),
  );
}

const light = block(":root");
const dark = block('html[data-theme="dark"]');
const island = block('html[data-theme="dark"] .on-brand');

describe("theme roles", () => {
  it("defines every surface and ink role in both themes", () => {
    for (const role of [...SURFACES, ...INKS]) {
      expect(light[role], `light ${role}`).toMatch(/^#/);
      expect(dark[role], `dark ${role}`).toMatch(/^#/);
    }
  });

  it("keeps the light theme on the current brand values", () => {
    expect(light["--surface"]).toBe("#fbebde");
    expect(light["--surface-alt"]).toBe("#f5dcc9");
    expect(light["--surface-soft"]).toBe("#fff8f2");
    expect(light["--surface-raised"]).toBe("#ffffff");
    expect(light["--ink"]).toBe("#2d1a1a");
    expect(light["--ink-brand"]).toBe("#8a0f43");
    expect(light["--ink-accent"]).toBe("#a81452");
    expect(light["--ink-warm"]).toBe("#944d0e");
  });

  it("actually darkens the surfaces in the dark theme", () => {
    for (const role of SURFACES) {
      expect(contrastRatio(dark[role], "#000000"), role).toBeLessThan(2);
    }
  });

  for (const [name, theme] of [
    ["light", light],
    ["dark", dark],
  ] as const) {
    it(`clears AA for every ink on every surface in the ${name} theme`, () => {
      for (const ink of INKS) {
        for (const surface of SURFACES) {
          const ratio = contrastRatio(theme[ink], theme[surface]);
          expect(ratio, `${name}: ${ink} on ${surface} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(AA_NORMAL);
        }
      }
    });
  }

  it("restores the light roles inside brand bands", () => {
    for (const role of [...SURFACES, ...INKS]) {
      expect(island[role], role).toBe(light[role]);
    }
  });

  it("tells the browser which scheme each theme uses", () => {
    expect(css).toMatch(/:root\s*\{[^}]*color-scheme:\s*light/);
    expect(css).toMatch(/html\[data-theme="dark"\]\s*\{[^}]*color-scheme:\s*dark/);
  });
});
