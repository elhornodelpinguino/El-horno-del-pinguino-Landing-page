import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const css = read("src/styles/global.css");
const layout = read("src/layouts/BaseLayout.astro");
const headers = read("public/_headers");
const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? "";

const directive = (name: string) =>
  csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? "";

// Fraunces + Poppins used to come from Google Fonts: a render-blocking
// stylesheet on another origin (~1 s of FCP on mobile) that the CSP also
// blocked as a preload. They are static files now.
describe("self-hosted fonts", () => {
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  const face = (family: string, weight: string) =>
    faces.find(
      (f) => new RegExp(`font-family:\\s*["']?${family}["']?`).test(f) && new RegExp(`font-weight:\\s*${weight}\\s*;`).test(f),
    );

  it("declares Fraunces (variable 600-900) and Poppins 500/600/700 with font-display swap", () => {
    for (const [family, weight] of [
      ["Fraunces", "600 900"],
      ["Poppins", "500"],
      ["Poppins", "600"],
      ["Poppins", "700"],
    ]) {
      const f = face(family, weight);
      expect(f, `${family} ${weight}`).toBeDefined();
      expect(f).toMatch(/font-display:\s*swap/);
      expect(f).toMatch(/format\("woff2"\)/);
    }
  });

  it("points every @font-face at a woff2 that exists under public/fonts", () => {
    const urls = [...css.matchAll(/url\("?(\/fonts\/[^")]+\.woff2)"?\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThanOrEqual(4);
    for (const url of urls) {
      const file = path.join(root, "public", url);
      expect(existsSync(file), url).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(1000);
    }
  });

  it("ships the OFL license next to the fonts", () => {
    expect(existsSync(path.join(root, "public/fonts/OFL-Fraunces.txt"))).toBe(true);
    expect(existsSync(path.join(root, "public/fonts/OFL-Poppins.txt"))).toBe(true);
  });

  it("preloads the hero fonts (display face and body weight) as crossorigin woff2", () => {
    const preloads = [...layout.matchAll(/<link[^>]*rel="preload"[^>]*>/g)].map((m) => m[0]);
    const fonts = preloads.filter((p) => /as="font"/.test(p));
    expect(fonts.some((p) => /fraunces/.test(p))).toBe(true);
    expect(fonts.some((p) => /poppins-latin-500/.test(p))).toBe(true);
    for (const p of fonts) {
      expect(p).toMatch(/type="font\/woff2"/);
      expect(p).toMatch(/crossorigin/);
    }
  });

  it("no longer talks to Google Fonts anywhere the browser can see", () => {
    expect(layout).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    expect(headers).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });

  it("CSP allows fonts from self only and keeps the rest of the policy intact", () => {
    expect(directive("font-src")).toBe("font-src 'self'");
    expect(directive("style-src")).toBe("style-src 'self' 'unsafe-inline'");
    expect(directive("img-src")).toContain("https://res.cloudinary.com");
    expect(directive("connect-src")).toContain("https://horno-product-admin.onrender.com");
  });

  it("caches the unhashed font files for a year", () => {
    expect(headers).toMatch(/\/fonts\/\*\s*\n\s+Cache-Control:\s*public, max-age=31536000, immutable/);
  });
});

// The H1 is the LCP element. A `from({opacity: 0})` keeps it invisible until
// the script bundle runs, which is exactly the late paint the audit found.
describe("hero animation", () => {
  const hero = read("src/scripts/hero-animation.js");

  it("never fades the H1 in: it is visible at first paint", () => {
    const line = hero.split("\n").find((l) => /\.from\(heading/.test(l)) ?? "";
    expect(line).not.toBe("");
    expect(line).not.toMatch(/opacity/);
  });

  it("does not tween a nav the hero does not contain", () => {
    expect(hero).not.toMatch(/querySelector\("nav"\)/);
    expect(hero).not.toMatch(/from\(nav\b/);
  });
});
