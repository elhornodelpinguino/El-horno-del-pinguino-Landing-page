import { describe, it, expect, vi } from "vitest";
import { formatPrice, withRetry, ApiError } from "../../src/lib/api";

describe("formatPrice", () => {
  it("formats whole number", () => {
    expect(formatPrice(1500)).toContain("1.500");
  });
  it("formats decimal", () => {
    expect(formatPrice(9.99)).toContain(",");
  });
  it("handles zero", () => {
    expect(formatPrice(0)).toContain("$");
  });
  it("handles negative", () => {
    expect(formatPrice(-5)).toContain("$");
  });
  it("handles large number", () => {
    expect(formatPrice(999999.99)).toContain("999");
  });
});

describe("withRetry", () => {
  it("throws ApiError after all retries exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 10 })).rejects.toThrow(ApiError);
    expect(fn).toHaveBeenCalledTimes(3);
  });
  it("returns on second attempt", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce("ok");
    const result = await withRetry(fn, { attempts: 3, baseDelayMs: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it("returns on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("instant");
    expect(await withRetry(fn, { attempts: 3, baseDelayMs: 10 })).toBe("instant");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
