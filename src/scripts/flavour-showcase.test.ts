import { describe, expect, it } from "vitest";

import { getCoverflowPosition, moveIndex, normalizeIndex } from "./flavour-showcase.js";

describe("flavour coverflow state", () => {
  it("starts at the first flavour with one active center and two lateral positions", () => {
    expect(normalizeIndex(0, 3)).toBe(0);
    expect(getCoverflowPosition(0, 0, 3)).toBe("active");
    expect(getCoverflowPosition(1, 0, 3)).toBe("next");
    expect(getCoverflowPosition(2, 0, 3)).toBe("previous");
  });

  it("moves next and previous through both circular boundaries", () => {
    expect(moveIndex(0, 1, 3)).toBe(1);
    expect(moveIndex(2, 1, 3)).toBe(0);
    expect(moveIndex(0, -1, 3)).toBe(2);
    expect(moveIndex(2, -1, 3)).toBe(1);
  });
});
