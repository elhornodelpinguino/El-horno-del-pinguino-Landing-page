import { test, expect } from "@playwright/test";

// Every section carried symmetric padding (96–128px top *and* bottom), so two
// adjacent sections on the same surface stacked into a 192–256px void with no
// background change to justify it. A boundary needs one gap, not two.
//
// The rule this encodes: when consecutive sections share a background, their
// combined boundary gap must not exceed what a single section contributes.
// Sections that *do* change surface keep their full padding — there the space
// is doing visible work.
const MAX_SINGLE_GAP = 128;

const PAGES = ["/", "/negocios"];

for (const path of PAGES) {
  test(`adjacent same-surface sections do not stack their padding on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);

    const stacked = await page.evaluate((maxGap) => {
      const sections = [...document.querySelectorAll("section")];
      const offenders: string[] = [];

      const surfaceOf = (el: Element) => {
        const style = getComputedStyle(el);
        return `${style.backgroundColor}|${style.backgroundImage}`;
      };

      for (let i = 1; i < sections.length; i++) {
        const previous = sections[i - 1];
        const current = sections[i];
        if (surfaceOf(previous) !== surfaceOf(current)) continue;

        const gap =
          parseFloat(getComputedStyle(previous).paddingBottom) +
          parseFloat(getComputedStyle(current).paddingTop);

        if (gap > maxGap) {
          offenders.push(
            `${previous.className.slice(0, 24)} → ${current.className.slice(0, 24)}: ${Math.round(gap)}px`,
          );
        }
      }

      return offenders;
    }, MAX_SINGLE_GAP);

    expect(stacked).toEqual([]);
  });
}
