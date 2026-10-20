import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import { applyMenuState } from "./mobile-nav.js";

// Minimal element double: the helper only touches attributes and `inert`.
const element = () => {
  const attrs = new Map<string, string>();
  return {
    inert: true,
    setAttribute: (name: string, value: string) => void attrs.set(name, value),
    getAttribute: (name: string) => attrs.get(name) ?? null,
  };
};

describe("applyMenuState", () => {
  it("closed: the panel is inert, so its links cannot take focus", () => {
    const nav = element();
    const btn = element();
    nav.inert = false;
    applyMenuState(nav, btn, false);
    expect(nav.inert).toBe(true);
    expect(nav.getAttribute("data-menu-open")).toBe("false");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("aria-label")).toBe("Abrir menú");
  });

  it("open: the panel is live again", () => {
    const nav = element();
    const btn = element();
    applyMenuState(nav, btn, true);
    expect(nav.inert).toBe(false);
    expect(nav.getAttribute("data-menu-open")).toBe("true");
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(btn.getAttribute("aria-label")).toBe("Cerrar menú");
  });

  it("round-trips closed -> open -> closed", () => {
    const nav = element();
    const btn = element();
    applyMenuState(nav, btn, true);
    applyMenuState(nav, btn, false);
    expect(nav.inert).toBe(true);
  });
});

describe("SiteHeader markup", () => {
  const header = readFileSync(path.resolve(__dirname, "../components/SiteHeader.astro"), "utf8");
  const panel = header.match(/<div id="mobile-nav"[^>]*>/)?.[0] ?? "";

  it("renders the panel inert from the server, so there is no focusable window before the script runs", () => {
    expect(panel).toMatch(/\binert\b/);
  });

  it("does not force the panel links back into the tab order", () => {
    const links = header.slice(header.indexOf('<div id="mobile-nav"'));
    expect(links).not.toMatch(/tabindex="0"/);
  });
});
