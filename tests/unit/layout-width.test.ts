import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

// `.section` is the one container every landing section shares. It used to cap
// content at max-w-6xl (1152px), which left most of a wide desktop screen as
// empty margin. The container widens with the viewport instead, so the change
// lands on every section at once rather than per component.
const css = readFileSync(path.resolve(__dirname, "../../src/styles/global.css"), "utf8");

function sectionRule(): string {
  const match = css.match(/\.section\s*\{([^}]*)\}/);
  if (!match) throw new Error(".section rule not found in global.css");
  return match[1];
}

describe("shared section container", () => {
  it("no longer caps content at the narrow 6xl width", () => {
    expect(sectionRule()).not.toMatch(/max-w-6xl/);
  });

  it("widens on large and extra-large screens", () => {
    const rule = sectionRule();
    expect(rule).toMatch(/max-w-7xl/);
    expect(rule).toMatch(/2xl:max-w-\[/);
  });

  it("keeps the mobile gutter", () => {
    expect(sectionRule()).toMatch(/\bpx-5\b/);
  });
});
