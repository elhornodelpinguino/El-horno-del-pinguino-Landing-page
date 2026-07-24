// Warms up the Render free-tier backend before `astro build` (wired as the
// npm `prebuild` script). Render's free tier sleeps after idle and cold
// starts take 30-60s, while the build-time catalog fetch only retries for
// ~1.5s — without this warm-up, scheduled rebuilds bake fallback.json.
//
// This script ALWAYS exits 0: a failed warm-up must not fail the build,
// because the fallback catalog path is still the safety net. The testable
// body lives in src/utils/warm-backend-cli.mjs (covered by vitest) and never
// rejects, but the catch below guards even an import-time surprise.
try {
  const { runWarmBackendCli } = await import("../src/utils/warm-backend-cli.mjs");
  await runWarmBackendCli();
} catch (error) {
  console.warn(
    `[warm-backend] WARNING: warm-up crashed unexpectedly (${error?.message ?? error}). ` +
      `The build will continue.`,
  );
}
process.exit(0);
