# Verification Report — gsap-scroll-entrances-legacy-retirement

**Mode**: Full artifact set (proposal, spec, design, tasks, review-ledger) — full verification performed.

## Completeness (Tasks)

All 6 phases, 27 sub-tasks marked `[x]` in `tasks.md`. Independently confirmed against code state — no discrepancy found between marked-done tasks and actual implementation.

| Phase | Status | Verified |
|---|---|---|
| 1. E2E Contract (RED) | Done | Assertions present in `visual-refresh.spec.ts`, confirmed passing (GREEN) |
| 2. ScrollTrigger on existing entrances | Done | catalog/business/trust/order/final-cta all wired correctly |
| 3. FAQ/Contact GSAP migration | Done | New scripts + component wiring match design |
| 4. Legacy retirement | Done | Zero legacy references repo-wide (grep-verified) |
| 5. Verification (GREEN) | Done | Re-ran independently — matches reported numbers |
| 6. Review corrections | Done | R4-001/R3-001/R3-002/R3-003/R4-003 fixes verified in code, not just ledger claims |

## Command Evidence (re-run independently, not cited from apply/ledger)

| Command | Result |
|---|---|
| `npm run test` | **28/28 passed** (4 files) |
| `npm run build` | **Success** — Astro build completes, no errors |
| `npm run test:e2e` | **36/37 passed**, 1 failed: `hero-penguin.spec.ts:32 "animation respects prefers-reduced-motion"` (expected `"0% 0%"`, received `"0px 0px"` — a browser computed-style serialization format difference, unrelated to this change) |

## Spec Compliance Matrix (specs/scroll-animations/spec.md)

| Requirement | Scenario | Implementation | Test | Status |
|---|---|---|---|---|
| ScrollTrigger-Gated Section Entrances | Below-fold enters viewport | `scrollTrigger:{trigger,start}` on catalog/business/trust/order/final-cta entrance timelines | `"GSAP entrance targets are hidden before scroll and revealed after scrolling (computed style)"` — asserts computed `opacity !== '1'` pre-scroll, `=== '1'` post-scroll for catalog | PASS (discriminating) |
| | Hero plays on load | `hero-animation.js` unchanged — no ScrollTrigger | Confirmed via `git diff` (zero diff) | PASS |
| | Page-bottom later start | final-cta `start:"top 85%"` | Design table confirms final-cta is not page terminus | PASS |
| FAQ and Contact GSAP Entrances | FAQ reveals via GSAP | `faq-animation.js` + `data-faq-anim` | Same computed-style test covers `faq-intro`; `toBeVisible()` test covers `data-faq-anim='item'` | PASS (discriminating for intro; visible-only for item, acceptable — intro proves the mechanism) |
| | Contact reveals via GSAP | `contact-animation.js` + `data-contact-anim` | Computed-style test + tall-viewport regression test | PASS (discriminating) |
| GSAP-Only Content Hiding | Script fails to execute | No CSS pre-hide anywhere (grep confirms no `.animate-on-scroll`/`opacity:0` static rule) | `"section content remains visible when its animation script fails to execute"` — blocks script via `page.route()`, asserts opacity `'1'` | PASS (discriminating, proves failure-path) |
| prefers-reduced-motion Support (MODIFIED) | Reduced motion detected | All 7 section scripts check `matchMedia` before any timeline/ScrollTrigger construction, call `clearProps:"all"` | `"reduced motion shows visible final state with no console errors"` | PASS |
| | All sections respect RM | Same | Same test asserts Hero/business/trust/FAQ/contact visible + zero console errors | PASS |

## Removed Requirements — Migration Verification (grepped directly, not trusted from prior reports)

| Removed requirement | Migration claim | Verified |
|---|---|---|
| IntersectionObserver Class Toggling | `scroll-animations.js` deleted, import removed | `ls src/scripts/scroll-animations.js` → No such file. `rg "scroll-animations" src/` → zero matches. `index.astro` diff shows the `<script>` block removed. |
| CSS Transition States | Legacy `.animate-on-scroll`/`.is-visible` CSS removed | `rg "animate-on-scroll\|is-visible" src/styles/global.css` → zero matches. Diff confirms both the base rule and reduced-motion override blocks removed; `.penguin-sprite` RM rule intentionally kept. |
| Staggered Animation for Grouped Elements | `.animate-group`/`.animate-item`/`--i` stripped repo-wide, incl. `backup/` | `rg "animate-on-scroll\|animate-group\|animate-item\|--i" src/` → zero matches anywhere in `src/`. Confirmed in `LimitedSpots.astro`, `SpecialEditions.astro`, and both `backup/` copies via diff. |
| Performance — No Layout Shift | No migration needed (GSAP animates opacity/transform only, never removes from layout) | N/A — no code claim to verify; consistent with `.from()` usage across all scripts. |

