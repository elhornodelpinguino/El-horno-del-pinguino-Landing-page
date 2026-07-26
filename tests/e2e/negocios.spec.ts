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

  test("renders exactly 4 segment rows with real responsive media", async ({ page }) => {
    await page.goto("/negocios");

    const rows = page.locator("[data-negocios-segment]");
    await expect(rows).toHaveCount(4);

    const mediaSegments = ["cafeterias", "colegios", "clubes", "empresas"];
    for (const slug of mediaSegments) {
      const row = page.locator(`[data-negocios-segment='${slug}']`);
      await expect(row).toHaveClass(/negocios-row--media/);
      await expect(row.locator("figure img")).toHaveCount(1);
      await expect(row.locator("img")).toHaveAttribute("src", /b2b-/);
      await expect(row.locator("img")).toHaveAttribute("srcset", /720w/);
      await expect(row.locator("img")).toHaveAttribute("alt", /.+/);
    }
  });

  test("keeps the editorial gallery static and complete", async ({ page }) => {
    await page.goto("/negocios");

    const gallery = page.locator("[data-negocios-gallery]");
    await expect(gallery.locator("figure")).toHaveCount(4);
    await expect(gallery.locator("figcaption")).toHaveText([
      "Pedidos por volumen",
      "Presentación individual",
      "Detalles personalizados",
      "Listos para entregar",
    ]);
    await expect(gallery.locator("[data-carousel], [data-autoplay], button")).toHaveCount(0);

    for (const image of await gallery.locator("img").all()) {
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute("srcset", /720w/);
      await expect(image).toHaveAttribute("alt", /.+/);
    }
  });

  test("uses the two approved products and evidences all four process steps", async ({ page }) => {
    await page.goto("/negocios");

    await expect(page.locator(".negocios-product-block")).toHaveCount(2);
    await expect(page.locator(".negocios-product-block h3")).toHaveText(["Cheesecake", "Minidonas"]);
    await expect(page.locator(".negocios-products h2")).toHaveText("Cheesecake y minidonas para tu pedido");
    await expect(page.locator(".negocios-products .negocios-product-copy .n-eyebrow")).toHaveText([
      "Producto",
      "Producto",
    ]);
    await expect(page.locator(".negocios-products")).not.toContainText(/minitorta/i);
    await expect(page.locator(".negocios-step-media")).toHaveCount(4);
    await expect(page.locator(".negocios-step-media img")).toHaveCount(4);
    await expect(page.locator(".negocios-step-media figcaption")).toHaveText([
      "Opciones para definir",
      "Lote organizado",
      "Lotes preparados",
      "Presentación lista para coordinar",
    ]);

    for (const image of await page.locator(".negocios-step-media img").all()) {
      await expect(image).toHaveAttribute("srcset", /720w/);
      await expect(image).toHaveAttribute("alt", /.+/);
      await expect(image).toHaveAttribute("width", "1200");
      await expect(image).toHaveAttribute("height", "900");
    }
  });

  test("keeps the B2B page inside the viewport on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/negocios");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator(".negocios-hero-media")).toHaveAttribute("width", "1600");
    await expect(page.locator(".negocios-gallery-grid figure")).toHaveCount(4);
    await expect(page.locator(".negocios-step-media")).toHaveCount(4);
  });

  test("keeps process evidence frames consistent on desktop and mobile", async ({ page }) => {
    const frameSizes = async () =>
      page.locator(".negocios-step-media img").evaluateAll((images) =>
        images.map((image) => {
          const rect = image.getBoundingClientRect();
          return { width: Math.round(rect.width), height: Math.round(rect.height) };
        }),
      );

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/negocios");
    const desktop = await frameSizes();
    expect(desktop).toHaveLength(4);
    expect(new Set(desktop.map(({ width, height }) => `${width}x${height}`)).size).toBe(1);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    const mobile = await frameSizes();
    expect(mobile).toHaveLength(4);
    expect(new Set(mobile.map(({ width, height }) => `${width}x${height}`)).size).toBe(1);
  });

  test("loads every selected image with explicit dimensions", async ({ page }) => {
    await page.goto("/negocios");
    const images = page.locator(
      ".negocios-hero-media, [data-negocios-segment] img, [data-negocios-gallery] img, .negocios-product-block img, .negocios-step-media img",
    );
    const count = await images.count();
    expect(count).toBe(15);

    for (let i = 0; i < count; i++) {
      const image = images.nth(i);
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      await expect(image).toHaveAttribute("width", /\d+/);
      await expect(image).toHaveAttribute("height", /\d+/);
      await expect(image).toHaveAttribute("alt", /.+/);
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

  // Motion is two-tier: the hero runs an entrance timeline on load, everything
  // below the fold reveals on scroll. So "nothing stuck" is asserted twice —
  // above the fold without scrolling, and everywhere else after scrolling
  // through. Both matter: a visitor who never scrolls must still see the hero,
  // and a visitor who does must never hit an invisible section.
  test("standard motion: hero entrance settles without scrolling", async ({ page }) => {
    await page.goto("/negocios");
    await page.waitForTimeout(2200);

    const heroTargets = page.locator(".negocios-hero [data-negocios-anim]");
    const count = await heroTargets.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const opacity = await heroTargets.nth(i).evaluate((el) => window.getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
    }
  });

  test("standard motion: every scroll reveal settles with nothing stuck at opacity 0", async ({
    page,
  }) => {
    await page.goto("/negocios");

    // Walk down in steps so each trigger passes its start position, the way a
    // reader scrolls — a single jump to the bottom can skip triggers.
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await page.evaluate(
        ([step, total]) =>
          window.scrollTo(0, (document.body.scrollHeight / total) * step),
        [i, steps],
      );
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);

    const targets = page.locator("[data-negocios-anim], [data-negocios-segment]");
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const opacity = await targets.nth(i).evaluate((el) => window.getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
    }
  });
});

