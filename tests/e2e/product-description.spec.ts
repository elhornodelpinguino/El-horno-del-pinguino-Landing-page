import { test, expect } from "@playwright/test";

// The catalog fixture renders ProductGrid (and therefore ProductCard) against a
// deterministic product count, so these assertions never depend on whatever the
// live product-admin backend happens to be serving. See
// `src/pages/e2e-fixtures/catalog-batch/[count].astro` for why the fixture exists.
const FIXTURE = "/e2e-fixtures/catalog-batch/1";
const FIXTURE_DESCRIPTION = "Producto sintético usado solo por tests E2E.";

// The reveal contract is branched entirely on
// `@media (hover: hover) and (pointer: fine)`, so each half needs a context that
// actually reports those features. Verified empirically in Chromium:
// `hasTouch: true` flips them to `hover: none` / `pointer: coarse`, while the
// default context reports `hover: hover` / `pointer: fine`. CDP's
// `Emulation.setEmulatedMedia` does NOT move them — it silently accepts the
// `hover`/`pointer` features and leaves `matchMedia` reporting the defaults, so
// driving this branch through CDP produces tests that pass no matter what the
// CSS says. Do not "simplify" this back to emulateMedia/CDP.
const TOUCH_VIEWPORT = { width: 390, height: 844 };

test.describe("Product description", () => {
  test("is rendered in the card markup", async ({ page }) => {
    await page.goto(FIXTURE);

    const description = page.locator(".product-card-description");
    await expect(description).toHaveCount(1);
    await expect(description).toHaveText(FIXTURE_DESCRIPTION);
  });

  test.describe("on pointer devices", () => {
    test("stays hidden until hover", async ({ page }) => {
      await page.goto(FIXTURE);

      const description = page.locator(".product-card-description");
      await expect(description).toHaveCSS("opacity", "0");

      await page.locator(".product-card").hover();
      await expect(description).toHaveCSS("opacity", "1");
    });

    test("is revealed by keyboard focus, not only by the mouse", async ({ page }) => {
      await page.goto(FIXTURE);

      const description = page.locator(".product-card-description");
      await expect(description).toHaveCSS("opacity", "0");

      // WCAG 2.1 SC 2.1.1: content reachable by pointer must also be reachable
      // by keyboard. Focusing the card's "Pedir" link must trigger the reveal.
      await page.locator('.product-card a[href*="wa.me"]').focus();
      await expect(description).toHaveCSS("opacity", "1");
    });

    test("covers the image rather than growing the card body", async ({ page }) => {
      await page.goto(FIXTURE);

      const mediaBox = await page.locator(".product-card-media").boundingBox();
      const descriptionBox = await page.locator(".product-card-description").boundingBox();

      expect(mediaBox).not.toBeNull();
      expect(descriptionBox).not.toBeNull();
      // 2px absorbs sub-pixel layout rounding while staying discriminating:
      // the in-flow alternative would put the description ~300px lower.
      expect(Math.abs(descriptionBox!.y - mediaBox!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(descriptionBox!.height - mediaBox!.height)).toBeLessThanOrEqual(2);
    });
  });

  test.describe("on touch devices, which cannot hover", () => {
    test.use({ hasTouch: true, viewport: TOUCH_VIEWPORT });

    test("is visible without any interaction", async ({ page }) => {
      await page.goto(FIXTURE);

      const description = page.locator(".product-card-description");
      await expect(description).toBeVisible();
      await expect(description).toHaveCSS("opacity", "1");
    });

    test("sits below the image instead of covering it", async ({ page }) => {
      await page.goto(FIXTURE);

      // Discriminating check: the hover overlay is absolutely positioned ON the
      // media box, so asserting the description starts *after* the image ends
      // is what proves the touch branch — not the overlay branch — is active.
      const mediaBox = await page.locator(".product-card-media").boundingBox();
      const descriptionBox = await page.locator(".product-card-description").boundingBox();
      const priceBox = await page.locator(".product-card .text-2xl").boundingBox();

      expect(mediaBox).not.toBeNull();
      expect(descriptionBox).not.toBeNull();
      expect(priceBox).not.toBeNull();
      expect(descriptionBox!.y).toBeGreaterThanOrEqual(mediaBox!.y + mediaBox!.height - 1);
      expect(descriptionBox!.y + descriptionBox!.height).toBeLessThanOrEqual(priceBox!.y + 1);
    });
  });
});
