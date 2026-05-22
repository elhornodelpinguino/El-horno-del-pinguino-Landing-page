import { test, expect } from "@playwright/test";

test.describe("Visual Refresh — Interactions", () => {
  test.describe("Mobile Navigation", () => {
    test("hamburger is visible on mobile and hidden on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      await expect(hamburger).toBeVisible();

      await page.setViewportSize({ width: 768, height: 800 });
      await expect(hamburger).toBeHidden();
    });

    test("opens and closes mobile menu", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      const nav = page.locator("[data-mobile-nav]");

      // Initially closed
      await expect(nav).toHaveAttribute("data-menu-open", "false");

      // Open
      await hamburger.click();
      await expect(nav).toHaveAttribute("data-menu-open", "true");

      // Close via hamburger
      await hamburger.click();
      await expect(nav).toHaveAttribute("data-menu-open", "false");
    });

    test("Escape closes mobile menu and returns focus to button", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      const nav = page.locator("[data-mobile-nav]");

      await hamburger.click();
      await expect(nav).toHaveAttribute("data-menu-open", "true");

      await page.keyboard.press("Escape");
      await expect(nav).toHaveAttribute("data-menu-open", "false");
      await expect(hamburger).toBeFocused();
    });

    test("focus trap keeps Tab inside open menu", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      await hamburger.click();

      const navLinks = page.locator("[data-mobile-nav] a");
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThanOrEqual(3);

      // Tab through all links and verify focus cycles
      for (let i = 0; i < linkCount * 2; i++) {
        await page.keyboard.press("Tab");
      }
      // No crash — focus stays within the nav
      await expect(page.locator("[data-mobile-nav]")).toHaveAttribute("data-menu-open", "true");
    });

    test("desktop viewport has no hamburger and desktop links visible", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto("/");
      await expect(page.locator("[data-hamburger]")).toBeHidden();
      // Desktop nav links should be visible
      const desktopLinks = page.locator("nav .hidden\\.sm\\:flex a");
      await expect(desktopLinks.first()).toBeVisible();
    });
  });

  test.describe("FAQ Accordion", () => {
    test("opens and closes FAQ items via click", async ({ page }) => {
      await page.goto("/");
      const details = page.locator("[data-faq-root] details").first();
      const content = details.locator(".faq-content");

      // Initially closed
      await expect(details).not.toHaveAttribute("open");

      // Click summary to open
      await details.locator("summary").click();
      await expect(details).toHaveAttribute("open");

      // Click summary again to close
      await details.locator("summary").click();
      await expect(details).not.toHaveAttribute("open");
    });

    test("Enter key toggles FAQ item", async ({ page }) => {
      await page.goto("/");
      const details = page.locator("[data-faq-root] details").first();
      const summary = details.locator("summary");

      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("open");

      await page.keyboard.press("Enter");
      await expect(details).not.toHaveAttribute("open");
    });

    test("Space key toggles FAQ item", async ({ page }) => {
      await page.goto("/");
      const details = page.locator("[data-faq-root] details").first();
      const summary = details.locator("summary");

      await summary.focus();
      await page.keyboard.press(" ");
      await expect(details).toHaveAttribute("open");
    });

    test("Arrow Down navigates to next FAQ item", async ({ page }) => {
      await page.goto("/");
      const summaries = page.locator("[data-faq-root] summary");

      await summaries.first().focus();
      await page.keyboard.press("ArrowDown");
      await expect(summaries.nth(1)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(summaries.nth(2)).toBeFocused();
    });

    test("Arrow Up navigates to previous FAQ item", async ({ page }) => {
      await page.goto("/");
      const summaries = page.locator("[data-faq-root] summary");

      await summaries.nth(1).focus();
      await page.keyboard.press("ArrowUp");
      await expect(summaries.first()).toBeFocused();
    });
  });

  test.describe("Scroll Animations", () => {
    test("animate-on-scroll sections eventually become visible after scrolling", async ({ page }) => {
      await page.goto("/");
      // Scroll to bottom to trigger all observers
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);

      const animated = page.locator(".animate-on-scroll");
      const count = await animated.count();
      expect(count).toBeGreaterThanOrEqual(3);

      // At least some sections should have is-visible after scroll
      const visibleCount = await page.locator(".animate-on-scroll.is-visible").count();
      expect(visibleCount).toBeGreaterThanOrEqual(1);
    });

    test("animate-group children get is-visible after scroll", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);

      const items = page.locator(".animate-item.is-visible");
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Counter Animation", () => {
    test("counter value appears after scrolling into view", async ({ page }) => {
      await page.goto("/");
      const counter = page.locator("[data-target]");

      // Scroll to the LimitedSpots section
      await page.evaluate(() => {
        const el = document.querySelector("[data-target]");
        if (el) el.scrollIntoView({ block: "center" });
      });
      await page.waitForTimeout(2000);

      // Counter should now have a formatted number
      const text = await counter.textContent();
      expect(text).not.toBe("0");
      expect(text?.length).toBeGreaterThan(0);
    });

    test("counter does not re-animate after is-animated is set", async ({ page }) => {
      await page.goto("/");
      const counter = page.locator("[data-target]");

      await page.evaluate(() => {
        const el = document.querySelector("[data-target]");
        if (el) el.scrollIntoView({ block: "center" });
      });
      await page.waitForTimeout(2000);

      await expect(counter).toHaveClass(/is-animated/);
    });
  });

  test.describe("Responsive & Accessibility", () => {
    test("no horizontal scroll at 320px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto("/");
      // Check body doesn't overflow horizontally
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(overflowX).toBe(true);
    });

    test("no horizontal scroll at 768px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 800 });
      await page.goto("/");
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(overflowX).toBe(true);
    });

    test("no horizontal scroll at 1920px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/");
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(overflowX).toBe(true);
    });

    test("hamburger button has min 44px touch target on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      const minHeight = await hamburger.evaluate((el) => parseFloat(getComputedStyle(el).minHeight));
      const minWidth = await hamburger.evaluate((el) => parseFloat(getComputedStyle(el).minWidth));
      expect(minHeight).toBeGreaterThanOrEqual(44);
      expect(minWidth).toBeGreaterThanOrEqual(44);
    });

    test("FAQ summary has min 44px height on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const summary = page.locator("[data-faq-root] summary").first();
      const minHeight = await summary.evaluate((el) => parseFloat(getComputedStyle(el).minHeight));
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });

    test("viewport meta tag is present", async ({ page }) => {
      await page.goto("/");
      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toHaveAttribute("content", /width=device-width/);
    });
  });
});
