# Tasks: GSAP Storytelling Components (Fase 2)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 230-280 (confirms design estimate) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk (default; no override received) |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 4 storytelling behaviors + E2E contracts | PR 1 | Single PR; `git revert` restores Fase-1 entrance behavior |

## Phase 1: E2E Contracts (RED)

- [x] 1.1 `tests/e2e/visual-refresh.spec.ts`: pin+scrub test — scroll `.order-section` into range, assert it stays pinned mid-scroll then unpins with no pin-spacing gap after the full range.
- [x] 1.2 Same file: mobile pin-trap guard — 375px viewport, scroll through the order section, assert bounded scroll distance to unpin.
- [x] 1.3 Same file: clip-path scrub test — `getComputedStyle(card).clipPath` differs before vs mid-scroll of `.final-cta`.
- [x] 1.4 Same file: catalog batch reveal — extend existing entrance assertion with N=1 and N=0 fixtures (route-mock or fallback-data slicing), assert card visibility and zero console errors. Resolved via a dedicated E2E-only fixture route (see 4.3 note) since SSR fetch blocks route-mocking.
- [x] 1.5 Same file: Trust checklist — assert each `[data-trust-anim='check']` visible after settle, alongside existing item assertion.
- [x] 1.6 Same file: extend reduced-motion test — assert no pin, clip-path scrub, or `batch()` created across all four sections.
- [x] 1.7 Run `npm run test:e2e`; confirm 1.1-1.6 fail (RED) before implementing. Confirmed: 5/8 new tests failed pre-implementation (pin, clip-path, batch row-differentiation, Trust checks, reduced-motion sprite guard). 3/8 passed trivially as structural invariants (mobile no-pin, N=0/N=1 fixture edge cases) — documented as guard tests in apply-progress.

## Phase 2: HowToOrder Pin+Scrub (GREEN)

- [x] 2.1 `src/components/HowToOrder.astro`: add `data-order-anim="sprite"` to each step's `.pixel-scene` wrapper.
- [x] 2.2 `src/scripts/order-animation.js`: evaluate `window.matchMedia("(min-width:768px)")` once; if false, keep Fase-1 entrance stagger unchanged.
- [x] 2.3 Same file: if ≥768px and not reduced-motion, `gsap.set(steps,{opacity:.4,scale:.96})` then build pinned timeline (`start:"top top"`, `end:"+=150%"`, `scrub:true`, `pin:true`, `anticipatePin:1`) with labels `step0/step1/step2` and `snap:{snapTo:"labelsDirectional",duration:.25}`.
- [x] 2.4 Run `npm run test:e2e`; confirm 1.1/1.2 pass; tune `end` value per Open Questions. `end:"+=150%"` confirmed — see design.md Open Questions.

## Phase 3: FinalCTA Clip-Path Scrub (GREEN)

- [x] 3.1 `src/scripts/final-cta-animation.js`: gate on `CSS.supports("clip-path","polygon(0 0,100% 0)")`.
- [x] 3.2 Same file: add second `ScrollTrigger` scrubbing `gsap.fromTo(card,{clipPath: wavyPolygon},{clipPath: fullPolygon, scrollTrigger:{trigger:section,scrub:true}})`, both 8-vertex polygons, skipped if unsupported or reduced-motion.
- [x] 3.3 Run `npm run test:e2e`; confirm 1.3 passes.

## Phase 4: Catalog ScrollTrigger.batch() (GREEN)

- [x] 4.1 `src/scripts/catalog-animation.js`: remove `tl.from(cards,{stagger})` card beat; keep the `else if (empty)` entrance branch untouched.
- [x] 4.2 Same file: add `gsap.set(cards,{opacity:0,y:28})` then `ScrollTrigger.batch(cards,{start:"top 85%",interval:.1,batchMax:3,onEnter:...})` inside the non-reduced branch, guarded by `cards.length`.
- [x] 4.3 `tests/e2e/visual-refresh.spec.ts`: wire the N=0/1/3+ fixture mechanism from 1.4. **Resolved**: confirmed during apply that `page.route()` cannot intercept the SSR-side `fetch()` in `src/pages/index.astro` (product count is baked into the server response before the browser sees a request). Added a test-only fixture route `src/pages/e2e-fixtures/catalog-batch.astro` (`?count=N` query param) that renders the real `ProductGrid` component with synthetic products, reusing the exact same `catalog-animation.js` wiring as production. Disallowed in `public/robots.txt`. This is a deviation from the two options design.md listed (route-mock / fallback-data-slice) — neither was viable given the SSR constraint — documented as a new but minimal-footprint test harness.
- [x] 4.4 Run `npm run test:e2e`; confirm 1.4 passes for all three counts. Also strengthened the N>batchMax test to assert row-by-row reveal (opacity differs between an in-view row and an off-screen row) since the original assertion didn't discriminate old single-timeline stagger from `batch()` — see apply-progress for detail.

## Phase 5: Trust Checklist Stagger (GREEN)

