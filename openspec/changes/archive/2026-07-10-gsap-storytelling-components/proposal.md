# Proposal: GSAP Storytelling Components (Fase 2)

## Intent

Fase 1 tied every section entrance to scroll position, but the reveals are still uniform fade-ups with no narrative or scroll-driven personality. Fase 2 turns four sections into scroll-driven storytelling moments so the brand feels crafted and the "how it works / trust" message lands with more clarity, without new art or plugins.

## Scope

### In Scope
- **HowToOrder pinned steps**: pin the `.order-section` with `pin: true` + `scrub` so the existing step sprites advance one beat at a time as the user scrolls through the pinned range.
- **FinalCTA wave rise**: scrub-animate the magenta CTA card's `clipPath` so the block "rises like meringue" on scroll, riffing on the site's existing wave dividers.
- **Catalog batch reveals**: replace the catalog cards' timeline `.from()` stagger with `ScrollTrigger.batch()` so staggered reveals scale from 1 to N products (future-proof for the owned product-admin backend).
- **Trust checklist stagger + check reveal**: stagger the checklist items and give each existing check SVG a small scale/rotate reveal.

### Out of Scope
- Fase 3 scope: hero penguin parallax extension, StickyWhatsApp ScrollTrigger visibility.
- New art/sprites, DrawSVG or any new GSAP plugin, `gsap.matchMedia` refactor.
- Legacy IntersectionObserver system (already retired in Fase 1).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `scroll-animations`: add scroll-driven storytelling requirements — pinned scrubbed step advancement (order), scrubbed clip-path rise (final-cta), `ScrollTrigger.batch()` catalog reveals valid for 1..N cards, and per-item check-icon reveal (trust). All must honor GSAP-only hiding and `prefers-reduced-motion`.

## Approach

Per-section scripts keep the established pattern: reduced-motion branch first (`gsap.set(..., { clearProps: "all" })`), then GSAP. Order uses a `ScrollTrigger` with `pin: true` + `scrub` driving a step timeline. FinalCTA scrubs `clipPath` on the card. Catalog swaps its card timeline beat for `ScrollTrigger.batch()` with `onEnter` stagger. Trust adds check-icon targets to its existing stagger. No CSS pre-hiding; failed JS never leaves content invisible.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/scripts/order-animation.js` | Modified | Pin + scrub step advancement |
| `src/components/HowToOrder.astro` | Modified | Sprite/step markup hooks for pin |
| `src/scripts/final-cta-animation.js` | Modified | Scrub clip-path rise |
| `src/components/FinalCTA.astro` | Modified | Clip-path target markup |
| `src/scripts/catalog-animation.js` | Modified | `ScrollTrigger.batch()` reveals |
| `src/scripts/trust-animation.js` | Modified | Check-icon stagger reveal |
| `src/components/Trust.astro` | Modified | Check-icon `data-*-anim` hooks |
| `tests/e2e/*` | Modified | Pin/scrub/batch assertions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pin causes layout jump / mobile scroll trap | Med | Test pin spacing; disable pin under reduced-motion; verify mobile viewport |
| `batch()` leaves cards hidden at N=0/1 | Med | Assert 1-card and empty-state visibility; GSAP-only hiding |
| clip-path scrub jank / unsupported | Low | Use simple wave clip path; fall back to visible card if unsupported |

## Rollback Plan

Revert the single PR (git revert). All changes are static client scripts/markup — no data, schema, or config migration — so revert instantly restores Fase 1 entrance behavior.

## Dependencies

- GSAP 3.15 + ScrollTrigger (already installed). No new packages or art.

## Success Criteria

- [ ] Order section pins and advances steps on scrub; releases cleanly.
- [ ] FinalCTA card rises via scrubbed clip-path.
- [ ] Catalog reveals correctly for 1 and many products via `ScrollTrigger.batch()`.
- [ ] Trust checklist staggers with per-item check reveal.
- [ ] Reduced-motion users see all four sections fully visible, no pin/scrub/batch.
- [ ] `npm run test`, `build`, `test:e2e` pass; diff fits 400-line budget.
