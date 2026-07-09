# Design: GSAP Scroll Entrances + Legacy Reveal Retirement

## Technical Approach

Tie the 5 below-fold entrance timelines to scroll position and migrate FAQ/Contact
onto the same per-section GSAP pattern, then delete the IntersectionObserver stack.
No new dependencies; reuse the `trust-animation.js` shape everywhere. Hero stays
load-triggered per the `gsap-scroll-animations` skill rule (above-the-fold entrances
never wrap in ScrollTrigger). Scrub `ScrollTrigger.create` parallax calls are untouched.

## Architecture Decisions

### Decision: Attach ScrollTrigger to the entrance `gsap.timeline`, not per-tween
**Choice**: Add `scrollTrigger: { trigger: section, start }` to each entrance
`gsap.timeline({...})`. **Alternatives**: per-tween triggers (N triggers/section) or
`ScrollTrigger.batch`. **Rationale**: one trigger per section reveals the whole
choreographed timeline as a unit, matches the existing single-timeline structure, and
is the smallest diff. Default `toggleActions` (`play none none none`) gives a one-shot
forward reveal — no reverse-on-scroll-up.

### Decision: `start` value per section
| Sections | start | Why |
|---|---|---|
| catalog, business, trust, order | `top 78%` | Mid-page; each scrolls fully through the viewport, reaches 78% comfortably. |
| final-cta | `top 85%` | Closest to the scroll ceiling, but not the page terminus (Contact follows it) — a fixed percentage threshold cannot strand it, confirmed by R4 review. |
| contact | `top bottom` (corrected post-apply; was `top 85%`) | **R4-001 correction**: Contact is the true last element on the page. `top 85%` requires the footer's own height to be >= 15% of viewport height for the trigger to ever cross at max scroll — on tall viewports (e.g. 1440x2000) the footer falls short of that margin and the trigger never fires, permanently stranding content at `opacity:0` (violates the "fail open" contract). `top bottom` is geometrically guaranteed to fire for any element that becomes visible at all, regardless of footer/viewport height, because the trigger point (top of section reaches bottom of viewport) must be crossed before the user can see any part of it. Regression-guarded by an E2E tall-viewport test. |

### Decision: `.from()` + ScrollTrigger `immediateRender` is the hide contract
**Choice**: Keep GSAP-only hiding. `.from()` under a scrollTrigger sets
`immediateRender` on load (element hidden at `opacity:0`/`y` offset), then reveals when
the trigger fires. **Alternatives**: CSS pre-hide + reveal class (the legacy system).
**Rationale**: if the JS never runs, nothing is pre-hidden, so content stays fully
visible — the safe failure mode. Reduced-motion branch runs `clearProps:"all"` first and
skips all animation.

### Decision: FAQ/Contact selectors and targets
**Choice**: FAQ keeps `.faq-section`; targets `[data-faq-anim='intro']` (intro card) +
`[data-faq-anim='item']` (6 `details.faq-item`). Contact keys off `#contacto`; targets
`[data-contact-anim='column']` (3 footer columns) + `[data-contact-anim='bar']` (bottom
bar). **Rationale**: stable data-attributes over brittle `nth-child`; `#contacto` already
exists so no new class is needed.

## Data Flow

    page load ──► {section}-animation.js ──► reduced-motion? ─yes─► clearProps (visible)
                                                    │no
                                                    ▼
                          gsap.timeline({ scrollTrigger:{trigger,start} })
                          from-tweens hide targets immediately, reveal on viewport entry

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/scripts/{catalog,business,trust,order}-animation.js` | Modify | Add `scrollTrigger:{trigger:section,start:"top 78%"}` to entrance timeline |
| `src/scripts/final-cta-animation.js` | Modify | Same, `start:"top 85%"` |
| `src/scripts/faq-animation.js` | Create | Guarded per-section entrance (intro + 6 items, `start:"top 78%"`) |
| `src/scripts/contact-animation.js` | Create | Guarded per-section entrance (3 columns + bar, `start:"top 85%"`) |
| `src/components/FAQ.astro` | Modify | Drop `animate-on-scroll`; add `data-faq-anim`; import script |
| `src/components/Contact.astro` | Modify | Drop `animate-on-scroll`; add `data-contact-anim`; import script |
| `src/scripts/scroll-animations.js` | Delete | Legacy IO system |
| `src/pages/index.astro` | Modify | Remove legacy `<script>` import (lines 94-96) |
| `src/styles/global.css` | Modify | Remove legacy blocks (~110-133) + RM overrides (~286-294); KEEP `.penguin-sprite` RM rule |
| `src/components/LimitedSpots.astro` | Modify | Strip `animate-on-scroll` |
| `src/components/SpecialEditions.astro` | Modify | Strip `animate-on-scroll`/`animate-group`/`animate-item` + `style="--i"` |
| `src/components/backup/{LimitedSpots,SpecialEditions}.astro` | Modify | Strip same legacy classes so none remain repo-wide |
| `tests/e2e/visual-refresh.spec.ts` | Modify | Replace legacy IO test with FAQ/Contact GSAP visibility |

## Interfaces / Contracts

New scripts follow `trust-animation.js`: `registerPlugin` → `querySelector(section)` +
null guard → resolve `data-*-anim` targets → `if motionQuery.matches` clearProps `else`
timeline (`defaults:{ease:"power3.out",duration:0.7}`, `scrollTrigger`) with staggered
`.from({y,opacity:0})` beats using relative offsets.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (`npm run test`) | Existing suites stay green | Run as-is; no unit logic added |
| E2E (`npm run test:e2e`) | All-GSAP reveal | Delete legacy IO test; add `data-faq-anim`/`data-contact-anim` `toBeVisible` post-settle (Playwright ignores opacity, so post-settle visibility is the contract); reduced-motion test asserts visible + no console errors |
| Build | Dead-component render | `npm run build` smoke after class strip |

TDD order: update E2E contract (red) → implement scripts/attrs/removals → green.

## Migration / Rollout

No data/schema/config migration — static client assets only. Single PR; revert restores
prior behavior instantly.

**Review budget**: est. ~210-240 changed lines (adds + deletes), well under the 400-line
budget. Budget risk: Low.

## Open Questions

- [ ] Leftover `--i` custom props on already-migrated sections (ProductGrid, HowToOrder,
  BusinessUseCases, Trust) become dead once the CSS rule is removed but are harmless;
  left untouched to keep the diff scoped — confirm this is acceptable.
