import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import { buildHeadSeo } from "~/lib/seo";

const site = new URL("https://elhornodelpinguino.com");
const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("buildHeadSeo", () => {
  it("indexable pages get a canonical, an og:url and no robots directive", () => {
    const seo = buildHeadSeo({ canonicalUrl: "https://elhornodelpinguino.com/negocios/", noindex: false, site });
    expect(seo.canonical).toBe("https://elhornodelpinguino.com/negocios/");
    expect(seo.ogUrl).toBe("https://elhornodelpinguino.com/negocios/");
    expect(seo.robots).toBeUndefined();
  });

  it("noindex pages emit robots=noindex and neither canonical nor og:url", () => {
    const seo = buildHeadSeo({ canonicalUrl: "https://elhornodelpinguino.com/404", noindex: true, site });
    expect(seo.robots).toBe("noindex");
    expect(seo.canonical).toBeUndefined();
    expect(seo.ogUrl).toBeUndefined();
  });

  it("resolves relative canonical URLs against the site", () => {
    expect(buildHeadSeo({ canonicalUrl: "/x/", noindex: false, site }).canonical).toBe(
      "https://elhornodelpinguino.com/x/",
    );
  });
});

describe("404 page", () => {
  const page = read("src/pages/404.astro");

  it("opts out of indexing", () => {
    expect(page).toMatch(/<BaseLayout[^>]*\bnoindex\b/);
  });

  it("no longer points a canonical at /404", () => {
    expect(page).not.toMatch(/canonicalUrl=/);
    expect(page).not.toMatch(/\/404"/);
  });
});

describe("BaseLayout head", () => {
  const layout = read("src/layouts/BaseLayout.astro");

  it("renders canonical and og:url only through buildHeadSeo", () => {
    expect(layout).toMatch(/buildHeadSeo/);
    expect(layout).toMatch(/seo\.canonical && /);
    expect(layout).toMatch(/seo\.ogUrl && /);
    expect(layout).toMatch(/seo\.robots && /);
  });
});
