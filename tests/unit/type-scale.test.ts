import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

// The audit found 14 distinct rendered font sizes on the homepage and 11 on
// /negocios, including pairs nobody can tell apart (18px next to 18.4px,
// 40px next to 41.6px). The cause was two competing scales: Tailwind's steps
// in the markup, and ad-hoc rem values invented per component in global.css.
//
// One scale now lives in `:root` as `--type-*` custom properties. Every
// fixed font-size in the stylesheet must reference it. Two escape hatches
// stay legal because they are different mechanisms, not scale drift:
//   - `clamp()` — deliberate fluid type for display headings
//   - `em`      — deliberate sizing relative to the parent
const CSS_PATH = path.resolve(__dirname, "../../src/styles/global.css");

/** The single source of truth. Steps are ~1.25 apart from `base` upward. */
const EXPECTED_STEPS = [
  "--type-2xs",
  "--type-xs",
  "--type-sm",
  "--type-base",
  "--type-lg",
  "--type-xl",
  "--type-2xl",
  "--type-3xl",
] as const;

function stylesheet(): string {
  return readFileSync(CSS_PATH, "utf8");
}

describe("type scale tokens", () => {
  it("declares every step exactly once in :root", () => {
    const css = stylesheet();

    for (const step of EXPECTED_STEPS) {
      const declarations = css.match(new RegExp(`${step}:\\s*[^;]+;`, "g")) ?? [];
      expect(declarations, `${step} should be declared exactly once`).toHaveLength(1);
    }
  });

  it("has no two steps resolving to the same size", () => {
    const css = stylesheet();
    const sizes = EXPECTED_STEPS.map((step) => {
      const match = css.match(new RegExp(`${step}:\\s*([^;]+);`));
      return match?.[1].trim();
    });

    expect(new Set(sizes).size).toBe(EXPECTED_STEPS.length);
  });
});

describe("global.css font sizes", () => {
  it("never hard-codes a size outside the scale", () => {
    const offenders: string[] = [];

    stylesheet()
      .split("\n")
      .forEach((line, index) => {
        const match = line.match(/font-size:\s*([^;]+);/);
        if (!match) return;

        const value = match[1].trim();
        const isToken = value.startsWith("var(--type-");
        const isFluid = value.startsWith("clamp(");
        const isRelative = /^[\d.]+em$/.test(value);

        // `:root` declares the scale itself, so its own values are the source.
        const isScaleDeclaration = line.includes("--type-");

        if (!isToken && !isFluid && !isRelative && !isScaleDeclaration) {
          offenders.push(`global.css:${index + 1} → ${value}`);
        }
      });

    expect(offenders).toEqual([]);
  });
});
