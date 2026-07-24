import { test, expect } from "@playwright/test";

test.describe("/negocios — B2B outbound collateral page", () => {
  test("returns 200 with a non-generic title", async ({ page }) => {
    const response = await page.goto("/negocios");
    expect(response?.status()).toBe(200);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe("El Horno del Pingüino — Postres artesanales hechos para sorprender");
    expect(title).toMatch(/negocio/i);
  });

  test("renders exactly 4 segment rows, and clubes has no empty media frame", async ({ page }) => {
    await page.goto("/negocios");

    const rows = page.locator("[data-negocios-segment]");
    await expect(rows).toHaveCount(4);

    const clubesRow = page.locator("[data-negocios-segment='clubes']");
    await expect(clubesRow).toBeVisible();
    await expect(clubesRow).toHaveClass(/negocios-row--text/);
    // No figure element at all — not rendered-then-hidden, no placeholder frame.
    await expect(clubesRow.locator("figure")).toHaveCount(0);
    await expect(clubesRow.locator("img")).toHaveCount(0);

    const mediaSegments = ["cafeterias", "colegios", "empresas"];
    for (const slug of mediaSegments) {
      const row = page.locator(`[data-negocios-segment='${slug}']`);
      await expect(row).toHaveClass(/negocios-row--media/);
      await expect(row.locator("figure img")).toHaveCount(1);
    }
  });

  test("every segment CTA links to a valid, segment-named wa.me URL", async ({ page }) => {
    await page.goto("/negocios");

    const segmentNameRef: Record<string, string> = {
      cafeterias: "cafetería",
      colegios: "colegio",
      clubes: "club",
      empresas: "empresa",
    };

    for (const [slug, nameRef] of Object.entries(segmentNameRef)) {
      const cta = page.locator(`[data-negocios-segment='${slug}'] a[href*="wa.me"]`);
      await expect(cta).toHaveCount(1);
      const href = await cta.getAttribute("href");
      expect(href).toMatch(/^https:\/\/wa\.me\//);
      const decoded = decodeURIComponent(href ?? "");
      expect(decoded).toContain(nameRef);
    }
  });

  test("proof section shows the sanctioned figure only", async ({ page }) => {
    await page.goto("/negocios");
    const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(bodyText).toContain("+120 pedidos entregados");

    // No other numeric statistic, countdown, or testimonial beyond the
    // sanctioned "+120 pedidos entregados" and "3 años" proof points, and
    // the 4 ordered "how we work" step numerals.
    const suspiciousStats = page.locator(
      "[data-countdown], [data-testimonial], [data-stat]:not([data-stat='proof'])"
    );
    await expect(suspiciousStats).toHaveCount(0);
  });

  test("has zero console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/negocios");
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test("/sitemap-index.xml is reachable and includes /negocios", async ({ page, request }) => {
    const indexResponse = await request.get("/sitemap-index.xml");
    expect(indexResponse.status()).toBe(200);
    expect(indexResponse.headers()["content-type"] ?? "").toContain("xml");
    const indexBody = await indexResponse.text();

    // The index references per-page sitemap(s); follow whichever contains
    // /negocios rather than assuming a single flat sitemap file.
    const sitemapUrls = [...indexBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    let found = false;
    for (const url of sitemapUrls) {
      const path = new URL(url).pathname;
      const res = await request.get(path);
      const body = await res.text();
      if (body.includes("/negocios")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test("reduced motion: nothing stays stuck at opacity 0", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/negocios");
    await page.waitForTimeout(500);

    const targets = page.locator("[data-negocios-anim]");
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const opacity = await targets.nth(i).evaluate((el) => window.getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
    }

    expect(errors).toEqual([]);
  });

  test("standard motion: hero entrance settles with nothing stuck at opacity 0", async ({ page }) => {
    await page.goto("/negocios");
    await page.waitForTimeout(2200);

    const targets = page.locator("[data-negocios-anim]");
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const opacity = await targets.nth(i).evaluate((el) => window.getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
    }
  });
});
