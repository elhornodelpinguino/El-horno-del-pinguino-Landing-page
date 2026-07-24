// Pure, injectable backend warm-up poller.
//
// The Render free-tier backend sleeps after idle and takes 30-60s to cold
// start, while the build-time catalog fetch in `src/lib/api.ts` only retries
// for ~1.5s — so scheduled rebuilds bake `fallback.json` instead of the real
// catalog. `scripts/warm-backend.mjs` calls this before `astro build` to poll
// `{baseUrl}/api/health` until the backend answers 200 or the wait budget
// runs out. All effects (fetch, sleep, clock) are injected so the loop is
// fully deterministic under test. This function NEVER throws.

/**
 * @typedef {object} WaitForBackendOptions
 * @property {string} baseUrl Host-root backend URL (trailing slash tolerated).
 * @property {(url: string, init: { timeoutMs: number }) => Promise<{ ok: boolean, status: number }>} fetchFn
 *   Receives the per-attempt timeout so real implementations can abort hung
 *   requests (e.g. via `AbortSignal.timeout`).
 * @property {(ms: number) => Promise<void>} sleepFn
 * @property {number} maxWaitMs Total wall-clock wait budget across all attempts.
 * @property {number} intervalMs Pause between attempts.
 * @property {number} [attemptTimeoutMs] Per-attempt fetch timeout hint
 *   forwarded to `fetchFn` (default 10_000).
 * @property {() => number} [nowFn] Clock used for wall-clock accounting
 *   (default `Date.now`).
 * @property {(info: { attempt: number, elapsedMs: number, reason: string }) => void} [onAttempt]
 *   Invoked after each FAILED attempt, for progress logging.
 */

/**
 * @typedef {object} WaitForBackendResult
 * @property {boolean} ok True once the health endpoint answered 200.
 * @property {number} attempts Health requests issued.
 * @property {number} elapsedMs Wall-clock time consumed, per `nowFn`.
 */

/**
 * Polls `{baseUrl}/api/health` until it responds OK or the wall-clock budget
 * (`maxWaitMs`, measured with `nowFn`) is exhausted — slow attempts count
 * against the budget too, so total wall-clock time stays bounded even when
 * individual requests hang.
 *
 * @param {WaitForBackendOptions} options
 * @returns {Promise<WaitForBackendResult>}
 */
export async function waitForBackend({
  baseUrl,
  fetchFn,
  sleepFn,
  maxWaitMs,
  intervalMs,
  attemptTimeoutMs = 10_000,
  nowFn = Date.now,
  onAttempt,
}) {
  const healthUrl = `${baseUrl.replace(/\/$/, "")}/api/health`;
  const startedAt = nowFn();
  let attempts = 0;

  for (;;) {
    attempts += 1;
    let reason;
    try {
      const response = await fetchFn(healthUrl, { timeoutMs: attemptTimeoutMs });
      if (response.ok) {
        return { ok: true, attempts, elapsedMs: nowFn() - startedAt };
      }
      reason = `status ${response.status}`;
    } catch (error) {
      reason = error instanceof Error ? error.message : String(error);
    }

    const elapsedMs = nowFn() - startedAt;
    onAttempt?.({ attempt: attempts, elapsedMs, reason });

    if (elapsedMs + intervalMs >= maxWaitMs) {
      return { ok: false, attempts, elapsedMs };
    }

    await sleepFn(intervalMs);
  }
}
