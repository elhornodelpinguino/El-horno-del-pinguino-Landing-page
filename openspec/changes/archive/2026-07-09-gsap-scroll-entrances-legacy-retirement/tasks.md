# Tasks: GSAP Scroll Entrances + Legacy Reveal Retirement

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~210-240 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full change (E2E contract + ScrollTrigger wiring + FAQ/Contact migration + legacy retirement) | PR 1 | Single PR; base `main`; ~210-240 lines, well under 400-line budget — no split triggered |

## Phase 1: E2E Contract (RED)

- [x] 1.1 In `tests/e2e/visual-refresh.spec.ts`, replace `"legacy IO sections still become visible after scrolling"` with a test asserting zero `.animate-on-scroll` elements exist anywhere in the DOM (repo-wide all-GSAP contract).
- [x] 1.2 Extend `"GSAP entrance sections are visible after settling"` to also assert `[data-faq-anim='item']` and `[data-contact-anim='column']` are visible post-settle.
- [x] 1.3 Extend `"reduced motion shows visible final state with no console errors"` to also assert `[data-faq-anim='item']` and `[data-contact-anim='column']` are visible.
- [x] 1.4 Run `npm run test:e2e` — confirm the new/changed assertions fail (RED) since FAQ/Contact still use the legacy system and `.animate-on-scroll` still exists.

## Phase 2: ScrollTrigger on Existing Entrance Timelines

- [x] 2.1 `src/scripts/catalog-animation.js`: add `scrollTrigger: { trigger: section, start: "top 78%" }` to the entrance `gsap.timeline({...})` config.
- [x] 2.2 `src/scripts/business-animation.js`: same, `start: "top 78%"`.
- [x] 2.3 `src/scripts/trust-animation.js`: same, `start: "top 78%"`.
- [x] 2.4 `src/scripts/order-animation.js`: add `scrollTrigger: { trigger: section, start: "top 78%" }` to the entrance `tl` at line 22 only — leave the two `bubble1`/`bubble2` scrub `ScrollTrigger.create` calls (lines 29-46) untouched.
- [x] 2.5 `src/scripts/final-cta-animation.js`: add `scrollTrigger: { trigger: section, start: "top 85%" }` to the entrance timeline.

## Phase 3: FAQ and Contact GSAP Migration

- [x] 3.1 Create `src/scripts/faq-animation.js` following `trust-animation.js`'s shape: `registerPlugin`, `querySelector('.faq-section')` + null guard, reduced-motion branch first (`clearProps: "all"`), else `gsap.timeline({ defaults: {...}, scrollTrigger: { trigger: section, start: "top 78%" } })` with `.from()` on `[data-faq-anim='intro']` then staggered `[data-faq-anim='item']`.
- [x] 3.2 Create `src/scripts/contact-animation.js` following the same shape: `querySelector('#contacto')` + null guard, `scrollTrigger: { trigger: section, start: "top 85%" }`, staggered `.from()` on `[data-contact-anim='column']` then `[data-contact-anim='bar']`.
- [x] 3.3 In `src/components/FAQ.astro`: remove `animate-on-scroll` class(es), add `data-faq-anim="intro"` to the intro card and `data-faq-anim="item"` to each of the 6 `details.faq-item`, import `faq-animation.js` in the component's `<script>` block.
- [x] 3.4 In `src/components/Contact.astro`: remove `animate-on-scroll` class(es), add `data-contact-anim="column"` to the 3 footer columns and `data-contact-anim="bar"` to the bottom bar, import `contact-animation.js` in the component's `<script>` block.

## Phase 4: Legacy System Retirement

- [x] 4.1 Delete `src/scripts/scroll-animations.js`.
- [x] 4.2 In `src/pages/index.astro`, remove the legacy import `import "~/scripts/scroll-animations.js";` (line 95).
- [x] 4.3 In `src/styles/global.css`, remove the legacy `.animate-on-scroll`/`.is-visible`/`.animate-group`/`.animate-item` CSS blocks (verified actual lines 106-133) and the matching reduced-motion overrides (verified actual lines 285-294); kept the `.penguin-sprite` reduced-motion rule intact.
- [x] 4.4 In `src/components/LimitedSpots.astro`, strip `animate-on-scroll` class usage.
- [x] 4.5 In `src/components/SpecialEditions.astro`, strip `animate-on-scroll`/`animate-group`/`animate-item` classes and `style="--i"` attributes.
- [x] 4.6 In `src/components/backup/LimitedSpots.astro` and `src/components/backup/SpecialEditions.astro`, strip the same legacy classes/`--i` styles so none remain repo-wide.

Out of scope (confirmed by design): leftover `--i` custom props on already-migrated sections (ProductGrid, HowToOrder, BusinessUseCases, Trust) are dead-but-harmless once the legacy CSS rule is removed; left untouched to keep the diff scoped.

## Phase 5: Verification (GREEN)

