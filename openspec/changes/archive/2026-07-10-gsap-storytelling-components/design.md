# Design: GSAP Storytelling Components (Fase 2)

## Technical Approach

Extend the four per-section scripts on the Fase-1 pattern: reduced-motion branch first
(`gsap.set(..., { clearProps: "all" })`), GSAP-only hiding, no CSS pre-hide, fail-open on
JS failure. No new plugins, no `gsap.matchMedia`. Order and FinalCTA add scroll-position
effects (pin+scrub, scrub clip-path) — the skill's reserved use of `ScrollTrigger`. Catalog
swaps its entrance card beat for `ScrollTrigger.batch()`. Trust extends its existing entrance
stagger with per-check-icon targets. Each section's existing parallax `ScrollTrigger.create`
scrub calls are untouched (separate property, no conflict).

## Architecture Decisions

### Decision: HowToOrder — pin+scrub with viewport-width gate, no matchMedia
**Choice**: One `ScrollTrigger` pins `.order-section` (`start:"top top"`, `end:"+=150%"`,
`scrub:true`, `pin:true`, `anticipatePin:1`) driving a scrubbed timeline that activates the 3
step cards discretely via `snap:{ snapTo:"labelsDirectional", duration:0.25 }` on labels
`step0/step1/step2`. **Alternatives**: continuous non-snapped scrub (mushy, no "one beat"
feel); IntersectionObserver step highlight (no scrub); `gsap.matchMedia` (out of scope).
**Rationale**: labels + snap give the "one beat at a time" narrative while keeping scrub.
Mobile guard: evaluate `window.matchMedia("(min-width:768px)").matches` once at load — if
false, skip pin and run the Fase-1 entrance stagger instead (pin traps short viewports). Steps
render fully visible from CSS; the non-reduced branch calls `gsap.set(steps,{opacity:.4,
scale:.96})` to set the inactive look, so a JS failure leaves all steps visible (fail-open).

### Decision: FinalCTA — additive scrub clip-path on the card, feature-detected
**Choice**: Keep the Fase-1 entrance (opacity/scale on `[data-finalcta-anim='card']`); ADD a
second `ScrollTrigger` scrubbing `clipPath` via `gsap.fromTo` from a wavy low polygon to a full
polygon (both 8 vertices, riffing the site wave `M0 14 Q75 0 150 14 T…`). Gate on
`CSS.supports("clip-path","polygon(0 0,100% 0)")`. **Alternatives**: replace the scale entrance
(loses reveal on no-scrub agents); animate `height`/`mask` (layout thrash / weaker support).
**Rationale**: clip-path and transform are different properties → no conflict between the two
triggers. Start/end polygons share vertex count so GSAP interpolates smoothly. If clip-path
unsupported or reduced-motion, skip the scrub — the entrance already left the card fully
visible (fail-open).

### Decision: Catalog — `ScrollTrigger.batch()` replaces the card timeline beat
**Choice**: Remove `tl.from(cards,{stagger})`; add `ScrollTrigger.batch(cards,{ start:"top 85%",
interval:0.1, batchMax:3, onEnter:b=>gsap.to(b,{y:0,opacity:1,duration:.65,stagger:.12,
overwrite:true}) })`, with `gsap.set(cards,{opacity:0,y:28})` first (non-reduced branch only).
Empty-state stays in the entrance timeline via the existing `else if (empty)` path.
**Alternatives**: keep single timeline stagger (N>batchMax reveals all at once, no viewport
batching); onLeaveBack reset (contradicts Fase-1 one-shot `play none none none`).
**Rationale**: `batchMax:3` matches `lg:grid-cols-3`; batches reveal row-by-row and scale 1→N.
N=1 fires a batch of one; N=0 has no card nodes so only the empty path runs. `gsap.set` hiding
lives in the JS-ran branch only, so JS failure ⇒ visible (fail-open).

### Decision: Trust — extend entrance stagger with check-icon scale/rotate
**Choice**: Add `data-trust-anim='item'` to the 4 receipt `<li>` and `data-trust-anim='check'`
to their `<span>✓</span>`. Timeline appends `.from(items,{x:-12,opacity:0,stagger:.08})` then
`.from(checks,{scale:0,rotate:-45,opacity:0,stagger:.1,ease:"back.out(2)"},"-=.3")`.
**Alternatives**: DrawSVG on the check (out of scope, new plugin). **Rationale**: reuses the
existing SVG glyphs; scale/rotate reads as a "stamp" without new art.

