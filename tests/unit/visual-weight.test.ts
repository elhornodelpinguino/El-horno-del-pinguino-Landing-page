import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

// Redesign contract: the page read thin and the penguin barely showed. These
// checks pin the two moves that fixed it, so a later edit cannot quietly slide
// the headings back to light weights or shrink the mascot to an icon again.
const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const css = read("src/styles/global.css");

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`(?:^|\\n)[ \\t]*${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`${selector} not found in global.css`);
  return match[1];
}

function weight(selector: string): number {
  const match = rule(selector).match(/font-weight:\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

function px(selector: string, prop: string): number {
  const match = rule(selector).match(new RegExp(`${prop}:\\s*(\\d+)px`));
  return match ? Number(match[1]) : 0;
}

describe("heavier type", () => {
  it("loads the heavy display and body weights", () => {
    const layout = read("src/layouts/BaseLayout.astro");
    expect(layout).toMatch(/Fraunces:[^&"]*wght@9\.\.144,600\.\.900/);
    expect(layout).toMatch(/Poppins:wght@[\d;]*800/);
  });

  it("sets the display utilities at extra-bold weight", () => {
    expect(weight(".display-hero")).toBeGreaterThanOrEqual(800);
    expect(weight(".display-section")).toBeGreaterThanOrEqual(800);
  });

  it("uses the display utilities for the home h1 and every home section h2", () => {
    expect(read("src/components/Hero.astro")).toMatch(/<h1[^>]*class="[^"]*display-hero/);

    for (const file of [
      "FlavourShowcase",
      "ProductGrid",
      "Statement",
      "HowToOrder",
      "FAQ",
      "BusinessBridge",
      "FinalCTA",
    ]) {
      expect(read(`src/components/${file}.astro`), file).toMatch(/<h2[^>]*class="[^"]*display-section/);
    }
  });

  it("raises body copy to medium weight", () => {
    expect(rule("body")).toMatch(/font-weight:\s*500/);
  });
});

describe("penguin presence", () => {
  it("renders the hero chef as the page's largest figure", () => {
    expect(px(".penguin-sprite", "--sprite-display")).toBeGreaterThanOrEqual(280);
    const desktop = css.match(/@media \(min-width: 1024px\)\s*\{\s*\.penguin-sprite\s*\{\s*--sprite-display:\s*(\d+)px/);
    expect(Number(desktop?.[1] ?? 0)).toBeGreaterThanOrEqual(400);
  });

  it("enlarges the section penguins", () => {
    expect(px(".penguin-step", "width")).toBeGreaterThanOrEqual(168);
    expect(px(".penguin-trust", "width")).toBeGreaterThanOrEqual(200);
    expect(px(".penguin-faq", "width")).toBeGreaterThanOrEqual(168);
  });

  it("puts a penguin in the final call to action", () => {
    expect(read("src/components/FinalCTA.astro")).toMatch(/penguin/);
  });
});

describe("negocios page redesign", () => {
  const page = () => read("src/pages/negocios.astro");

  it("sets the page display and section headings at extra-bold weight", () => {
    expect(weight(".n-display")).toBeGreaterThanOrEqual(800);
    expect(weight(".n-h2")).toBeGreaterThanOrEqual(800);
  });

  it("gives every business segment its own penguin, as CSS art not an <img>", () => {
    // tests/e2e/negocios.spec.ts counts exactly one <img> per segment row.
    const row = read("src/components/BusinessSegmentRow.astro");
    expect(row).toMatch(/<div[^>]*class:list=\{\["negocios-row-penguin"/);

    for (const slug of ["cafeterias", "colegios", "clubes", "empresas"]) {
      expect(css, slug).toMatch(new RegExp(`\\.negocios-row-penguin--${slug}\\s*\\{[^}]*background-image`));
    }
  });

  it("puts penguins in the proof band and the closing call to action", () => {
    expect(page()).toMatch(/class="negocios-stat-penguin"/);
    expect(page()).toMatch(/class="[^"]*negocios-closing-penguin/);
  });
});

describe("business bridge", () => {
  const bridge = () => read("src/components/BusinessBridge.astro");

  it("is a full-bleed brand band, not a cream card on a cream page", () => {
    expect(bridge()).toMatch(/<section id="negocios" class="[^"]*business-bridge/);
    expect(bridge()).not.toMatch(/bg-white\/70/);
    expect(rule(".business-bridge")).toMatch(/background:\s*#f49d50/);
  });

  it("shows the three business penguins", () => {
    for (const art of ["business", "student", "coffee"]) {
      expect(bridge(), art).toMatch(new RegExp(`business-bridge-penguin--${art}`));
    }
  });

  it("keeps both exits: the /negocios page and the WhatsApp quote", () => {
    expect(bridge()).toMatch(/href="\/negocios"/);
    expect(bridge()).toMatch(/data-whatsapp-context="business-intro"/);
  });
});

describe("floating site header", () => {
  it("renders once from the shared layout, on every page", () => {
    const layout = read("src/layouts/BaseLayout.astro");
    expect(layout).toMatch(/import SiteHeader from "~\/components\/SiteHeader\.astro"/);
    expect(layout).toMatch(/<SiteHeader\b/);
    expect(read("src/components/Hero.astro")).not.toMatch(/<nav\b/);
  });

  it("stays fixed to the viewport while scrolling", () => {
    expect(rule(".site-header")).toMatch(/position:\s*fixed/);
  });

  it("keeps the e2e nav contract: desktop links, hamburger, mobile panel", () => {
    const header = read("src/components/SiteHeader.astro");
    expect(header).toMatch(/<nav\b/);
    expect(header).toMatch(/class="hidden[^"]*sm:flex/);
    expect(header).toMatch(/data-hamburger/);
    expect(header).toMatch(/data-mobile-nav/);
  });

  it("points section links back to the home page when off the home page", () => {
    const header = read("src/components/SiteHeader.astro");
    expect(header).toMatch(/const sectionBase = isHome \? "" : "\/"/);
  });
});
