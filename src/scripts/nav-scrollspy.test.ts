import { describe, it, expect } from "vitest";

import { activeSection } from "./nav-scrollspy.js";

const sections = (tops: number[]) => tops.map((top, i) => ({ id: `s${i}`, top }));

describe("activeSection", () => {
  it("returns null while still above the first section (the hero)", () => {
    expect(activeSection(sections([500, 1500, 2500]), 300, false)).toBeNull();
  });

  it("picks the last section whose top has crossed the reading line", () => {
    expect(activeSection(sections([-900, 120, 1100]), 300, false)).toBe("s1");
    expect(activeSection(sections([-2000, -900, 300]), 300, false)).toBe("s2");
  });

  it("keeps the previous section until the next one reaches the line", () => {
    expect(activeSection(sections([-900, 301, 1300]), 300, false)).toBe("s0");
  });

  it("forces the last section at the bottom of the page, even if it is too short to reach the line", () => {
    expect(activeSection(sections([-2000, -900, 600]), 300, true)).toBe("s2");
  });

  it("returns null for an empty list", () => {
    expect(activeSection([], 300, true)).toBeNull();
  });
});
