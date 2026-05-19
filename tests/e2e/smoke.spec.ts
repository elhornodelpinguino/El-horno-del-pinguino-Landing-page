import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
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
    const emptyState = page.getByText("Estamos preparando nuevas creaciones");
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
