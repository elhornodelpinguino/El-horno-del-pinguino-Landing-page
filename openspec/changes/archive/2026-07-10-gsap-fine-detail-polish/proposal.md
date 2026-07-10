# Proposal: GSAP Fine-Detail Polish (Fase 3)

## Intent

Fase 1 (scroll-gated entrances) and Fase 2 (storytelling components) shipped. Fase 3 is the final, low-priority polish pass closing two loose ends: the Hero parallax only moves the card (the penguin sprite sits flat, no depth), and StickyWhatsApp fades in 900ms after load via CSS — always visible, competing with the Hero's own CTAs, and inconsistent with the GSAP `matchMedia` + reduced-motion pattern every other animated element now follows.

## Scope

### In Scope
- **Hero penguin parallax extension**: add a second scrub `ScrollTrigger` in `src/scripts/hero-animation.js`, parallel to the existing `.hero-card` `yPercent: 12` trigger, targeting `.penguin-sprite` (child of `.hero-card`) with a different `yPercent` for a layered depth effect. Inside the existing reduced-motion-safe `else` branch.
- **StickyWhatsApp scroll-gated reveal**: convert `src/components/StickyWhatsApp.astro` from the CSS-only `sticky-whatsapp-in` fade to a GSAP `ScrollTrigger` reveal that shows the button only after the user scrolls past Hero (`trigger: .hero-shell`, `start: "bottom top"`). Follow the `matchMedia` + `gsap.set(..., { clearProps: "all" })` pattern, GSAP-only hiding (no CSS pre-hide), reduced-motion respected. Remove the now-redundant CSS keyframe.

### Out of Scope / Non-Goals
- FAQ / Contact (already GSAP-migrated in Fase 1) — untouched.
- Re-opening the FinalCTA wave clip-path treatment — explicitly rejected in a prior session; not revisited.
- New art/sprites, new GSAP plugin, project-wide `gsap.matchMedia` refactor, or changes to Hero's load-triggered entrance or the CSS `penguin-mix` sprite cycle.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `scroll-animations`: add (a) hero penguin-sprite parallax layering alongside the card scrub, and (b) a new pattern for global scroll-position-gated visibility of a non-section fixed element (StickyWhatsApp), gated on `.hero-shell`. Both honor GSAP-only hiding and `prefers-reduced-motion`.

## Approach

Penguin: mirror the existing `.hero-card` `ScrollTrigger.create` exactly (same trigger/start/end/scrub), different `yPercent` on `.penguin-sprite` — no property collision with the CSS `background-position` sprite cycle. StickyWhatsApp: new `src/scripts/sticky-whatsapp-animation.js` following the established guarded pattern, imported via a `<script>` tag in the component; delete the `sticky-whatsapp-in` CSS keyframe + its reduced-motion override so GSAP is the sole visibility source.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/scripts/hero-animation.js` | Modified | Second scrub trigger for `.penguin-sprite` |
| `src/components/StickyWhatsApp.astro` | Modified | Add `<script>` import; drop CSS-driven reveal |
| `src/scripts/sticky-whatsapp-animation.js` | New | Guarded ScrollTrigger reveal on `.hero-shell` |
| `src/styles/global.css` | Modified | Remove `sticky-whatsapp-in` keyframe + RM override |
| `tests/e2e/*` | Modified/New | Parallax + scroll-gated visibility assertions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GSAP-only-hiding spec violation: CSS pre-hides button, JS fails → always invisible | Med | No CSS pre-hide; reveal from a visible/neutral base; reduced-motion clears props; E2E asserts visible state |
| No existing "scroll past Hero" gating coverage | Med | New e2e: button hidden at top, visible after scrolling past `.hero-shell`; reuse `emulateMedia({ reducedMotion })` |
| Penguin parallax jank or CLS | Low | Transform-only `yPercent`; existing `hero-penguin.spec.ts` box assertions still hold |

## Rollback Plan

Revert the single PR (`git revert`). All changes are static client scripts/markup/CSS — no data, schema, or config migration — so revert instantly restores the current CSS-driven StickyWhatsApp and card-only parallax.

## Dependencies

- GSAP 3.15 + ScrollTrigger (already installed). No new packages or art.

## Success Criteria

- [ ] Penguin sprite parallaxes at a different rate than the card on scroll.
- [ ] StickyWhatsApp is hidden at page top and reveals only after scrolling past Hero.
- [ ] Reduced-motion users see the button visible with no animation; no CSS pre-hide remains.
- [ ] `sticky-whatsapp-in` keyframe removed; GSAP is the sole visibility source.
- [ ] `npm run test`, `build`, `test:e2e` pass; diff fits the 400-line budget (two-file-touch, small).
