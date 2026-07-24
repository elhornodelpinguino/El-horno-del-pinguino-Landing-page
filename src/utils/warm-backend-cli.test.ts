import { describe, expect, it, vi } from "vitest";

import { runWarmBackendCli } from "./warm-backend-cli.mjs";

describe("runWarmBackendCli", () => {
  it("skips instantly when PUBLIC_API_BASE_URL is unset or blank", async () => {
    for (const env of [{}, { PUBLIC_API_BASE_URL: "" }, { PUBLIC_API_BASE_URL: "   " }]) {
      const log = vi.fn();
      const waitFn = vi.fn();

      await runWarmBackendCli({ env, log, warn: vi.fn(), waitFn });

      expect(log).toHaveBeenCalledWith(
        "[warm-backend] no backend configured, skipping warm-up",
      );
      expect(waitFn).not.toHaveBeenCalled();
    }
  });

  it("polls with the production budget and logs success", async () => {
    const log = vi.fn();
    const waitFn = vi
      .fn()
      .mockResolvedValue({ ok: true, attempts: 3, elapsedMs: 10_000 });

    await runWarmBackendCli({
      env: { PUBLIC_API_BASE_URL: "http://localhost:3005" },
      log,
      warn: vi.fn(),
      waitFn,
    });

    expect(waitFn).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "http://localhost:3005",
        maxWaitMs: 120_000,
        intervalMs: 5_000,
        attemptTimeoutMs: 10_000,
      }),
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("backend is up after 3 attempt(s)"),
    );
  });

  it("aborts each real fetch attempt with the per-attempt timeout", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const waitFn = vi.fn(async (options: any) => {
      await options.fetchFn("http://localhost:3005/api/health", {
        timeoutMs: 10_000,
      });
      return { ok: true, attempts: 1, elapsedMs: 0 };
    });

    await runWarmBackendCli({
      env: { PUBLIC_API_BASE_URL: "http://localhost:3005" },
      log: vi.fn(),
      warn: vi.fn(),
      waitFn,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3005/api/health",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("warns loudly but resolves when the warm-up times out", async () => {
    const warn = vi.fn();
    const waitFn = vi
      .fn()
      .mockResolvedValue({ ok: false, attempts: 24, elapsedMs: 115_000 });

    await runWarmBackendCli({
      env: { PUBLIC_API_BASE_URL: "http://localhost:3005" },
      log: vi.fn(),
      warn,
      waitFn,
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("WARNING"));
  });

  it("catches unexpected exceptions, warns, and still resolves", async () => {
    const warn = vi.fn();
    const waitFn = vi.fn().mockRejectedValue(new Error("totally unexpected"));

    await expect(
      runWarmBackendCli({
        env: { PUBLIC_API_BASE_URL: "http://localhost:3005" },
        log: vi.fn(),
        warn,
        waitFn,
      }),
    ).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("totally unexpected"),
    );
  });
});
