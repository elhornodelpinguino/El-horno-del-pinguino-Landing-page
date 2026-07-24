// Warms up the Render free-tier backend before `astro build` (wired as the
// npm `prebuild` script). Render's free tier sleeps after idle and cold
// starts take 30-60s, while the build-time catalog fetch only retries for
// ~1.5s — without this warm-up, scheduled rebuilds bake fallback.json.
//
// This script ALWAYS exits 0: a failed warm-up must not fail the build,
// because the fallback catalog path is still the safety net.
import { waitForBackend } from "../src/utils/warm-backend.mjs";

const MAX_WAIT_MS = 120_000;
const INTERVAL_MS = 5_000;

const baseUrl = process.env.PUBLIC_API_BASE_URL?.trim();

if (!baseUrl) {
  console.log("[warm-backend] no backend configured, skipping warm-up");
  process.exit(0);
}

console.log(
  `[warm-backend] waiting for ${baseUrl}/api/health (max ${MAX_WAIT_MS / 1000}s, every ${INTERVAL_MS / 1000}s)...`,
);

const startedAt = Date.now();
const result = await waitForBackend({
  baseUrl,
  fetchFn: fetch,
  sleepFn: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxWaitMs: MAX_WAIT_MS,
  intervalMs: INTERVAL_MS,
  onAttempt: ({ attempt, reason }) => {
    console.log(
      `[warm-backend] attempt ${attempt} failed (${reason}), backend likely cold-starting...`,
    );
  },
});
const realElapsedS = Math.round((Date.now() - startedAt) / 1000);

if (result.ok) {
  console.log(
    `[warm-backend] backend is up after ${result.attempts} attempt(s) in ~${realElapsedS}s`,
  );
} else {
  console.warn(
    `[warm-backend] WARNING: backend did not respond within ${MAX_WAIT_MS / 1000}s ` +
      `(${result.attempts} attempts). The build will continue and may bake the ` +
      `fallback catalog instead of live data.`,
  );
}

process.exit(0);