test.describe("Homepage hand-off to /negocios", () => {
  test("BusinessBridge primary CTA links to /negocios", async ({ page }) => {
    await page.goto("/");
    const bridge = page.locator("#negocios");
    const primaryCta = bridge.getByRole("link", { name: /para negocios|conoce|ver para negocios/i }).first();
    await expect(primaryCta).toHaveAttribute("href", "/negocios");
  });

  test("BusinessBridge still offers a secondary WhatsApp action", async ({ page }) => {
    await page.goto("/");
    const bridge = page.locator("#negocios");
    const secondaryCta = bridge.locator('a[href*="wa.me"]');
    await expect(secondaryCta).toHaveCount(1);
  });

  test("Hero desktop nav anchor navigates to /negocios", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const desktopNavLink = page.locator("nav .hidden.sm\\:flex a", { hasText: "Para negocios" });
    await expect(desktopNavLink).toHaveAttribute("href", "/negocios");
  });

  test("Hero mobile nav anchor navigates to /negocios", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const mobileNavLink = page.locator("[data-mobile-nav] a", { hasText: "Para negocios" });
    await expect(mobileNavLink).toHaveAttribute("href", "/negocios");
  });

  // The unit guards in tests/unit/business-segments.test.ts only scan the data
  // module. Everything written inline in negocios.astro — the H1, lead, proof
  // line, steps, product list, volume paragraph and closing CTA — had no
  // protection at all. These scan what the visitor actually receives, so both
  // sources of copy plus the structured data are covered.
  test.describe("rendered copy guards", () => {
    const VOSEO_PATTERN = /contás|querés|tenés|podés|hacé|escribinos|\bvos\b/i;
    // Currency can lead as well as trail the amount. Matching only the
    // trailing form let "Desde USD 25 por unidad" through a mutation check,
    // so both orders are covered here and in tests/unit/business-segments.test.ts.
    const PRICE_PATTERN =
      /\$\s?\d|\b\d+([.,]\d+)?\s?(usd|dólares|dolares|ctv\.?|centavos|\$)\b|\b(usd|dólares|dolares)\s?\d/i;

    test("renders no Rioplatense voseo anywhere on the page", async ({ page }) => {
      await page.goto("/negocios");
      const visibleText = await page.locator("body").innerText();
      expect(visibleText).not.toMatch(VOSEO_PATTERN);

      // WhatsApp prefilled messages never reach innerText — they live in hrefs.
      const waLinks = await page.locator('a[href*="wa.me"]').evaluateAll((els) =>
        els.map((el) => decodeURIComponent((el as HTMLAnchorElement).href)),
      );
      expect(waLinks.length).toBeGreaterThan(0);
      for (const href of waLinks) {
        expect(href).not.toMatch(VOSEO_PATTERN);
      }
    });

    test("renders no price figure on the page or in its structured data", async ({ page }) => {
      await page.goto("/negocios");
      const visibleText = await page.locator("body").innerText();
      expect(visibleText).not.toMatch(PRICE_PATTERN);

      const jsonLd = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((els) => els.map((el) => el.textContent ?? "").join("\n"));
      expect(jsonLd).not.toMatch(PRICE_PATTERN);
      expect(jsonLd).not.toContain('"offers"');
      expect(jsonLd).not.toContain('"price"');
    });
  });
});
