# Verification Report: gsap-fine-detail-polish

**Mode**: Full artifacts (proposal, specs, design, tasks, apply-progress all present) — scoped re-verify pass after Phase 5 corrective apply
**Verdict**: PASS

## Completeness (tasks.md)

21/21 tasks marked `[x]` across Phases 0-5 (18 original + 3 Phase 5 corrective). Independently
spot-checked against actual source (not just trusting checkmarks):

| Task | Claim | Verified |
|---|---|---|
| 0.1 | design.md precedent correction | Confirmed — design.md:50-55 states the accurate "new mechanism, precedent is pattern not reuse" framing |
| 2.1-2.3 | penguin parallax ScrollTrigger | Confirmed in `src/scripts/hero-animation.js:17,54-62` |
| 3.1-3.6 | sticky-whatsapp-animation.js + CSS removal | Confirmed — new file matches spec shape; CSS keyframe fully absent (grep zero matches) |
| 4.1-4.4 | test/build/unit runs + design.md Open Questions | Previously verified; unchanged this pass |
| 5.1 | split masked reduced-motion assertion into its own test | Confirmed — `tests/e2e/hero-penguin.spec.ts:62` is now a standalone `test(...)` block, independent of the pre-existing failing `bgPos` assertion at line 53 |
| 5.2 | new StickyWhatsApp script-failure E2E test | Confirmed — `tests/e2e/visual-refresh.spec.ts:580` route-blocks `sticky-whatsapp-animation` + `hoisted` chunk, asserts the WhatsApp CTA link stays visible |
| 5.3 | re-run build + full e2e, confirm only the pre-existing failure remains | Re-executed independently below; matches claim |

## Command Evidence (re-executed independently, this pass)

- `npm run build` → clean, `astro build` completed, no dangling CSS selector errors.
- `npx playwright test` (full suite) → **52 passed, 1 failed** (53 tests total, up from 51 — net
  +2 from the Phase 5 split-test + new script-failure test). Matches the Phase 5 corrective claim
  exactly.
- Isolated re-run `npx playwright test hero-penguin` → confirms test 4 (`"animation respects
  prefers-reduced-motion"`, line 32) fails on the pre-existing `bgPos` assertion (`"0% 0%"` vs
  `"0px 0px"`), while the new standalone test 7 (`"no penguin ScrollTrigger is created under
  reduced motion"`, line 62) **passes independently** — 8 passed, 1 failed in that file, confirming
  the split fix is effective and the new assertion is no longer masked.

### Pre-existing-failure claim: re-confirmed, unchanged

Failed test: `hero-penguin.spec.ts:32` — `"animation respects prefers-reduced-motion"`, assertion
`expect(bgPos).toBe("0% 0%")` receives `"0px 0px"`. Previously confirmed via `git log -p --follow`
that this assertion predates this change (commit `7fc0c2a`) and is an unrelated Chromium
computed-style unit-format quirk. Still the **only** failure in the suite this pass — no new
failures were introduced by the Phase 5 corrective work.

### Masked-assertion WARNING: resolved

The prior verify pass found that task 1.2's reduced-motion parallax-guard assertion was masked by
sharing a test body with the pre-existing failing `bgPos` assertion (Playwright aborts on first
failed `expect`). Phase 5 task 5.1 split it into its own `test(...)` block at
`hero-penguin.spec.ts:62`. Confirmed by direct read: the new test contains only the
`transformBefore === transformAfter` guard (no `bgPos` assertion inside it), and the isolated
re-run above proves it passes at runtime. **This scenario now has genuine runtime proof,
independent of the unrelated pre-existing bug.**

### StickyWhatsApp script-failure GAP: resolved

The prior verify pass found no E2E test for the "StickyWhatsApp script fails to load" spec
scenario (only source-inspection evidence). Phase 5 task 5.2 added
`visual-refresh.spec.ts:580` — `"button remains visible when its animation script fails to
execute (GSAP-only hiding contract)"`. Confirmed by direct read: it uses `page.route(...)` to
abort requests matching `sticky-whatsapp-animation` and the bundled `hoisted` chunk (mirrors the
existing FAQ script-failure test pattern at line 222), then asserts
`getByRole("link", { name: /hacer pedido por whatsapp/i })` stays visible. Confirmed passing in
the full-suite run above (test 46). **This scenario now has genuine runtime proof.**

## Spec Compliance Matrix (openspec/changes/gsap-fine-detail-polish/specs/scroll-animations/spec.md)

| Requirement / Scenario | Test | Result |
|---|---|---|
| Penguin parallaxes at a different rate than the card | `hero-penguin.spec.ts:105` | PASS (runtime) |
| Reduced motion leaves the sprite static (no penguin ScrollTrigger) | `hero-penguin.spec.ts:62` (standalone, Phase 5) | **PASS (runtime)** — no longer masked |
| Sprite cycle animation unaffected by parallax tween | none dedicated | Not runtime-tested; true by construction (`transform` vs `background-position` are non-colliding CSS properties) — SUGGESTION, not blocking |
| GSAP-Only Content Hiding — JS fails to load (order/final-cta/catalog) | `visual-refresh.spec.ts:222` | PASS (runtime, pre-existing generic test, unchanged) |
| GSAP-Only Content Hiding — StickyWhatsApp script fails to load | `visual-refresh.spec.ts:580` (new, Phase 5) | **PASS (runtime)** — gap closed |
| Reduced motion preference detected / all sections respect it | pre-existing suites | PASS (runtime, unchanged) |
| StickyWhatsApp immediately visible under reduced motion | `visual-refresh.spec.ts:565` | PASS (runtime) |
| Below-fold section enters viewport / Hero on load | pre-existing suites | PASS (runtime, unchanged) |
| StickyWhatsApp hidden at top, reveals past Hero | `visual-refresh.spec.ts:523` | PASS (runtime) |
| StickyWhatsApp re-hides scrolling back up past Hero | `visual-refresh.spec.ts:543` | PASS (runtime) |
| Legacy `sticky-whatsapp-in` keyframe fully removed | static (grep + build) | PASS — zero matches anywhere in repo for `sticky-whatsapp-in`; `npm run build` clean |

## Design Coherence

`design.md`'s two Architecture Decisions (penguin counter-direction `yPercent: -18` via a second
independent `ScrollTrigger.create`; StickyWhatsApp `toggleActions: "play none none reverse"` +
`autoAlpha` on `.hero-shell`) match the shipped code exactly. No deviation found. Unchanged this
pass — Phase 5 touched only test files.

## Issues

### CRITICAL
None.

### WARNING
None. Both WARNING findings from the prior verify pass are resolved (see above) and confirmed by
independent runtime re-execution in this pass.

### SUGGESTION
1. "Sprite cycle animation is unaffected by the parallax tween" scenario has no dedicated
   assertion; true by construction (non-colliding CSS properties) but a cheap E2E check would
   close the loop for completeness. Non-blocking, unchanged from the prior pass.

## Final Verdict

**PASS.** All 21 tasks (18 original + 3 Phase 5 corrective) are genuinely complete and match the
shipped code. Build and the full Playwright suite (52/53) pass; the sole failure is the confirmed
pre-existing, unrelated `bgPos` format quirk in `hero-penguin.spec.ts:32`. Both WARNING findings
from the prior verify pass — the masked reduced-motion assertion and the untested StickyWhatsApp
script-failure scenario — are now resolved with genuine runtime-passing tests, independently
re-confirmed in this pass. No open issues block archive.
