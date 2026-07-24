// Testable body of `scripts/warm-backend.mjs` (the npm `prebuild` step).
// Lives in src/utils so vitest covers it; the script in scripts/ stays a
// two-line shim. This function NEVER rejects: any unexpected exception is
// logged as a warning and swallowed, because a failed warm-up must not fail
// the build — the fallback catalog path is still the safety net.
import { waitForBackend } from "./warm-backend.mjs";

export const MAX_WAIT_MS = 120_000;
export const INTERVAL_MS = 5_000;
export const ATTEMPT_TIMEOUT_MS = 10_000;

/**
 * @param {object} [deps] Injectable dependencies (defaults are production).
 * @param {Record<string, string | undefined>} [deps.env]
 * @param {(message: string) => void} [deps.log]
 * @param {(message: string) => void} [deps.warn]
 * @param {typeof waitForBackend} [deps.waitFn]
 * @param {typeof fetch} [deps.fetchImpl]
 * @returns {Promise<void>} Always resolves.
 */
export async function runWarmBackendCli({
  env = process.env,
  log = console.log,
  warn = console.warn,
  waitFn = waitForBackend,
  fetchImpl = globalThis.fetch,
} = {}) {
  try {
    const baseUrl = env.PUBLIC_API_BASE_URL?.trim();
    if (!baseUrl) {
      log("[warm-backend] no backend configured, skipping warm-up");
      return;
    }

    log(
      `[warm-backend] waiting for ${baseUrl}/api/health (max ${MAX_WAIT_MS / 1000}s, every ${INTERVAL_MS / 1000}s)...`,
    );

    const startedAt = Date.now();
    const result = await waitFn({
      baseUrl,
      // Abort each real request after the per-attempt timeout so a hung
      // socket can never stall the build past the maxWaitMs budget.
      fetchFn: (url, { timeoutMs }) =>
        fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) }),
      sleepFn: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      maxWaitMs: MAX_WAIT_MS,
      intervalMs: INTERVAL_MS,
      attemptTimeoutMs: ATTEMPT_TIMEOUT_MS,
      onAttempt: ({ attempt, reason }) => {
        log(
          `[warm-backend] attempt ${attempt} failed (${reason}), backend likely cold-starting...`,
        );
      },
    });
    const realElapsedS = Math.round((Date.now() - startedAt) / 1000);

    if (result.ok) {
      log(
        `[warm-backend] backend is up after ${result.attempts} attempt(s) in ~${realElapsedS}s`,
      );
    } else {
      warn(
        `[warm-backend] WARNING: backend did not respond within ${MAX_WAIT_MS / 1000}s ` +
          `(${result.attempts} attempts). The build will continue and may bake the ` +
          `fallback catalog instead of live data.`,
      );
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    warn(
      `[warm-backend] WARNING: warm-up crashed unexpectedly (${reason}). ` +
        `The build will continue.`,
    );
  }
}
