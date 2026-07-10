# Review Ledger — gsap-storytelling-components

## Pass 1 — R3 Reliability (fresh-context, post sdd-apply)

| id | lens | location | severity | status | evidence |
|---|---|---|---|---|---|
| R3-001 | reliability | `src/scripts/catalog-animation.js:44-58` | CRITICAL | fixed | `gsap.set(cards, { opacity: 0, y: 28 })` runs as a standalone statement before `ScrollTrigger.batch()` is constructed. If construction throws in between, every card is left permanently at `opacity: 0`, contradicting the spec's own "no stuck-invisible state" / GSAP-Only Content Hiding invariant. No test exercises this failure path. |
| R3-002 | reliability | `src/scripts/order-animation.js:46-78` (esp. 47-49) | CRITICAL | fixed | Same anti-pattern: `gsap.set(steps, { opacity: 0.4, scale: 0.96 })` executes before `stepTl`/`ScrollTrigger` construction. Adjacent comment claims fail-open "fully visible" but the set state is 40% opacity — factually wrong, and a failure afterward leaves steps dimmed indefinitely. `final-cta-animation.js`'s atomic `gsap.fromTo` in the same diff shows the safe pattern was available but not applied here. |
| R3-003 | reliability | `src/scripts/order-animation.js:9,22,34` | CRITICAL | no_change_needed | `window.matchMedia("(min-width: 768px)")` read once at init, no `change` listener, no `ScrollTrigger.matchMedia()`. Mid-session resize/rotation can leave the wrong branch's setup locked in. Severity is coupled to R3-002 — fixing the fail-safe there removes the "stuck invisible" outcome, leaving only the already-accepted (per design.md) no-live-reevaluation tradeoff. |
| R3-004 | reliability | `src/pages/e2e-fixtures/catalog-batch.astro:13`, `public/robots.txt` | CRITICAL | fixed | Real deployed SSR route (`prerender = false`), reachable by direct URL in production. `robots.txt` Disallow is advisory only — no env/auth guard. Renders full site branding around synthetic data driven by an unvalidated query param. |
| R3-005 | reliability | `tests/e2e/visual-refresh.spec.ts` (Fase 2 block) | WARNING | fixed | New tests use fixed `page.waitForTimeout(200-1200ms)` sleeps to sync with GSAP/ScrollTrigger timing, then plain synchronous `expect(...).toBe(...)` — classic fixed-delay flakiness pattern under CI load. |
| R3-006 | reliability | `openspec/config.yaml` (strict_tdd), `tests/unit/` | WARNING | accepted (unchanged) | Zero Vitest unit coverage for new branching/edge-case logic (N=0 guard, pin math, mobile/desktop branch); 100% E2E. Design explicitly chose E2E-first testing strategy, so treated as accepted, not blocking. Not touched in this corrective pass per explicit instruction. |
| R3-007 | reliability | `tests/e2e/visual-refresh.spec.ts` (reduced-motion sprite test) | SUGGESTION | fixed | Assertion targets `[data-order-anim='sprite']` which neither entrance timeline ever hides/targets — passes identically even if reduced-motion gating were broken. |
| R3-008 | reliability | `tests/e2e/visual-refresh.spec.ts` (N > batchMax test) | SUGGESTION | fixed | Comment attributes batch grouping to CSS grid rows; `ScrollTrigger.batch()` actually groups by scroll-entry timing/`interval`, not DOM row membership. Misleading for future maintainers, assertion itself still valid. |

No BLOCKER-severity findings.

**Gate outcome (Pass 1)**: 4 CRITICAL findings (R3-001, R3-002, R3-004 real defects; R3-003 coupled to R3-002) violate the change's own fail-open / production-exposure invariants. Automatic-mode gatekeeper requires re-running `sdd-apply` once with corrective feedback before `sdd-verify`.

## Corrective Pass — Resolution Summary

- **R3-001 / R3-002**: Both scripts now wrap the hide-then-wire sequence in try/catch; on catch, `gsap.set(targets, {clearProps:"all"})` restores full visibility. Verified with new E2E tests that force the exact failure window via scoped DOM API overrides (`getBoundingClientRect` for catalog cards, `getComputedStyle` for `.order-section`) — confirmed RED against pre-fix code (stuck invisible/dimmed) and GREEN after the fix (`tests/e2e/visual-refresh.spec.ts`).
- **R3-003**: No code change — R3-002's fix already eliminates the CRITICAL "stuck" outcome for a stale branch after resize; the residual no-live-reevaluation tradeoff was already accepted by design.md.
- **R3-004**: Fixture route now 404s unless `process.env.ENABLE_E2E_FIXTURES === "true"`, set only in `playwright.config.ts`'s `webServer.env`. Verified `import.meta.env.PROD` would NOT distinguish the E2E run from real production (CI builds+previews in production mode too) — confirmed empirically via manual curl checks (404 without var, 200 with var, real `/` unaffected) and a full Playwright run using its own webServer.
- **R3-005, R3-007, R3-008**: All three cheap fixes applied — auto-retrying assertions replacing fixed-timeout snapshots where genuinely "wait until" (not mid-scrub) checks, sprite assertion retargeted to a timeline-controlled element, and the misleading grid-row comment corrected.
- **R3-006**: Untouched, per explicit instruction — accepted design decision, not a defect.

**Full suite re-run**: `npm run test` 28/28 passed. `npx playwright test tests/e2e/visual-refresh.spec.ts` 36/36 passed (34 original + 2 new fail-safe tests). `npm run build` clean. `npx playwright test` (full suite) 46 passed, 1 pre-existing unrelated failure in `hero-penguin.spec.ts` (confirmed identical on unmodified `main` via `git stash`).

**Gate outcome (Pass 2)**: All 4 CRITICAL findings resolved (3 fixed, 1 confirmed no-change-needed with reasoning). Ready for `sdd-verify`.
