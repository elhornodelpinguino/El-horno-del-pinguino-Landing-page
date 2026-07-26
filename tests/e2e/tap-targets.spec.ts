import { test, expect } from "@playwright/test";

// WCAG 2.1 SC 2.5.8 Target Size (Minimum), AA: 24x24 CSS px. The mobile nav
// already clears the stricter 44px recommendation; the desktop pill did not —
// its links measured 20px tall and it is shown from the `sm` breakpoint up,
// which includes touch tablets, not just mice.
const AA_MINIMUM = 24;

/** Viewports where the desktop nav pill is the visible navigation. */
const WIDE_VIEWPORTS = [
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const viewport of WIDE_VIEWPORTS) {
  test(`nav links meet the minimum target size on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const navLinks = page.locator("nav a[href]:visible");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    const undersized: string[] = [];
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      if (!box) continue;
      if (box.height < AA_MINIMUM || box.width < AA_MINIMUM) {
        const label = (await link.textContent())?.trim() || (await link.getAttribute("href")) || "?";
        undersized.push(`${label} (${Math.round(box.width)}x${Math.round(box.height)})`);
      }
    }

    expect(undersized).toEqual([]);
  });
}

test("contact links meet the minimum target size", async ({ page }) => {
  await page.goto("/");

  // SC 2.5.8 exempts targets "in a sentence or [whose] size is otherwise
  const contactLinks = page.locator(
    'a[href^="tel:"]:visible, a[href*="instagram.com"]:visible, a[href*="wa.me"]:visible',
  );
  const count = await contactLinks.count();
  expect(count).toBeGreaterThan(0);

  const undersized: string[] = [];
  for (let i = 0; i < count; i++) {
    const link = contactLinks.nth(i);
    const box = await link.boundingBox();
    if (!box) continue;
    const label = (await link.textContent())?.trim() || "?";
    if (box.height < AA_MINIMUM) {
      undersized.push(`${label} (${Math.round(box.width)}x${Math.round(box.height)})`);
    }
  }

  expect(undersized).toEqual([]);
});
