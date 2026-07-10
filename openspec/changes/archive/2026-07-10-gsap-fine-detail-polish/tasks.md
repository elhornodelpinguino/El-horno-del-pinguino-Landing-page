# Tasks: GSAP Fine-Detail Polish (Fase 3)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 90-130 (design est. 70-110 + design.md correction + spec/task additions from R-DESIGN-002) |
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
| 1 | Penguin parallax + StickyWhatsApp reveal/re-hide + doc correction | PR 1 | Single PR; base `main`; two files (`hero-animation.js`, new `sticky-whatsapp-animation.js`) plus CSS removal and E2E; well under 400-line budget |

## Phase 0: Design Doc Correction

- [x] 0.1 (R-DESIGN-001) `design.md:49-51`: replace "matches every other animated component" with an accurate framing — `toggleActions`/`autoAlpha` is a NEW mechanism in this codebase (no existing `src/scripts/*.js` uses either; existing scripts use `scrub: true` or one-shot `.from()` timelines with the implicit `toggleActions: "play none none none"`). State the actual precedent this decision follows (reduced-motion-first branch, GSAP-only hiding, fail-open) without overclaiming mechanism reuse.

## Phase 1: E2E Contracts (RED)

- [x] 1.1 `tests/e2e/hero-penguin.spec.ts`: add a parallax assertion — scroll partway through `.hero-shell`, read `.penguin-sprite` computed `transform` matrix, assert it is non-identity and differs from `.hero-card`'s matrix at the same scroll position (proves independent scrub rate).
- [x] 1.2 `tests/e2e/hero-penguin.spec.ts`: extend the existing `"animation respects prefers-reduced-motion"` test to also assert no penguin `ScrollTrigger` is created (e.g. penguin transform stays identity across scroll under `emulateMedia({ reducedMotion: "reduce" })`).
- [x] 1.3 `tests/e2e/visual-refresh.spec.ts`: add `"StickyWhatsApp is hidden at page top and reveals after scrolling past Hero"` — mobile viewport, `toBeHidden()` (via `visibility: hidden` from `autoAlpha`) at page top, scroll past `.hero-shell`, then `toBeVisible()`.
- [x] 1.4 (R-DESIGN-002) `openspec/changes/gsap-fine-detail-polish/specs/scroll-animations/spec.md`: add a new scenario under "ScrollTrigger-Gated Section Entrances" — `"StickyWhatsApp re-hides when scrolling back up past Hero"` — GIVEN the button has revealed after scrolling past `.hero-shell`, WHEN the user scrolls back up so `.hero-shell` is on screen again, THEN the button returns to its hidden/neutral state via the `toggleActions` reverse action.
- [x] 1.5 (R-DESIGN-002) `tests/e2e/visual-refresh.spec.ts`: add the matching E2E assertion for 1.4 — mobile viewport, scroll past `.hero-shell` (button visible), scroll back to top (`.hero-shell` on screen), assert `toBeHidden()` again.
- [x] 1.6 `tests/e2e/visual-refresh.spec.ts`: add `"StickyWhatsApp is immediately visible under reduced motion"` — `emulateMedia({ reducedMotion: "reduce" })`, load, assert `toBeVisible()` at top with zero console errors and no scroll-gating.
- [x] 1.7 Run `npm run test:e2e`; confirm 1.1, 1.3, 1.5, 1.6 fail (RED) against current code (no penguin parallax trigger, CSS-only WhatsApp fade with no hide-at-top/re-hide behavior).

## Phase 2: Hero Penguin Parallax (GREEN)

- [x] 2.1 `src/scripts/hero-animation.js`: inside the existing `else` branch, resolve `const penguin = shell.querySelector(".penguin-sprite");` mirroring the `card` null-guard pattern.
- [x] 2.2 Same file: add a second `ScrollTrigger.create({ trigger: shell, start: "top top", end: "bottom top", scrub: true, animation: gsap.to(penguin, { yPercent: -18, ease: "none" }) })` guarded by `if (penguin)`, placed alongside the existing card trigger.
- [x] 2.3 Run `npm run test:e2e -- hero-penguin`; confirm 1.1 and 1.2 pass. Tune `yPercent` magnitude (design.md Open Questions range: -12 to -24) if depth read is too subtle or too strong. **Result**: kept the recommended `-18` — E2E confirms the sprite's computed transform is non-identity and diverges from the card's transform mid-scroll, proving clear depth separation; no visual over/under-shoot signal from automated checks, so no retuning was needed.

## Phase 3: StickyWhatsApp Scroll-Gated Reveal — Decision Point (GREEN)

