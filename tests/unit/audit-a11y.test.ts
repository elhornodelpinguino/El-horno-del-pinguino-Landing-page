import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import tailwindConfig from "../../tailwind.config.mjs";
import { contrastRatio } from "./brand-contrast.test";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const css = read("src/styles/global.css");

const brand = (tailwindConfig as { theme: { extend: { colors: { horno: Record<string, string> } } } })
  .theme.extend.colors.horno;
const AA_NORMAL = 4.5;

type Rgb = [number, number, number];
const hex = (value: string): Rgb =>
  [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
const toHex = ([r, g, b]: Rgb) =>
  "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
const blend = (fg: Rgb, alpha: number, bg: Rgb): Rgb =>
  fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as Rgb;

/** Declarations of the first rule that starts with `selector {`. */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start === -1) throw new Error(`${selector} not found in global.css`);
  return css.slice(start, css.indexOf("}", start));
}

function themeVars(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
}

describe("/negocios text contrast", () => {
  it(".n-stat-label clears AA over both magenta bands", () => {
    const m = rule(".n-stat-label").match(/color:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    expect(m, "n-stat-label colour").not.toBeNull();
    const ink: Rgb = [Number(m![1]), Number(m![2]), Number(m![3])];
    const alpha = Number(m![4]);
    for (const band of [brand.magenta, brand.magentaDeep]) {
      const painted = toHex(blend(ink, alpha, hex(band)));
      expect(contrastRatio(painted, band), `over ${band}`).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("step figcaptions clear AA on every light and dark surface", () => {
    const m = rule(".negocios-step-media figcaption").match(/color-mix\(in srgb,\s*var\((--[\w-]+)\)\s*(\d+)%,\s*transparent\)/);
    expect(m, "figcaption colour").not.toBeNull();
    const inkVar = m![1];
    const alpha = Number(m![2]) / 100;
    for (const selector of [":root", 'html[data-theme="dark"]']) {
      const vars = themeVars(selector);
      for (const surface of ["--surface", "--surface-alt", "--surface-soft", "--surface-raised"]) {
        const painted = toHex(blend(hex(vars[inkVar]), alpha, hex(vars[surface])));
        expect(contrastRatio(painted, vars[surface]), `${selector} ${surface}`).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });
});

describe("flavour showcase", () => {
  const showcase = read("src/components/FlavourShowcase.astro");

  // `opacity` on the whole card also fades the white CTA label and its
  // magenta fill; axe then reports ~4.2:1. The recede effect moves to the
  // photo, where no text lives.
  it("does not fade inactive cards as a whole, so the CTA keeps full contrast", () => {
    expect(rule(".flavour-card")).not.toMatch(/\bopacity:\s*0?\.\d+/);
    expect(css).toMatch(/\.flavour-card:not\(\[data-coverflow-position="active"\]\)\s+\.flavour-card-media/);
  });

  it("white CTA text on the brand magenta clears AA", () => {
    expect(contrastRatio("#ffffff", brand.magenta)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio("#ffffff", brand.magentaDeep)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("the CTA accessible name starts with its visible text (WCAG 2.5.3)", () => {
    const label = showcase.match(/class="flavour-card-cta"\s+aria-label=\{`([^`]*)`\}/)?.[1];
    expect(label).toBeDefined();
    expect(label!.startsWith("Pedir este sabor")).toBe(true);
    expect(showcase).toMatch(/>\s*Pedir este sabor\s*<span aria-hidden="true">/);
  });

  it("does not force role=group onto <article> (invalid ARIA role)", () => {
    expect(showcase).not.toMatch(/role="group"/);
  });
});

describe("footer and heading structure", () => {
  const contact = read("src/components/Contact.astro");

  it("footer headings do not skip levels", () => {
    expect(contact).not.toMatch(/<h4\b/);
    expect(contact.match(/<h2\b/g)?.length).toBe(2);
  });

  // The copyright line (cream/50) scored 2.98:1 and "Síguenos" (cream/60)
  // 3.72:1 on the deep magenta; the footer now shows on /negocios and the 404.
  it("footer text, whatever its opacity, clears AA over the deep magenta", () => {
    const cream = hex(brand.cream);
    const deep = hex(brand.magentaDeep);
    const alphas = [...contact.matchAll(/text-horno-cream\/(\d+)/g)].map((m) => Number(m[1]) / 100);
    expect(alphas.length).toBeGreaterThan(0);
    for (const alpha of alphas) {
      const painted = toHex(blend(cream, alpha, deep));
      expect(contrastRatio(painted, brand.magentaDeep), `cream/${alpha * 100}`).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("footer logo has intrinsic dimensions", () => {
    const logo = contact.match(/<img[^>]*logo-horizontal\.svg[^>]*>/)?.[0] ?? "";
    expect(logo).toMatch(/\bwidth="160"/);
    expect(logo).toMatch(/\bheight="40"/);
  });

  it.each(["src/pages/index.astro", "src/pages/negocios.astro", "src/pages/404.astro"])(
    "%s renders the footer as a top-level landmark, outside <main>",
    (file) => {
      const page = read(file);
      expect(page).toMatch(/<Contact\b[^>]*\/>/);
      expect(page.indexOf("<Contact")).toBeGreaterThan(page.indexOf("</main>"));
    },
  );
});

describe("internal links", () => {
  it("point to /negocios/ (the canonical form), not the redirecting /negocios", () => {
    for (const file of ["src/components/SiteHeader.astro", "src/components/BusinessBridge.astro"]) {
      expect(read(file), file).not.toMatch(/href[:=]\s*["{]?"\/negocios"/);
      expect(read(file), file).toMatch(/\/negocios\//);
    }
  });
});