- [x] 5.1 `src/components/Trust.astro`: add `data-trust-anim="item"` to the 4 receipt `<li>` and `data-trust-anim="check"` to their `<span>✓</span>`.
- [x] 5.2 `src/scripts/trust-animation.js`: append `.from(items,{x:-12,opacity:0,stagger:.08})` then `.from(checks,{scale:0,rotate:-45,opacity:0,stagger:.1,ease:"back.out(2)"},"-=.3")`.
- [x] 5.3 Run `npm run test:e2e`; confirm 1.5 passes.

## Phase 6: Verify & Cleanup

- [x] 6.1 Run reduced-motion suite (1.6) across all four sections; confirm no pin/scrub/batch and zero console errors. Passed (2/2 reduced-motion tests, existing + new).
- [x] 6.2 Run `npm run build`; confirm render smoke passes with no clip-path/pin regressions. Passed, no build errors.
- [x] 6.3 Run full `npm run test && npm run test:e2e`; update design's Open Questions checkboxes with the tuned `end` value and snap decision. Unit: 28/28 passed. E2E (`visual-refresh.spec.ts`): 34/34 passed. One pre-existing failure in `hero-penguin.spec.ts` (`animation respects prefers-reduced-motion` — `backgroundPosition` format mismatch `"0px 0px"` vs `"0% 0%"`) confirmed present on unmodified `main` before this change (out of scope, unrelated file).

## Phase 7: Corrective Pass — R3 Reliability Findings (post-apply review)

A fresh-context R3 Reliability review (`review-ledger.md`) found 4 CRITICAL issues in the Phase 1-6 implementation. This phase resolves them without redoing working parts.

- [x] 7.1 (R3-001) `src/scripts/catalog-animation.js`: wrap `gsap.set(cards,...)` + `ScrollTrigger.batch()` construction in try/catch; on catch, `gsap.set(cards, {clearProps:"all"})` so a thrown exception between hide and wire restores full visibility instead of leaving cards stuck at `opacity:0`. Added E2E test that forces the exact failure window via a scoped `getBoundingClientRect` override and asserts cards settle at `opacity:1`. RED confirmed against pre-fix code (stuck at `opacity:0`), GREEN after fix.
- [x] 7.2 (R3-002) `src/scripts/order-animation.js`: same try/catch pattern around `gsap.set(steps,{opacity:.4,scale:.96})` + pinned `stepTl` construction; catch restores via `clearProps`. Corrected the adjacent comment, which incorrectly claimed the pre-catch state was "fully visible" (it was 40% opacity, not full visibility). Added E2E test forcing the failure via a scoped `getComputedStyle` override on `.order-section`; RED confirmed (stuck at `opacity:0.4`), GREEN after fix.
- [x] 7.3 (R3-003) Confirmed no code change needed: the R3-002 fail-safe removes the "stuck invisible/dimmed" outcome for the stale `matchMedia("(min-width:768px)")` branch after a resize. The remaining tradeoff (no live re-evaluation on resize) is the one design.md already accepted as out of scope for this change (`ScrollTrigger.matchMedia()` refactor deferred). No `resize`/`change` listener added — would expand scope beyond what's needed to close the CRITICAL finding.
- [x] 7.4 (R3-004) `src/pages/e2e-fixtures/catalog-batch.astro`: added a hard runtime guard — the route returns `404` unless `process.env.ENABLE_E2E_FIXTURES === "true"`. That var is set only in `playwright.config.ts`'s `webServer.env`, never in `render.yaml`'s production deploy. Verified `import.meta.env.PROD` would NOT have worked as a guard here (CI runs `npm run build` + `npm run preview` for E2E too, so `PROD` is `true` in both the real deploy and the E2E run — confirmed empirically). Verified via manual `curl`: 404 without the var, 200 with it, real `/` route unaffected either way. Full E2E suite re-run green with Playwright's own webServer (36/36 in `visual-refresh.spec.ts`).
- [x] 7.5 (R3-005, cheap fix) `tests/e2e/visual-refresh.spec.ts`: replaced fixed `waitForTimeout` + snapshot reads with auto-retrying `expect(locator).toHaveCSS(...)` in the N>batchMax test and the two new fail-safe tests, keeping one deliberate `waitForTimeout` where a genuine mid-scrub snapshot (not a "wait until" condition) is required.
- [x] 7.6 (R3-007, cheap fix) Retargeted the reduced-motion test's sprite assertion to `[data-order-anim='step']` (an element the entrance timeline actually hides/clears), since `[data-order-anim='sprite']` was never touched by either timeline and proved nothing about reduced-motion gating.
- [x] 7.7 (R3-008, cheap fix) Corrected the N>batchMax test comment: `ScrollTrigger.batch()` groups by scroll-entry timing/`interval`, not by CSS grid row layout — the grid's row count only happens to align with `batchMax` for a readable test.
- [x] 7.8 Re-ran full suite: `npm run test` (28/28 unit), `npx playwright test tests/e2e/visual-refresh.spec.ts` (36/36), `npm run build` (clean), `npx playwright test` full suite (46 passed, 1 pre-existing unrelated failure in `hero-penguin.spec.ts`, confirmed identical on unmodified `main` via `git stash`).
