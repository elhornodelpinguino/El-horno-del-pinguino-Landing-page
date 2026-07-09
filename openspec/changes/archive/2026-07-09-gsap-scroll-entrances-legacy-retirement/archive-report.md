# Archive Report: GSAP Scroll Entrances + Legacy Reveal Retirement

**Change**: `gsap-scroll-entrances-legacy-retirement`
**Project**: `el-horno-del-pinguino-landing-page`
**Archived**: 2026-07-09
**Location**: `openspec/changes/archive/2026-07-09-gsap-scroll-entrances-legacy-retirement/`
**Artifact Store**: OpenSpec (hybrid mode)

## Change Summary

This change unifies scroll-triggered entrance animations across the landing page by:
- Wiring 5 below-fold section entrance timelines (catalog, business, trust, order, final-cta) to GSAP `ScrollTrigger` so they play on viewport entry, not page load
- Migrating FAQ and Contact sections from legacy IntersectionObserver reveal to dedicated GSAP entrance scripts
- Retiring the legacy `scroll-animations.js` system entirely
- Implementing fail-open GSAP-only hiding (no CSS pre-hide) to ensure content visibility on JS failure
- Enforcing scroll-gated reveals across all sections with full E2E coverage

## Task Completion

All 6 phases, 27 sub-tasks marked complete in `tasks.md`:
- Phase 1: E2E Contract (RED) — 4/4 complete
- Phase 2: ScrollTrigger on Existing Entrance Timelines — 4/4 complete
- Phase 3: FAQ and Contact GSAP Migration — 4/4 complete
- Phase 4: Legacy System Retirement — 5/5 complete
- Phase 5: Verification (GREEN) — 4/4 complete
- Phase 6: Review Corrections — 6/6 complete (R4-001, R3-001, R3-002, R3-003, R4-003 fixed; R3-004 open gap documented)

**Verification Status**: PASS WITH WARNINGS
- No CRITICAL verification issues
- All spec requirements (ADDED + MODIFIED) verified with working implementation and discriminating test coverage
- All REMOVED requirements' migration claims verified via direct grep
- Single pre-existing unrelated E2E failure (hero-penguin.spec.ts reduced-motion format) confirmed not caused by this change
- Diff: 320 changed lines (210-240 estimated) — within 400-line budget

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| scroll-animations | Updated | Replaced 4 old IntersectionObserver/CSS requirements with 3 new GSAP ScrollTrigger requirements + 1 MODIFIED prefers-reduced-motion requirement. Merged delta spec into main spec at `openspec/specs/scroll-animations/spec.md`. |

### Added Requirements (3)
1. **ScrollTrigger-Gated Section Entrances** — Below-fold sections wire to `ScrollTrigger` for viewport-entry plays; Hero remains load-triggered
2. **FAQ and Contact GSAP Entrances** — Dedicated `faq-animation.js` and `contact-animation.js` scripts with `data-*-anim` targets
3. **GSAP-Only Content Hiding** — No CSS pre-hide; content remains visible if JS fails

### Modified Requirements (1)
- **prefers-reduced-motion Support** — Now checked at script start before any timeline/ScrollTrigger creation; runs `clearProps:"all"` if matched

### Removed Requirements (4)
- IntersectionObserver Class Toggling (Reason: replaced by ScrollTrigger; Migration: scroll-animations.js deleted, import removed)
- CSS Transition States (Reason: GSAP-only hiding; Migration: legacy CSS rules removed)
- Staggered Animation for Grouped Elements (Reason: per-timeline stagger; Migration: `.animate-group`/`.animate-item`/`--i` stripped)
- Performance — No Layout Shift (Reason: GSAP opacity/transform never layout-shift; Migration: none needed)

## Archive Contents

- ✅ proposal.md — scope, approach, risks, rollback plan
- ✅ specs/scroll-animations/spec.md — delta spec with ADDED/MODIFIED/REMOVED requirements
- ✅ design.md — technical approach, architecture decisions (including R4-001 contact start correction), file changes, testing strategy
- ✅ tasks.md — 6 phases, 27 sub-tasks (all marked complete), Phase 6 review corrections documented
- ✅ verify-report.md — full verification with independent command evidence, spec compliance matrix, removed requirements migration verification
- ✅ review-ledger.md — 6 review findings (5 fixed: R4-001, R3-001, R3-002, R3-003, R4-003; 1 open gap: R3-004; 1 info: R4-002)

## Source of Truth Updated

The main specification at `openspec/specs/scroll-animations/spec.md` has been updated with:
- ADDED: 3 new requirements (ScrollTrigger-gated entrances, FAQ/Contact GSAP, GSAP-only hiding)
- MODIFIED: 1 requirement (prefers-reduced-motion now checks at script start)
- REMOVED: 4 old requirements (IntersectionObserver, CSS transitions, stagger, layout-shift reserve)

The legacy IntersectionObserver-based spec has been completely replaced with the GSAP ScrollTrigger-based spec.

## Verification Evidence

**Test Results** (re-run independently):
- Unit tests: 28/28 passed
- Build: Succeeded (Astro build completes, no errors)
- E2E tests: 36/37 passed (1 pre-existing unrelated failure in hero-penguin.spec.ts)

**Code Verification**:
- `hero-animation.js`: zero diff vs. HEAD (confirmed untouched per constraint)
- `contact-animation.js`: `start: "top bottom"` (R4-001 corrective fix confirmed)
- `order-animation.js`: ScrollTrigger on entrance timeline only; bubble scrub triggers untouched
- Legacy system: zero live references repo-wide (scroll-animations.js deleted, import removed, CSS/classes stripped)
- Reduced-motion: All 7 section scripts check `matchMedia` before timeline/ScrollTrigger creation
- Diff budget: 320 lines within 400-line limit

## Risks and Mitigations

| Risk | Status | Mitigation |
|------|--------|-----------|
| Content hidden until trigger fires; JS failure leaves it hidden | Mitigated | GSAP-only hiding contract enforced; E2E test proves failure-path visibility (R3-002) |
| Page-bottom sections never reach trigger | Mitigated | Corrected Contact to `start:"top bottom"`; regression test added (R4-003) |
| Removing legacy CSS breaks dead components | Mitigated | Build smoke-test confirms no render breakage (Phase 5.2) |
| Pre-scroll reveals fire on load instead | Mitigated | Computed-style pre/post-scroll opacity assertions prove scroll-gating (R3-001, R3-003) |
| Tall viewport dead-zone for Contact | **FIXED** | R4-001 corrective fix; Contact `start` changed to `"top bottom"`; regression test confirms no 1440x2000 viewport dead zone |

## Known Gaps

| Gap | Status | Rationale |
|-----|--------|-----------|
| R3-004: Unit coverage for per-section `scrollTrigger` config | Open (documented) | Scripts execute as top-level side effects on import with no exported function; project has no existing GSAP/ScrollTrigger unit-mock harness. E2E layer (R3-001/002/003/R4-003) covers behavior at more authoritative layer. Non-blocking per review ledger. |

## SDD Cycle Status

**COMPLETE AND ARCHIVED**

All phases completed:
1. Proposal ✅ — Scope, approach, risks defined
2. Spec ✅ — Delta requirements defined
3. Design ✅ — Technical approach, file changes, decisions documented
4. Tasks ✅ — 27 sub-tasks in 6 phases, all complete
5. Apply ✅ — All implementation tasks executed, review corrections applied
6. Verify ✅ — Full verification passed; all requirements verified with discriminating test coverage
7. Archive ✅ — Change artifacts moved to archive; delta spec merged into main spec; archive report written

The change is ready for closure. No outstanding work remains.