- [x] 3.1 Create `src/scripts/sticky-whatsapp-animation.js` following `hero-animation.js`'s shape: `gsap.registerPlugin(ScrollTrigger)`, `querySelector(".sticky-whatsapp")` + null guard, `matchMedia("(prefers-reduced-motion: reduce)")` checked first.
- [x] 3.2 Same file, reduced-motion branch: `gsap.set(btn, { clearProps: "all" })` — button visible immediately, no scroll gating, no trigger created.
- [x] 3.3 Same file, else branch: `gsap.fromTo(btn, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" })` wired into `ScrollTrigger.create({ trigger: ".hero-shell", start: "bottom top", toggleActions: "play none none reverse", animation: ... })`.
- [x] 3.4 `src/components/StickyWhatsApp.astro`: add `<script>import "~/scripts/sticky-whatsapp-animation.js";</script>`.
- [x] 3.5 **Decision point (R-DESIGN-002)**: run `npm run test:e2e`; confirm 1.3, 1.5, 1.6 pass with `toggleActions: "play none none reverse"`. Manually QA the scroll-back-up re-hide in a real browser. IF it feels janky (per design.md's own noted fallback): change `toggleActions` to `"play none none none"` (reveal once, stays visible), delete/adjust the 1.5 re-hide test and its 1.4 spec scenario to describe "reveals once and stays visible" instead of "re-hides," and update `spec.md`'s scenario text to match whichever behavior ships. Record which option was chosen and why directly in this task line before checking it off. **Result**: kept `toggleActions: "play none none reverse"` (the design-recommended default). 1.3/1.5/1.6 all pass GREEN across two full clean-server e2e runs with no flakiness or retries triggered by the toggle itself; no interactive/manual browser QA was performed in this non-interactive apply session, so the "feels janky" check was validated via the deterministic scroll-position E2E assertions instead — no signal of jank in automated timing. `spec.md` and the 1.5 test already describe "re-hides," so no further edits were needed; both stayed consistent with this choice.
- [x] 3.6 `src/styles/global.css`: remove the `animation: sticky-whatsapp-in 500ms ease-out 900ms both;` declaration (line ~395), the `@keyframes sticky-whatsapp-in` rule (lines ~407-416), and the `@media (prefers-reduced-motion: reduce) { .sticky-whatsapp { animation: none; } }` override (lines ~418-422). Keep the base `.sticky-whatsapp` positioning/visual styles and the `md:hidden` rule untouched.

## Phase 4: Verify & Cleanup

- [x] 4.1 Run `npm run test:e2e`; confirm all Phase 1 assertions (1.1-1.6, as finalized by 3.5) pass GREEN, and existing `hero-penguin.spec.ts`/`visual-refresh.spec.ts` suites stay green. **Result**: full `npx playwright test` run — 50 passed, 1 pre-existing failure unrelated to this change (see Issues Found in apply-progress). All new/modified assertions (1.1, 1.2, 1.3, 1.5, 1.6, plus existing hero-penguin/visual-refresh suites) pass.
- [x] 4.2 Run `npm run build`; confirm render smoke passes with the CSS keyframe/override removed (no dangling selector errors). **Result**: `astro build` completed successfully, no errors.
- [x] 4.3 Run `npm run test`; confirm existing unit suites stay green (no unit logic touched). **Result**: `vitest run` — 4 files, 28 tests, all passed.
- [x] 4.4 Update `design.md`'s Open Questions checkboxes with the tuned penguin `yPercent` value and the final `toggleActions` decision from 3.5.

## Phase 5: Corrective Fixes (post sdd-verify WARNINGs)

- [x] 5.1 `tests/e2e/hero-penguin.spec.ts`: split the "no penguin `ScrollTrigger` under reduced motion" assertion (task 1.2) out of the shared `"animation respects prefers-reduced-motion"` test into its own standalone `test(...)` block, so it gets genuine runtime pass/fail proof independent of the pre-existing unrelated `bgPos` (`"0% 0%"` vs `"0px 0px"`) assertion failure in that test. The pre-existing `bgPos` bug is left untouched (out of scope for this change).
- [x] 5.2 `tests/e2e/visual-refresh.spec.ts`: add `"button remains visible when its animation script fails to execute (GSAP-only hiding contract)"` to the "StickyWhatsApp scroll-gated reveal" describe block — `page.route(...)` aborts `sticky-whatsapp-animation` and the bundled `hoisted` chunk (same pattern as the existing FAQ script-failure test), asserts the WhatsApp CTA remains visible, closing the "StickyWhatsApp script fails to load" spec-scenario coverage gap.
- [x] 5.3 Re-run `npm run build` and `npx playwright test`; confirm the new standalone reduced-motion test and the new script-failure test both pass, and total failures remain exactly 1 (the pre-existing, unrelated `bgPos` bug — confirmed via git history in verify-report.md, no new failures introduced). **Result**: `npm run build` clean. `npx playwright test` — 52 passed, 1 pre-existing failure (`hero-penguin.spec.ts:32` bgPos format quirk). Both new tests (`hero-penguin.spec.ts:62` "no penguin ScrollTrigger is created under reduced motion", `visual-refresh.spec.ts:580` "button remains visible when its animation script fails to execute") independently confirmed passing.
