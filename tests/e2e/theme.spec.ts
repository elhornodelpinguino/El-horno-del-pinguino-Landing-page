import { test, expect } from "@playwright/test";

// S3: follow the system, a sun/moon button switches it, and the choice is
// remembered. S4: no theme flash, so the theme is on <html> before the first
// paint rather than applied by a deferred module.

test.describe("theme", () => {
  test("follows the system preference on a first visit", async ({ browser }) => {
    for (const colorScheme of ["dark", "light"] as const) {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme);
      await context.close();
    }
  });

  test("applies the theme before first paint (no flash)", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    const page = await context.newPage();
    // Record the attribute as soon as <body> exists, before any module runs.
    await page.addInitScript(() => {
      document.addEventListener("readystatechange", () => {
        if (document.readyState === "interactive" && !("themeAtParse" in window)) {
          (window as unknown as { themeAtParse: string | undefined }).themeAtParse =
            document.documentElement.dataset.theme;
        }
      });
      new MutationObserver((_, observer) => {
        if (document.body) {
          (window as unknown as { themeAtBody: string | undefined }).themeAtBody =
            document.documentElement.dataset.theme;
          observer.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto("/");
    expect(await page.evaluate(() => (window as unknown as { themeAtBody?: string }).themeAtBody)).toBe("dark");
    await context.close();
  });

  test("the sun/moon button switches the theme and remembers it", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto("/");
    const toggle = page.locator("[data-theme-toggle]");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-label", "Activar modo oscuro");

    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveAttribute("aria-label", "Activar modo claro");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // The choice carries across pages.
    await page.goto("/negocios");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await context.close();
  });

  test("the toggle is reachable on mobile too", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");
    const toggle = page.locator("[data-theme-toggle]");
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await context.close();
  });
});
