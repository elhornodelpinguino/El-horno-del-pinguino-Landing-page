# Proposal: GSAP Scroll Entrances + Legacy Reveal Retirement

## Intent

Below-fold entrance timelines (catalog, business, trust, order, final-cta) run on page load instead of on scroll, so their reveals finish unseen — only the Hero entrance is ever perceived. Meanwhile FAQ and Contact still use the legacy IntersectionObserver reveal system, leaving two parallel animation stacks. This change ties every entrance to scroll position and retires the legacy system so the landing has one coherent, on-scroll reveal behavior.

## Scope

### In Scope
- Hook the 5 existing entrance timelines to `ScrollTrigger` (`start: "top 78%"`, later start for page-bottom sections) so reveals fire on viewport entry.
- Migrate `FAQ.astro` and `Contact.astro` to GSAP + ScrollTrigger via new `src/scripts/faq-animation.js` / `contact-animation.js` with `data-faq-anim` / `data-contact-anim` targets, following the existing per-section pattern.
- Retire legacy: delete `src/scripts/scroll-animations.js`, remove its `index.astro` import, remove legacy CSS from `global.css`, strip legacy classes/`--i` styles from `LimitedSpots.astro` and `SpecialEditions.astro`.
- Update `tests/e2e/visual-refresh.spec.ts` to an all-GSAP contract (replace the legacy IO test with FAQ/Contact GSAP visibility assertions).

### Out of Scope
- Pinned storytelling for HowToOrder, wave clip-path transitions, `ScrollTrigger.batch` catalog, `gsap.matchMedia` refactor, StickyWhatsApp trigger. Hero entrance stays load-triggered — no change.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `scroll-animations`: reveal mechanism changes from IntersectionObserver + CSS class toggling to GSAP + ScrollTrigger entrances; FAQ/Contact join the GSAP system; legacy classes/CSS removed.

## Approach

Reuse the established per-section GSAP script pattern. For existing timelines, add `scrollTrigger: { trigger: section, start }` to the entrance `gsap.timeline`; keep scrub `ScrollTrigger.create` calls untouched. For FAQ/Contact, add `data-*-anim` attributes, create guarded per-section scripts (reduced-motion branch first, `gsap.set(..., { clearProps: "all" })`), and import from the component `<script>`. Preserve GSAP-only hiding — no CSS pre-hiding — so failed JS never leaves content invisible.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/scripts/{catalog,business,trust,order,final-cta}-animation.js` | Modified | Add ScrollTrigger to entrance timelines |
| `src/scripts/faq-animation.js`, `contact-animation.js` | New | GSAP entrances for FAQ/Contact |
| `src/components/FAQ.astro`, `Contact.astro` | Modified | `data-*-anim` attrs + script import |
| `src/scripts/scroll-animations.js` | Removed | Legacy IO system deleted |
| `src/pages/index.astro` | Modified | Remove legacy import |
| `src/styles/global.css` | Modified | Remove legacy CSS + reduced-motion overrides |
| `src/components/LimitedSpots.astro`, `SpecialEditions.astro` | Modified | Strip legacy classes/`--i` styles |
| `tests/e2e/visual-refresh.spec.ts` | Modified | All-GSAP contract |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `.from()` + ScrollTrigger hides content until trigger fires; JS failure leaves it hidden | Med | Keep GSAP-only hiding (no CSS pre-hide); reduced-motion clears props; E2E asserts visibility after settle |
| Page-bottom sections never reach `top 78%` | Med | Use later start (`top 85%`) for footer-like sections |
| Removing legacy CSS/classes breaks dead components' render | Low | Components are unused; verify build + smoke |

## Rollback Plan

Revert the single PR (git revert of the merge/commit). No data, schema, or config migration is involved; all changes are static client assets, so revert restores the prior IO + load-triggered behavior instantly.

## Dependencies

- GSAP 3.15 + ScrollTrigger (already present). No new packages.

## Success Criteria

- [ ] All 5 below-fold entrances reveal on scroll, not on load.
- [ ] FAQ and Contact reveal via GSAP; no `.animate-on-scroll`/`scroll-animations.js` remains in the repo.
- [ ] Reduced-motion users see all content fully visible with no animation.
- [ ] `npm run test`, `npm run build`, and `npm run test:e2e` pass with the updated all-GSAP contract.
- [ ] Diff fits the 400-line single-PR budget.
