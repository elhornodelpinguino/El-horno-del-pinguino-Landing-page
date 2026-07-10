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

  // Kept as its own test (separate from "animation respects
  // prefers-reduced-motion" above) so this assertion gets genuine runtime
  // proof independent of that test's pre-existing, unrelated bgPos-format
  // failure — Playwright aborts a test body on its first failed expect, so a
  // shared test would mask this one forever regardless of whether the code
  // under test is correct.
  test("no penguin ScrollTrigger is created under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const sprite = page.locator(".penguin-sprite");
    await expect(sprite).toBeVisible();

    // No penguin ScrollTrigger was created under reduced motion — scrolling
    // through the hero range must not translate the sprite at all.
    const transformBefore = await sprite.evaluate((el) => window.getComputedStyle(el).transform);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);
    const transformAfter = await sprite.evaluate((el) => window.getComputedStyle(el).transform);
    expect(transformAfter).toBe(transformBefore);
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

  test("penguin sprite parallaxes at a different rate than the card", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForTimeout(300);

    const sprite = page.locator(".penguin-sprite");
    const card = page.locator(".hero-card");

    // Scroll partway through the .hero-shell trigger range (top top -> bottom
    // top) so both scrub tweens are mid-progress.
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);

    const spriteTransform = await sprite.evaluate((el) => window.getComputedStyle(el).transform);
    const cardTransform = await card.evaluate((el) => window.getComputedStyle(el).transform);

    // Both must have moved (non-identity matrix) and diverge from each
    // other — proves an independent scrub rate, not a shared/no-op tween.
    expect(spriteTransform).not.toBe("none");
    expect(spriteTransform).not.toBe(cardTransform);
  });
});