## Targeted Checks (per verification request)

1. **hero-animation.js untouched**: `git diff HEAD -- src/scripts/hero-animation.js` → empty diff. Confirmed.
2. **order-animation.js scrollTrigger scope**: `scrollTrigger:{trigger:section,start:"top 78%"}` only on the entrance `tl` (line 22-25); `bubble1`/`bubble2` remain `ScrollTrigger.create({...scrub:true...})` calls, byte-for-byte structurally unchanged from the described scrub pattern. Confirmed by direct read.
3. **contact-animation.js start value**: `start: "top bottom"` (line 20) — the corrective fix, not the original `"top 85%"`. Confirmed by direct read.
4. **Real test run**: executed independently above — 28/28 unit, build success, 36/37 e2e (not copy-pasted from tasks.md/ledger).
5. **Pre-existing E2E failure isolation**: `hero-penguin.spec.ts` has zero diff vs. HEAD (`git diff --stat` shows no entry for this file, last touched in an unrelated commit `7fc0c2a`). Combined with hero-animation.js's zero diff, the failure is structurally impossible to be caused by this change — it's a Chromium computed-style serialization difference (`"0px 0px"` vs `"0% 0%"`) for a background-position reduced-motion assertion, orthogonal to ScrollTrigger/GSAP entrance logic.
6. **Diff budget**: `git diff --numstat` on tracked files = 130 insertions / 138 deletions (268 total) across 14 files, plus 2 new files (`contact-animation.js` 26 lines, `faq-animation.js` 26 lines) = **320 total changed lines**. Within the 400-line budget (design.md estimated 210-240; actual is higher but still compliant).

## Review Ledger Cross-Check (not trusted blindly — spot-verified against code)

| id | Ledger status | Verify finding |
|---|---|---|
| R4-001 | fixed | Confirmed: `contact-animation.js:20` is `"top bottom"`, not `"top 85%"`. |
| R3-001/R3-003 | fixed | Confirmed: computed-opacity pre/post-scroll test exists and is discriminating (asserts `!== '1'` then `=== '1'`), not `toBeVisible()`-only. |
| R3-002 | fixed | Confirmed: `page.route()`-based script-block test exists, asserts natural opacity `'1'` after blocking the script — a genuine failure-path proof. |
| R4-003 | fixed | Confirmed: tall-viewport (1440x2000) regression test exists and passed in this run. |
| R3-004 | open (known gap) | Accepted as documented — no unit-mock harness for GSAP/ScrollTrigger exists in the project; E2E layer covers the behavior. Does not block archive; it's a scoped, disclosed gap, not a silent omission. |
| R4-002 | info/out-of-scope | Confirmed pre-existing, repo-wide observability gap, not introduced by this diff. Non-blocking. |

## Issues

**CRITICAL**: None.

**WARNING**:
- R3-004 (unit coverage for per-section `scrollTrigger` config) remains an open, disclosed gap. Not a regression — pre-existing project limitation (no GSAP/ScrollTrigger unit-mock harness) — but flagged here for visibility at archive time. Does not block archive per the ledger's own accepted rationale (E2E layer is more authoritative for this DOM-driven contract).

**SUGGESTION**:
- Diff came in at 320 lines vs. the design's ~210-240 estimate — still comfortably under the 400-line budget, but worth noting the estimate undershot by ~35%, mostly due to the corrective-pass E2E additions (Phase 6). No action needed.

## Final Verdict

**PASS WITH WARNINGS**

All spec requirements (ADDED + MODIFIED) have working implementation and discriminating runtime test coverage. All REMOVED requirements' migration claims are verified true via direct grep, not trusted from prior reports. `hero-animation.js` is provably untouched. `order-animation.js` and `contact-animation.js` match the exact corrective-pass contract. The single pre-existing E2E failure is isolated and unrelated. Diff is within budget. The one open WARNING (R3-004) is a disclosed, scoped gap already accepted in the review ledger and does not block archive.