## Data Flow — HowToOrder pin+scrub sequence

    load ─► order-animation.js
      ├─ reduced-motion? ─yes─► clearProps(all)  → steps fully visible, no pin
      └─ min-width:768? ─no──► Fase-1 entrance stagger (no pin)
                        │yes
                        ▼
        gsap.set(steps,{opacity:.4,scale:.96})   (inactive look; skipped if JS fails ⇒ visible)
        tl = timeline({scrollTrigger:{ pin:.order-section, start:"top top",
                                       end:"+=150%", scrub:true, snap:labelsDirectional }})
        tl.addLabel("step0").to(step[0], active) … step1 … step2

    User scrolls into section:
      ScrollTrigger pins section ─► scrub maps scrollY→timeline progress
        progress 0.00–0.33 ─► step0 active (scale1,opacity1)
        progress 0.33–0.66 ─► step1 active           snap settles on nearest label
        progress 0.66–1.00 ─► step2 active
      progress = 1 ─► unpin, section releases, normal scroll resumes

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/scripts/order-animation.js` | Modify | Width gate → pin+scrub snapped step timeline; else Fase-1 entrance |
| `src/components/HowToOrder.astro` | Modify | Add `data-order-anim='sprite'` hook on each step sprite (optional highlight target) |
| `src/scripts/final-cta-animation.js` | Modify | Add feature-gated clip-path scrub `fromTo` on card |
| `src/components/FinalCTA.astro` | Modify | No new markup required (card hook exists) |
| `src/scripts/catalog-animation.js` | Modify | Replace card beat with `ScrollTrigger.batch()` + `gsap.set` |
| `src/scripts/trust-animation.js` | Modify | Append item + check stagger beats |
| `src/components/Trust.astro` | Modify | Add `data-trust-anim='item'`/`'check'` to `<li>`/`<span>` |
| `tests/e2e/*` | Modify | Pin release, clip-path scrub delta, batch N=0/1/many, check visibility, reduced-motion |
| `src/pages/e2e-fixtures/catalog-batch.astro` | Add (deviation) | Test-only SSR route rendering `ProductGrid` with a `?count=N`-controlled synthetic product list — resolves the flagged risk that `page.route()` cannot intercept the SSR-side product fetch on the real `/` route |
| `public/robots.txt` | Modify (deviation) | `Disallow: /e2e-fixtures/` to keep the test fixture route out of the sitemap/crawl surface |

## Interfaces / Contracts

Scripts keep the `trust-animation.js` shape: `registerPlugin` → `querySelector` + null guard →
resolve `data-*-anim` targets → reduced-motion `clearProps` branch → GSAP branch. New wave
polygon lives inline in `final-cta-animation.js` (two constant strings). No exported API.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| E2E | Pin release | Scroll past `.order-section`; assert it unpins and following section reachable |
| E2E | Clip-path scrub | `getComputedStyle(card).clipPath` differs before vs mid-scroll |
| E2E | Batch N | Fixtures for 0/1/3+ products; all cards `toBeVisible` post-settle |
| E2E | Trust checks | Each `[data-trust-anim='check']` visible after settle |
| E2E | Reduced-motion | `emulateMedia({reducedMotion:"reduce"})`; all four sections visible, no pin, no console errors |
| Build | Render smoke | `npm run build` |

TDD: extend E2E contracts (red) → implement scripts/markup → green.

## Migration / Rollout

No data/schema/config migration — static client assets. Single PR; `git revert` restores Fase-1
entrance behavior. Est. ~230–280 changed lines. Budget risk: Low.

## Open Questions

- [x] Confirm `end:"+=150%"` pin length feels right vs `+=100%`/`+=200%` — tune during apply.
  **Resolved**: kept `+=150%`. E2E confirmed the pin engages at `start:"top top"`, holds through a
  partial scroll (stays pinned), and fully releases well before an overshoot of ~3000px with no
  leftover pin-spacing gap before the next section (Trust). No visual/feel regression found;
  revisit only if user testing shows the 3-step beat feels rushed or sluggish.
- [x] Snap on pin (`labelsDirectional`) vs pure scrub — snap chosen for "one beat" clarity;
  revisit if it fights fast scrolling.
  **Resolved**: kept `snap:{snapTo:"labelsDirectional",duration:.25}` with labels
  `step0/step1/step2`. No E2E signal of it fighting fast scroll during apply; flag for manual
  QA on trackpad/momentum-scroll devices before shipping broadly.
