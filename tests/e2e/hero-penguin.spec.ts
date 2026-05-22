import { test, expect } from "@playwright/test";

test.describe("Hero penguin animation", () => {
  test("penguin sprite container is visible on the page", async ({ page }) => {
    await page.goto("/");
    const sprite = page.locator(".penguin-sprite");
    await expect(sprite).toBeVisible();
  });

  test("sprite has aria-hidden=\"true\" for accessibility", async ({ page }) => {
    await page.goto("/");
    const sprite = page.locator(".penguin-sprite");
    await expect(sprite).toHaveAttribute("aria-hidden", "true");
  });

  test("sprite background image loads without 404", async ({ page }) => {
    await page.goto("/");
    const sprite = page.locator(".penguin-sprite");
    // Check that the background-image URL resolves
    const bgImage = await sprite.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.backgroundImage;
    });
    expect(bgImage).toContain("penguin-sprite.png");

    // Verify the asset is reachable
    const response = await page.request.get("/penguin-sprite.png");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toContain("image/png");
  });

  test("animation respects prefers-reduced-motion", async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const sprite = page.locator(".penguin-sprite");
    await expect(sprite).toBeVisible();

    // Check that animation is paused (reduced motion)
    const animPlayState = await sprite.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.animationPlayState;
    });
    // 'paused' or 'idle' are acceptable
    expect(animPlayState).toBe("paused");

    // Background-position should be at frame 1 (0 0)
    const bgPos = await sprite.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.backgroundPosition;
    });
    expect(bgPos).toBe("0% 0%");
  });

  test("sprite has image-rendering: pixelated", async ({ page }) => {
    await page.goto("/");
    const sprite = page.locator(".penguin-sprite");
    const rendering = await sprite.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.imageRendering;
    });
    expect(rendering).toBe("pixelated");
  });

  test("CTA buttons remain keyboard-navigable", async ({ page }) => {
    await page.goto("/");
    // Focus the first CTA link
    const catalogLink = page.locator('a[href="#catalogo"]').first();
    await catalogLink.focus();
    await expect(catalogLink).toBeFocused();
  });

  test("penguin sprite has explicit dimensions (no layout shift)", async ({ page }) => {
    await page.goto("/");
    const sprite = page.locator(".penguin-sprite");
    const box = await sprite.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
