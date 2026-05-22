import { describe, it, expect } from "vitest";
import { easeOut, formatCounter } from "../../src/scripts/counter-animation.js";

describe("easeOut", () => {
  it("returns 0 at t=0", () => {
    expect(easeOut(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeOut(1)).toBe(1);
  });

  it("returns 0.488 at t=0.2 (midpoint ease-out curve)", () => {
    // 1 - (1 - 0.2)^3 = 1 - 0.8^3 = 1 - 0.512 = 0.488
    expect(easeOut(0.2)).toBeCloseTo(0.488, 3);
  });

  it("returns 0.784 at t=0.4", () => {
    // 1 - (1 - 0.4)^3 = 1 - 0.6^3 = 1 - 0.216 = 0.784
    expect(easeOut(0.4)).toBeCloseTo(0.784, 3);
  });

  it("returns 0.875 at t=0.5", () => {
    // 1 - (1 - 0.5)^3 = 1 - 0.5^3 = 1 - 0.125 = 0.875
    expect(easeOut(0.5)).toBeCloseTo(0.875, 3);
  });

  it("handles values above 1 (clamped by caller)", () => {
    // Even if caller sends >1, the formula still produces a value
    expect(easeOut(2)).toBe(1 - Math.pow(-1, 3)); // = 2
  });
});

describe("formatCounter", () => {
  it("formats a whole number with es-EC locale (dot separator)", () => {
    const result = formatCounter(1500);
    expect(result).toContain(".");
    expect(result).not.toContain(",");
  });

  it("formats zero", () => {
    expect(formatCounter(0)).toBe("0");
  });

  it("formats a small number without separators", () => {
    expect(formatCounter(5)).toBe("5");
  });

  it("formats a large number with thousand separators", () => {
    const result = formatCounter(15000);
    // es-EC uses . for thousands
    expect(result).toBe("15.000");
  });

  it("formats numbers under 1000 without separators", () => {
    expect(formatCounter(999)).toBe("999");
  });
});
