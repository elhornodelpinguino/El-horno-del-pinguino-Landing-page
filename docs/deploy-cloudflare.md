# Deploying to Cloudflare Pages

This project builds to a fully static site (`output: "static"` in
`astro.config.mjs`). There is no Node server runtime in production — Cloudflare
Pages serves the prebuilt `dist/` directory.

## Project setup (Cloudflare dashboard)

1. **Workers & Pages → Create → Pages → Connect to Git** and select this
   repository.
2. **Framework preset**: Astro (or "None" + the manual settings below).
3. **Build settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (repo root)
4. **Environment variables** (Settings → Environment variables → Production):
   - `NODE_VERSION` = `22.23.2` — Astro 7.3 requires Node 22.19.0 or newer. The Tailwind 4 Vite plugin runs as part of the Astro build and requires no separate production runtime.
   - `PUBLIC_API_BASE_URL` = `https://horno-product-admin.onrender.com`
    - `PUBLIC_WHATSAPP_NUMBER` = `593994808252`
    - `PUBLIC_INSTAGRAM_HANDLE` = `elhornodelpinguino`
    - `PUBLIC_TIKTOK_HANDLE` = `elhornodelpinguino`
    - `PUBLIC_ANALYTICS_PROVIDER` = `goatcounter`
    - `PUBLIC_ANALYTICS_ENDPOINT` = `https://<site-code>.goatcounter.com/count`

    These `PUBLIC_*` vars are inlined at build time by Astro/Vite — they must
    be set before every build, not just once at runtime.

## Privacy-safe analytics activation

Analytics is inert when either analytics variable is absent or invalid. To
activate the free GoatCounter integration:

1. Create or select the GoatCounter site and copy its `/count` tracking-pixel
   endpoint.
2. Set `PUBLIC_ANALYTICS_PROVIDER=goatcounter` and the HTTPS
   `PUBLIC_ANALYTICS_ENDPOINT` in the Cloudflare Pages Production environment.
3. Trigger a new deployment so Astro inlines the configuration into the two
   measured routes (`/` and `/negocios`).
4. Inspect one page view and one WhatsApp conversion in the browser network
   trace before treating the dashboard as production-ready.

The site does not load GoatCounter's `count.js`. Each request is a controlled
`/count` pixel containing only `p` (the allowlisted route or conversion
context) and, for conversions, `e=1`. It does not send query strings,
fragments, titles, referrers, screen dimensions, phone numbers, WhatsApp
message text, user identifiers, or arbitrary event fields. The pixel is sent
with `referrerPolicy=no-referrer`, and a blocked endpoint never delays page
rendering or WhatsApp navigation.

To disable analytics, remove both public analytics variables and redeploy. The
build remains successful and the visitor-facing site continues to work without
analytics requests.

## Backend warm-up before build

The backend runs on Render's free tier, which puts the service to sleep after
idle; a cold start takes 30-60s, far longer than the catalog fetch's ~1.5s
retry window. Since most builds are triggered by the daily rebuild cron (when
the backend is usually asleep), builds would routinely bake the fallback
catalog instead of live data.

To prevent this, the npm `prebuild` script (`scripts/warm-backend.mjs`, run
automatically by `npm run build`) polls `PUBLIC_API_BASE_URL/api/health` every
5s for up to 120s before `astro build` starts. Expect the Cloudflare Pages
build log to show `[warm-backend]` progress lines waiting out the cold start.
If `PUBLIC_API_BASE_URL` is unset (local/e2e builds) the warm-up is skipped
instantly, and if the backend never wakes the script logs a warning and exits
0 — the fallback path below remains the safety net either way.

## Build resilience

The build fetches the product catalog from `PUBLIC_API_BASE_URL` while
prerendering `/`. If the backend is unreachable or returns a malformed
response, the build does **not** fail: it logs the error, falls back to the
bundled fixture data (`src/lib/api.ts`'s `loadFallback()`), and completes with
exit code 0. Check the Cloudflare Pages build log if the deployed landing
page shows fallback products instead of live ones.

## Rebuilding on catalog changes (deploy hooks)

Because the site is static, admin changes (new products, banners, FAQs,
toggling a product active) do **not** appear on the live site until the site
is rebuilt. Two mechanisms trigger a rebuild:

1. **On-demand**, from the product-admin backend, via a fire-and-forget POST
   to a Cloudflare Pages deploy hook after every catalog mutation (see the
   backend's `catalog-rebuild-trigger` change).
2. **Daily fallback cron**, via
   [`.github/workflows/rebuild.yml`](../.github/workflows/rebuild.yml), in
   case an on-demand hook was missed (e.g. the backend process restarted
   mid-fetch).

### Creating the deploy hook

1. In the Cloudflare Pages project: **Settings → Builds & deployments →
   Deploy hooks**.
2. Create a hook named e.g. `catalog-rebuild`, targeting the `main`
   production branch.
3. Copy the generated hook URL (`https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/...`).
4. Add it as a GitHub Actions secret on **this** repository, named
   `CF_DEPLOY_HOOK_URL` (Settings → Secrets and variables → Actions →
   New repository secret). `rebuild.yml` reads it from `secrets`.
5. Add the same URL as `DEPLOY_HOOK_URL` on the **backend** repository's
   environment (see the backend's own deploy docs) so mutations trigger an
   immediate rebuild in addition to the daily cron.

### Banner / time-window caveat

Any content that depends on a time window (e.g. a promotional banner's
start/end dates) only becomes visible or hidden on the next successful
rebuild — the static site does not re-evaluate dates client-side. If a
banner needs to appear or disappear at an exact time, trigger a manual
deploy hook rebuild (or run the `rebuild.yml` workflow via
`workflow_dispatch`) around that time instead of relying solely on the daily
cron.

## Rollback

- Landing: revert this change (`output: 'server'` + restore the Node
  adapter + `render.yaml`) to go back to the Render deployment.
- No data migration is involved; rollback is a pure code revert.
