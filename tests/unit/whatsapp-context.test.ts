import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import { WHATSAPP_CONTEXTS } from "~/scripts/analytics.js";

const root = path.resolve(__dirname, "../..");

// Components that no page imports (and the backup folder) are dead code: tagging
// them would be a guess about a funnel they are not part of.
const DEAD = ["BusinessUseCases", "SpecialEditions", "LimitedSpots"];

function files(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "backup" && entry.name !== "e2e-fixtures") walk(full);
      } else if (entry.name.endsWith(".astro")) {
        out.push(full);
      }
    }
  };
  walk(path.join(root, "src/components"));
  walk(path.join(root, "src/pages"));
  walk(path.join(root, "src/layouts"));
  return out.filter((f) => !DEAD.some((name) => f.endsWith(`${name}.astro`)));
}

// An <a> that sends to WhatsApp: built with whatsappLink(), or from one of the
// variables that hold such a link.
const WA_HREF = /href=\{(?:[^}]*whatsappLink\(|ctaHref\b|cta\.href\b|defaultLink\b|quoteLink\b|introLink\b|closingLink\b|orderLink\b|social\.href\b)/;

describe("WhatsApp click tags", () => {
  const anchors = files().flatMap((file) => {
    const source = readFileSync(file, "utf8");
    return [...source.matchAll(/<a\b(?:[^>{]|\{[^}]*\})*>/gs)].map((m) => ({ file: path.relative(root, file), tag: m[0] }));
  });
  const whatsapp = anchors.filter(({ tag }) => WA_HREF.test(tag));

  it("finds the WhatsApp links to check", () => {
    expect(whatsapp.length).toBeGreaterThanOrEqual(12);
  });

  it("every WhatsApp link on a measured page declares its context", () => {
    // 404 is not a measured route, so its link has nothing to report to.
    const untagged = whatsapp
      .filter(({ file }) => !file.endsWith("404.astro"))
      .filter(({ tag }) => !/data-whatsapp-context=/.test(tag) && !/social\.href/.test(tag))
      .map(({ file, tag }) => `${file}: ${tag.slice(0, 80).replace(/\s+/g, " ")}`);
    expect(untagged).toEqual([]);
  });

  it("literal context values belong to the analytics vocabulary", () => {
    for (const { tag } of whatsapp) {
      const literal = tag.match(/data-whatsapp-context="([^"]+)"/)?.[1];
      if (literal) expect(WHATSAPP_CONTEXTS).toContain(literal);
    }
  });

  it("the header CTA always has a context (the home one used to be untagged)", () => {
    const header = readFileSync(path.join(root, "src/components/SiteHeader.astro"), "utf8");
    expect(header).not.toMatch(/context:\s*undefined/);
  });

  it("the footer tags only its WhatsApp social icon, with the page's context", () => {
    const contact = readFileSync(path.join(root, "src/components/Contact.astro"), "utf8");
    expect(contact).toMatch(/data-whatsapp-context=\{social\.icon === "whatsapp" \? whatsappContext : undefined\}/);
    expect(contact).toMatch(/whatsappContext = "consumer"/);
    expect(readFileSync(path.join(root, "src/pages/negocios.astro"), "utf8")).toMatch(/<Contact whatsappContext="business-closing"/);
  });
});
