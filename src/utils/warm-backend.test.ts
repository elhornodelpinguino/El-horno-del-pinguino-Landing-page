import { describe, expect, it, vi } from "vitest";

import { waitForBackend } from "./warm-backend.mjs";

const okResponse = { ok: true, status: 200 };
const errorResponse = { ok: false, status: 503 };

/** Deterministic fake clock: sleeps advance it, slow fetches can too. */
function fakeClock() {
  let now = 0;
  return {
    nowFn: () => now,
    advance: (ms: number) => {
      now += ms;
    },
    sleepFn: vi.fn((ms: number) => {
      now += ms;
      return Promise.resolve();
    }),
  };
}

describe("waitForBackend", () => {
  it("succeeds on the first attempt without sleeping", async () => {
    const clock = fakeClock();
    const fetchFn = vi.fn().mockResolvedValue(okResponse);

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: clock.sleepFn,
      nowFn: clock.nowFn,
      maxWaitMs: 120_000,
      intervalMs: 5_000,
    });

    expect(result).toEqual({ ok: true, attempts: 1, elapsedMs: 0 });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith("http://localhost:3005/api/health", {
      timeoutMs: 10_000,
    });
    expect(clock.sleepFn).not.toHaveBeenCalled();
  });

  it("normalizes a trailing slash and forwards a custom attempt timeout", async () => {
    const clock = fakeClock();
    const fetchFn = vi.fn().mockResolvedValue(okResponse);

    await waitForBackend({
      baseUrl: "http://localhost:3005/",
      fetchFn,
      sleepFn: clock.sleepFn,
      nowFn: clock.nowFn,
      maxWaitMs: 10_000,
      intervalMs: 5_000,
      attemptTimeoutMs: 3_000,
    });

    expect(fetchFn).toHaveBeenCalledWith("http://localhost:3005/api/health", {
      timeoutMs: 3_000,
    });
  });

  it("keeps polling through failures until the backend responds 200", async () => {
    const clock = fakeClock();
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(okResponse);

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: clock.sleepFn,
      nowFn: clock.nowFn,
      maxWaitMs: 120_000,
      intervalMs: 5_000,
    });

    expect(result).toEqual({ ok: true, attempts: 3, elapsedMs: 10_000 });
    expect(clock.sleepFn).toHaveBeenCalledTimes(2);
    expect(clock.sleepFn).toHaveBeenNthCalledWith(1, 5_000);
    expect(clock.sleepFn).toHaveBeenNthCalledWith(2, 5_000);
  });

  it("gives up once the wall-clock budget is exhausted instead of throwing", async () => {
    const clock = fakeClock();
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: clock.sleepFn,
      nowFn: clock.nowFn,
      maxWaitMs: 20_000,
      intervalMs: 5_000,
    });

    // Attempts at t=0, 5s, 10s, 15s; the next slot (20s) would meet the
    // budget, so polling stops after the fourth attempt.
    expect(result).toEqual({ ok: false, attempts: 4, elapsedMs: 15_000 });
    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(clock.sleepFn).toHaveBeenCalledTimes(3);
  });

  it("counts slow fetch attempts against the wall-clock budget", async () => {
    const clock = fakeClock();
    // Each attempt consumes 40s of wall clock before failing.
    const fetchFn = vi.fn(() => {
      clock.advance(40_000);
      return Promise.reject(new Error("socket hang up"));
    });

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: clock.sleepFn,
      nowFn: clock.nowFn,
      maxWaitMs: 60_000,
      intervalMs: 5_000,
    });

    // t=0 attempt consumes 40s, sleep to 45s, second attempt runs the clock
    // to 85s — past the 60s budget, so the loop exits after only 2 attempts
    // instead of the 12 a sleep-only accounting would have allowed.
    expect(result).toEqual({ ok: false, attempts: 2, elapsedMs: 85_000 });
    expect(clock.sleepFn).toHaveBeenCalledTimes(1);
  });

  it("never throws even when fetchFn throws synchronously", async () => {
    const clock = fakeClock();
    const fetchFn = vi.fn(() => {
      throw new Error("boom");
    });

    const result = await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: clock.sleepFn,
      nowFn: clock.nowFn,
      maxWaitMs: 5_000,
      intervalMs: 5_000,
    });

    expect(result).toEqual({ ok: false, attempts: 1, elapsedMs: 0 });
  });

  it("reports progress through onAttempt for each failed attempt", async () => {
    const clock = fakeClock();
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(okResponse);
    const onAttempt = vi.fn();

    await waitForBackend({
      baseUrl: "http://localhost:3005",
      fetchFn,
      sleepFn: clock.sleepFn,
      nowFn: clock.nowFn,
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
