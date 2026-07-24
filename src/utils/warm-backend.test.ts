import { describe, expect, it, vi } from "vitest";

import { waitForBackend } from "./warm-backend.mjs";

const okResponse = { ok: true, status: 200 };
const errorResponse = { ok: false, status: 503 };

function noopSleep(): Promise<void> {
  return Promise.resolve();
}

describe("waitForBackend", () => {
  it("succeeds on the first attempt without sleeping", async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse);
    const sleepFn = vi.fn(noopSleep);

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn,
      maxWaitMs: 120_000,
      intervalMs: 5_000,
    });

    expect(result).toEqual({ ok: true, attempts: 1, elapsedMs: 0 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith("http://localhost:3005/api/health");
    expect(sleepFn).not.toHaveBeenCalled();
  });

  it("normalizes a trailing slash in the base URL", async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse);

    await waitForBackend({
      baseUrl: "http://localhost:3005/",
      fetchFn,
      sleepFn: noopSleep,
      maxWaitMs: 10_000,
      intervalMs: 5_000,
    });

    expect(fetchFn).toHaveBeenCalledWith("http://localhost:3005/api/health");
  });

  it("keeps polling through failures until the backend responds 200", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(okResponse);
    const sleepFn = vi.fn(noopSleep);

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn,
      maxWaitMs: 120_000,
      intervalMs: 5_000,
    });

    expect(result).toEqual({ ok: true, attempts: 3, elapsedMs: 10_000 });
    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenNthCalledWith(1, 5_000);
    expect(sleepFn).toHaveBeenNthCalledWith(2, 5_000);
  });

  it("gives up once the wait budget is exhausted instead of throwing", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const sleepFn = vi.fn(noopSleep);

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn,
      maxWaitMs: 20_000,
      intervalMs: 5_000,
    });

    // Attempts at t=0, 5s, 10s, 15s; the next slot (20s) would meet the
    // budget, so polling stops after the fourth attempt.
    expect(result).toEqual({ ok: false, attempts: 4, elapsedMs: 15_000 });
    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(sleepFn).toHaveBeenCalledTimes(3);
  });

  it("never throws even when fetchFn throws synchronously", async () => {
    const fetchFn = vi.fn(() => {
      throw new Error("boom");
    });

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: noopSleep,
      maxWaitMs: 5_000,
      intervalMs: 5_000,
    });

    expect(result).toEqual({ ok: false, attempts: 1, elapsedMs: 0 });
  });

  it("reports progress through onAttempt for each failed attempt", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(okResponse);
    const onAttempt = vi.fn();

    await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: noopSleep,
      maxWaitMs: 120_000,
      intervalMs: 5_000,
      onAttempt,
    });

    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(onAttempt).toHaveBeenCalledWith({
      attempt: 1,
      elapsedMs: 0,
      reason: "status 503",
    });
  });
});
