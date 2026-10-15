import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Astro escapes every `{expression}` by default; the only way API text could
// become markup is `set:html`/`innerHTML`. Pin that these templates never use it.
const read = (p: string) => readFileSync(p, "utf8");

describe("admin-driven templates", () => {
  for (const file of ["src/components/FAQ.astro", "src/components/AnnouncementBanner.astro"]) {
    it(`${file} never injects API text as raw HTML`, () => {
      const src = read(file);
      expect(src).not.toMatch(/set:html/);
      expect(src).not.toMatch(/innerHTML/);
    });
  }

  it("AnnouncementBanner renders nothing when there are no banners and is a labelled region otherwise", () => {
    const src = read("src/components/AnnouncementBanner.astro");
    expect(src).toMatch(/banners\.length\s*>\s*0|banners\.length\s*&&|\{banner\s*&&|banner\s*\?/);
    expect(src).toMatch(/role="region"|<section[^>]*aria-label/);
    expect(src).toMatch(/aria-label=/);
  });

  it("FAQ keeps the accordion hooks the scripts depend on", () => {
    const src = read("src/components/FAQ.astro");
    for (const hook of ["data-faq-root", 'data-faq-anim="item"', "faq-item", "faq-summary", "faq-content", "faq-answer", "group-open:rotate-180"]) {
      expect(src).toContain(hook);
    }
  });

  it("home page and the pages that use SITE load the admin content first", () => {
    for (const page of ["src/pages/index.astro", "src/pages/negocios.astro", "src/pages/404.astro"]) {
      expect(read(page)).toMatch(/await loadSiteContent\(\)/);
    }
  });
});
