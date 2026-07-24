// Pure decision function for the E2E fixture gate.
//
// `[count].astro`'s `getStaticPaths()` calls this to decide which fixture
// paths to emit at build time. When `ENABLE_E2E_FIXTURES` is unset/empty
// (the production build config Cloudflare Pages runs), this returns `[]`
// so the static build emits NO fixture routes at all — they simply 404 in
// production, same guarantee the old runtime check provided. When set to
// `"true"` (only ever done by playwright.config.ts's webServer.env), it
// emits the exact counts the batch-reveal E2E suite exercises.
export interface FixturePath {
  params: { count: string };
}

const FIXTURE_COUNTS = [0, 1, 6];

export function fixturePathsFor(env: string | undefined): FixturePath[] {
  if (env !== "true") {
    return [];
  }

  return FIXTURE_COUNTS.map((count) => ({ params: { count: String(count) } }));
}
