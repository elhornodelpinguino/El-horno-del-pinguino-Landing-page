// Pure, injectable backend warm-up poller.
//
// The Render free-tier backend sleeps after idle and takes 30-60s to cold
// start, while the build-time catalog fetch in `src/lib/api.ts` only retries
// for ~1.5s — so scheduled rebuilds bake `fallback.json` instead of the real
// catalog. `scripts/warm-backend.mjs` calls this before `astro build` to poll
// `{baseUrl}/api/health` until the backend answers 200 or the wait budget
// runs out. All effects (fetch, sleep) are injected so the loop is fully
// deterministic under test. This function NEVER throws.

/**
 * @typedef {object} WaitForBackendOptions
 * @property {string} baseUrl Host-root backend URL (trailing slash tolerated).
 * @property {(url: string) => Promise<{ ok: boolean, status: number }>} fetchFn
 * @property {(ms: number) => Promise<void>} sleepFn
 * @property {number} maxWaitMs Total wait budget across all attempts.
 * @property {number} intervalMs Pause between attempts.
 * @property {(info: { attempt: number, elapsedMs: number, reason: string }) => void} [onAttempt]
 *   Invoked after each FAILED attempt, for progress logging.
 */

/**
 * @typedef {object} WaitForBackendResult
 * @property {boolean} ok True once the health endpoint answered 200.
 * @property {number} attempts Health requests issued.
 * @property {number} elapsedMs Wait time consumed by sleeps between attempts.
 */

/**
 * Polls `{baseUrl}/api/health` until it responds OK or `maxWaitMs` elapses.
 * Elapsed time is accounted from the injected sleeps (attempts at t=0,
 * intervalMs, 2*intervalMs, ...), which keeps the loop deterministic when
 * `sleepFn` is mocked.
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
  onAttempt,
}) {
  const healthUrl = `${baseUrl.replace(/\/$/, "")}/api/health`;
  let attempts = 0;
  let elapsedMs = 0;

  for (;;) {
    attempts += 1;
    let reason;
    try {
      const response = await fetchFn(healthUrl);
      if (response.ok) {
        return { ok: true, attempts, elapsedMs };
      }
      reason = `status ${response.status}`;
    } catch (error) {
      reason = error instanceof Error ? error.message : String(error);
    }

    onAttempt?.({ attempt: attempts, elapsedMs, reason });

    if (elapsedMs + intervalMs >= maxWaitMs) {
      return { ok: false, attempts, elapsedMs };
    }

    await sleepFn(intervalMs);
    elapsedMs += intervalMs;
  }
}
