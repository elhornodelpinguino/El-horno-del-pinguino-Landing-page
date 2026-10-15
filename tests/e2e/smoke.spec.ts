import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  // FAQ copy comes from the admin at build time (fallback copy is pinned in
  // tests/unit/site-content.test.ts), so this checks structure, not wording.
  test("FAQ renders every question with a non-empty answer", async ({ page }) => {
    await page.goto("/");
    const items = page.locator("[data-faq-root] .faq-item");
    await expect(items.first()).toBeVisible();
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i).locator(".faq-summary")).not.toBeEmpty();
      await expect(items.nth(i).locator(".faq-answer")).not.toHaveText(/^\s*$/);
    }
  });

  test("index page loads with title and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Horno del Pingüino/);
    expect(errors).toHaveLength(0);
  });

  test("product section is visible", async ({ page }) => {
    await page.goto("/");
    const productCards = page.locator("article");
    const emptyState = page.getByText("Estamos horneando el catálogo");
    await expect(productCards.first().or(emptyState.first())).toBeVisible({ timeout: 10000 });
  });

  test("WhatsApp CTA link is valid", async ({ page }) => {
    await page.goto("/");
    const waLink = page.locator('a[href*="wa.me"]').first();
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\//);
  });

  test("/sitemap-index.xml is reachable", async ({ request }) => {
    const response = await request.get("/sitemap-index.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toContain("xml");
  });
});
