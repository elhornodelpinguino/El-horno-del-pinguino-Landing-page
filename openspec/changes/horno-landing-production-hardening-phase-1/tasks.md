# Tasks: Horno Landing — Production Hardening Phase 1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~340 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units (single PR)

| Unit | Goal | ~Lines | Dependencies |
|------|------|--------|-------------|
| A | Foundation — configs + deps | ~40 | None |
| B | API retry + fallback dataset | ~80 | A (package.json) |
| C | SEO — sitemap, robots, OG, JSON-LD | ~80 | A (sitemap dep) |
| D | ErrorBoundary component | ~40 | B (fallback types) |
| E | CI/CD workflow | ~50 | A (tools installed) |
| F | Tests — Vitest + Playwright | ~100 | B, C (code exists) |

## Phase 1: Foundation

- [x] 1.1 Add `@astrojs/sitemap`, `vitest`, `@playwright/test`, `@astrojs/check` to devDeps + `test`/`test:e2e` scripts in `package.json`; run `npm install` — `[package.json]`
- [x] 1.2 Create `vitest.config.ts` — include `src/**/*.test.ts`, resolve `~` alias — `[vitest.config.ts]`
- [x] 1.3 Create `playwright.config.ts` — base URL `http://localhost:4321`, Chromium only, `retries: 2` — `[playwright.config.ts]`
- [x] 1.4 Create `vercel.json` — immutable `Cache-Control: public, max-age=31536000, immutable` for `/_astro/**` — `[vercel.json]`

## Phase 2: Build Resilience

- [x] 2.1 Add `withRetry<T>(fn, opts?)` with exponential backoff (500→1000→2000ms) and `loadFallback()` to `src/lib/api.ts` — `[src/lib/api.ts]`
- [x] 2.2 Create `src/data/fallback.json` — snapshot of org + products arrays from live API — `[src/data/fallback.json]`
- [x] 2.3 Update `src/pages/index.astro` — catch API errors, load fallback, log build warning — `[src/pages/index.astro]`

## Phase 3: SEO Foundation

- [x] 3.1 Register `@astrojs/sitemap` in `astro.config.mjs` — `[astro.config.mjs]`
- [x] 3.2 Create `public/robots.txt` — `Allow: /`, point `Sitemap:` to production URL — `[public/robots.txt]`
- [x] 3.3 Extend `BaseLayout.astro` — add `canonicalUrl`, `ogImage`, `jsonLd` props; output `<link rel="canonical">`, OG tags, twitter:card, JSON-LD `<script>` — `[src/layouts/BaseLayout.astro]`
- [x] 3.4 Wire `index.astro` — pass `title`, `description`, `jsonLd` (Organization + Product) to BaseLayout — `[src/pages/index.astro]`

## Phase 4: Error Boundary

- [x] 4.1 Create `ErrorBoundary.astro` — `hasError: boolean`, `message?: string` props; renders brand-colored fallback with WhatsApp CTA when hasError — `[src/components/ErrorBoundary.astro]`
- [x] 4.2 Wrap Hero and ProductGrid sections in `index.astro` with ErrorBoundary — `[src/pages/index.astro]`

## Phase 5: CI/CD

- [x] 5.1 Create `.github/workflows/ci.yml` — `npm ci` → `npm test` → `astro build` → `npx playwright test` on PR/push to main — `[.github/workflows/ci.yml]`
- [x] 5.2 Add CI badge to `README.md` pointing to workflow — `[README.md]`

## Phase 6: Testing

- [x] 6.1 Write `tests/unit/api.test.ts` — `formatPrice` (whole, decimal, zero, negative, large), `withRetry` (2nd-attempt success, all 3 fail) — `[tests/unit/api.test.ts]`
- [x] 6.2 Write `tests/unit/config.test.ts` — `whatsappLink` encodes text correctly, handles special chars — `[tests/unit/config.test.ts]`
- [x] 6.3 Write `tests/e2e/smoke.spec.ts` — page loads (200, title, no console errors), product cards visible, WhatsApp href starts with `https://wa.me/`, `/sitemap.xml` reachable — `[tests/e2e/smoke.spec.ts]`

---

## Task Dependency Graph

```
1.1 (deps)
  ├── 1.2 (vitest config)
  │     └── 6.1, 6.2 (unit tests)
  ├── 1.3 (playwright config)
  │     └── 6.3 (e2e tests)
  ├── 1.4 (vercel.json) — no downstream deps
  ├── 2.1 (api retry)
  │     ├── 2.2 (fallback.json)
  │     └── 2.3 (index.astro fallback)
  │           ├── 4.2 (ErrorBoundary wiring)
  │           └── 3.4 (SEO wiring)
  ├── 3.1 (sitemap)
  │     └── 3.2 (robots.txt)
  ├── 3.3 (BaseLayout SEO)
  │     └── 3.4 (index.astro SEO → same file as 2.3)
  ├── 4.1 (ErrorBoundary)
  │     └── 4.2 (wrap sections)
  ├── 5.1 (CI workflow)
  │     └── 5.2 (badge)
  └── 6.1, 6.2, 6.3 (tests — last, need code deployed)
```

## Risk Assessment

| Task | Risk | Why |
|------|------|-----|
| 2.2 | Low-Medium | Needs manual API snapshot — stale data if schema changes before deploy |
| 3.4/4.2 | Medium | `index.astro` touched by 3 tasks (2.3, 3.4, 4.2) — merge conflict possible |
| 6.1 | Low | Pure functions + mocks, no DOM |
| 6.3 | Low-Medium | Depends on `astro dev` running — CI handles this |
| 5.1 | Low | Standard GH Actions pattern |

## Total Line Estimate

| Phase | Lines |
|-------|-------|
| Foundation | ~40 |
| Build Resilience | ~60 |
| SEO | ~70 |
| Error Boundary | ~40 |
| CI/CD | ~50 |
| Testing | ~80 |
| **Total** | **~340** |

Within 400-line budget. Single PR.
