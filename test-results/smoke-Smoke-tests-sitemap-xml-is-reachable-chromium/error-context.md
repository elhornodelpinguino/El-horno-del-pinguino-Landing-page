# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke tests >> /sitemap.xml is reachable
- Location: tests/e2e/smoke.spec.ts:28:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 404
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Smoke tests", () => {
  4  |   test("index page loads with title and no console errors", async ({ page }) => {
  5  |     const errors: string[] = [];
  6  |     page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  7  |     const response = await page.goto("/");
  8  |     expect(response?.status()).toBe(200);
  9  |     await expect(page).toHaveTitle(/Horno del Pingüino/);
  10 |     expect(errors).toHaveLength(0);
  11 |   });
  12 | 
  13 |   test("product section is visible", async ({ page }) => {
  14 |     await page.goto("/");
  15 |     const productCards = page.locator("article");
  16 |     const emptyState = page.getByText("Estamos preparando nuevas creaciones");
  17 |     await expect(productCards.first().or(emptyState.first())).toBeVisible({ timeout: 10000 });
  18 |   });
  19 | 
  20 |   test("WhatsApp CTA link is valid", async ({ page }) => {
  21 |     await page.goto("/");
  22 |     const waLink = page.locator('a[href*="wa.me"]').first();
  23 |     await expect(waLink).toBeVisible();
  24 |     const href = await waLink.getAttribute("href");
  25 |     expect(href).toMatch(/^https:\/\/wa\.me\//);
  26 |   });
  27 | 
  28 |   test("/sitemap.xml is reachable", async ({ request }) => {
  29 |     const response = await request.get("/sitemap.xml");
> 30 |     expect(response.status()).toBe(200);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  31 |     expect(response.headers()["content-type"] ?? "").toContain("xml");
  32 |   });
  33 | });
  34 | 
```