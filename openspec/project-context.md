# SDD Project Context — horno-landing

Last updated: 2026-07-05

## Project

- Product: El Horno del Pingüino landing page.
- Current intent for next planning work: build a separate owned backend/admin for El Horno del Pingüino instead of depending on the friend's external `product-admin` backend.
- Current frontend repository: `horno-landing`.
- Artifact store for SDD: OpenSpec files under `openspec/`.
- Review budget: 400 changed lines per review slice.
- Delivery strategy: ask on risk / auto forecast.

## Current Stack

- Runtime: Node.js >= 20, npm >= 10, `packageManager: npm@10.7.0`.
- Framework: Astro 4.16 with SSR enabled via `@astrojs/node` standalone adapter.
- Styling: Tailwind CSS 3.4.
- Language: TypeScript 6.0.3 with `astro/tsconfigs/strict`.
- Module system: ESM (`type: module`).
- Deployment shape: Docker multi-stage build and Render config are present.

## App Structure

- `src/pages/` — Astro pages.
- `src/layouts/` — page layouts.
- `src/components/` — UI components.
- `src/lib/api.ts` — public data API client, retry logic, fallback loading, price formatting.
- `src/data/fallback.json` — static fallback data used when the public backend is unreachable.
- `src/scripts/` — browser scripts for navigation and UI interactions.
- `tests/unit/` — Vitest unit tests.
- `tests/e2e/` — Playwright E2E tests.

## Current External Backend Coupling

The landing currently reads public organization/product data from:

- Default API base URL: `https://product-admin-backend-vfyy.onrender.com/api`
- Organization external ID: `horno-del-pinguino-92f9`
- Environment variables:
  - `PUBLIC_API_BASE_URL`
  - `PUBLIC_ORG_EXTERNAL_ID`
  - `PUBLIC_WHATSAPP_NUMBER`
  - `PUBLIC_INSTAGRAM_HANDLE`

Important current behavior:

- `src/lib/api.ts` fetches `/public/organizations` and `/public/organizations/{orgId}/products`.
- Products are filtered to active products.
- `loadFallback()` returns `src/data/fallback.json` when the backend is unreachable.
- `displayProductName()` compensates for an upstream typo (`Chesscake` → `Cheesecake`), which is evidence of current external-backend leakage into frontend behavior.

## Testing and Validation

Available scripts:

- Unit tests: `npm test` or `npm run test` → `vitest run`.
- Watch tests: `npm run test:watch` → `vitest`.
- E2E tests: `npm run test:e2e` → `playwright test`.
- Build: `npm run build` → `astro build`.
- Preview: `npm run preview` → `astro preview`.
- Audit: `npm run audit` → `npm audit`.

CI currently runs:

1. `npm ci`
2. `npm audit --audit-level moderate`
3. `npm test`
4. `npm run build`
5. `npx playwright install --with-deps chromium`
6. `npm run test:e2e`

Strict TDD mode is available for future behavior changes because the repository has Vitest unit tests and Playwright E2E coverage. Future apply/verify phases should treat `npm test` as the fast red/green loop and run `npm run build && npm run test:e2e` before closing user-visible flows.

## SDD Rules for Future Backend/Admin Planning

- Do not implement backend code during planning phases.
- Keep technical artifacts in English.
- Preserve the current landing behavior while replacing external ownership boundaries deliberately.
- Prefer clean architecture boundaries: domain/application/infrastructure separation for backend planning, explicit DTO contracts for frontend integration, and no leaked upstream quirks.
- Backend/admin planning must include migration strategy from the current external public API and fallback data.
- Include rollback or coexistence strategy whenever changing frontend data source behavior.
- Keep PR/review slices below the 400-line budget unless an explicit exception is recorded.
