import { test, expect, type Page } from "@playwright/test";

// The mobile sticky WhatsApp CTA only exists on the home page; the bottom
// space reserved for it must not leave an empty strip on other pages.
async function bodyPaddingBottom(page: Page): Promise<number> {
  return page.evaluate(() => parseFloat(window.getComputedStyle(document.body).paddingBottom));
}

test.describe("Mobile bottom space for the sticky WhatsApp CTA", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("home reserves room below the content for the sticky CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".sticky-whatsapp")).toHaveCount(1);
    expect(await bodyPaddingBottom(page)).toBeGreaterThanOrEqual(80);
  });

  for (const path of ["/negocios/", "/this-page-does-not-exist"]) {
    test(`${path} has no empty strip below the footer`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator(".sticky-whatsapp")).toHaveCount(0);
      expect(await bodyPaddingBottom(page)).toBe(0);
    });
  }
});