- [x] 5.1 Run `npm run test` — confirm existing unit suites stay green (no unit logic changed). Result: 28/28 passed.
- [x] 5.2 Run `npm run build` — smoke-check that stripping legacy classes from unused `LimitedSpots`/`SpecialEditions` (incl. `backup/`) doesn't break rendering. Result: build succeeded.
- [x] 5.3 Run `npm run test:e2e` — confirm all Phase 1 assertions now pass (GREEN), including the no-`.animate-on-scroll` check and FAQ/Contact GSAP visibility. Result: all Phase 1 assertions pass; 33/34 e2e tests pass overall (1 pre-existing unrelated failure in `hero-penguin.spec.ts` reduced-motion background-position format, confirmed present on unmodified `main` via stash — not caused by this change, `hero-animation.js` untouched per constraint).
- [x] 5.4 Manually confirm via the reduced-motion E2E pass that Hero, catalog, business, trust, order, final-cta, FAQ, and Contact are all fully visible immediately with no console errors. Result: `"reduced motion shows visible final state with no console errors"` passes, asserting Hero/business/trust/FAQ/contact targets visible with zero console errors.

## Phase 6: Review Corrections (fresh-context R3 Reliability + R4 Resilience review)

Corrective pass fixing findings from `openspec/changes/gsap-scroll-entrances-legacy-retirement/review-ledger.md`. Strict TDD followed for the production fix (RED test written and confirmed failing before the code change).

- [x] 6.1 (R4-001, CRITICAL) `src/scripts/contact-animation.js`: change `ScrollTrigger` `start` from `"top 85%"` to `"top bottom"` — Contact is the true page-terminus element, and `top 85%` requires the footer to be >= 15% of viewport height to ever cross the trigger at max scroll, permanently stranding content at `opacity:0` on tall viewports (violates the "fail open" contract). `top bottom` is geometrically guaranteed to fire for any visible element regardless of footer/viewport height. `final-cta` intentionally left untouched (`top 85%`) — confirmed not the page terminus.
- [x] 6.2 Updated `design.md`'s "start value per section" decision table: added a dedicated `contact` row recording the `top bottom` correction with rationale, and clarified `final-cta` is not the page terminus.
- [x] 6.3 (R3-001 BLOCKER + R3-003 CRITICAL) `tests/e2e/visual-refresh.spec.ts`: added `"GSAP entrance targets are hidden before scroll and revealed after scrolling (computed style)"` — asserts computed `opacity` is not `'1'` pre-scroll and is `'1'` post-scroll for `[data-catalog-anim='heading']`, `[data-faq-anim='intro']`, `[data-contact-anim='column']`, replacing the non-discriminating `toBeVisible()`-only coverage with a real proof that reveals are scroll-gated, not load-fired. Existing `toBeVisible()` checks kept, not removed.
- [x] 6.4 (R3-002 CRITICAL) `tests/e2e/visual-refresh.spec.ts`: added `"section content remains visible when its animation script fails to execute (GSAP-only hiding contract)"` — uses `page.route()` to abort the FAQ entrance script (dev) / bundled `hoisted` chunk (production build, where all section scripts merge into one file), then asserts `[data-faq-anim='item']` computed `opacity` is `'1'` (natural, unanimated state) — directly proves the GSAP-only hiding contract from `spec.md:44-52`.
- [x] 6.5 (R4-003 WARNING) `tests/e2e/visual-refresh.spec.ts`: added `"Contact section reveals on a tall viewport (regression: no dead zone at max scroll)"` — sets a `1440x2000` viewport, scrolls to `document.body.scrollHeight`, asserts `[data-contact-anim='column']` computed `opacity` reaches `'1'`. Confirmed RED (opacity stuck at `'0'`) before 6.1's fix, GREEN after.
- [x] 6.6 Ran full verification: `npm run test` (28/28 unit tests pass), `npm run build` (succeeds), `npm run test:e2e` (36/37 pass — the 1 failure is the same pre-existing, unrelated `hero-penguin.spec.ts` reduced-motion background-position format failure documented in Phase 5.3, confirmed present on unmodified `main`, `hero-animation.js` untouched by this change).
- [x] 6.7 Updated `review-ledger.md` statuses: R4-001, R3-001, R3-002, R3-003, R4-003 → `fixed`. R3-004 left `open` (documented reason: no existing gsap/ScrollTrigger unit-mock infra in the project, and these scripts execute as top-level side effects on import with no exported function to unit-test in isolation — extracting one would require restructuring beyond this corrective pass's scope; flagged as a known gap rather than adding new mocking infrastructure under budget pressure). R4-002 left `info`/out of scope per explicit instruction (pre-existing, project-wide observability gap).

### R3-004 status: known gap (not fixed)
Unit coverage for per-section `scrollTrigger` config was evaluated and skipped. Each `src/scripts/{section}-animation.js` file queries `document` and builds its `gsap.timeline` as a top-level side effect at import time — there is no exported function to call from a unit test, and the project has no existing Vitest/jsdom + gsap mocking harness. Building that harness (jsdom environment, `gsap`/`ScrollTrigger` mocks, module-side-effect capture) is non-trivial new infrastructure, which the corrective-pass instructions explicitly say to skip rather than over-engineer. The behavior is otherwise fully covered by the E2E layer (6.3-6.5), which is more authoritative for this DOM/scroll-driven contract anyway.
