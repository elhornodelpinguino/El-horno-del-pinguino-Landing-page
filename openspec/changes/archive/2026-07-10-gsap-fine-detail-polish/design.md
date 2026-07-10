# Design: GSAP Fine-Detail Polish (Fase 3)

## Technical Approach

Two additive, transform-only refinements on the established per-component GSAP pattern:
reduced-motion branch first (`gsap.set(..., { clearProps: "all" })`), GSAP-only hiding, no
CSS pre-hide, fail-open on JS failure. Penguin parallax extends `hero-animation.js` with a
second scrub `ScrollTrigger.create` inside the existing reduced-motion-safe `else` branch.
StickyWhatsApp swaps its CSS load-fade for a new guarded `sticky-whatsapp-animation.js` that
gates visibility on scroll position past `.hero-shell`. No new plugins, no `gsap.matchMedia`,
no markup restructuring. Both honor `scroll-animations` spec's GSAP-Only Content Hiding rule.

## Architecture Decisions

### Decision: Penguin parallax — separate `ScrollTrigger.create`, counter-direction yPercent
**Choice**: Add a SECOND `ScrollTrigger.create` (not a second `gsap.to` in one callback),
mirroring the card trigger exactly (`trigger: shell`, `start: "top top"`, `end: "bottom top"`,
`scrub: true`), driving `gsap.to(penguin, { yPercent: -18, ease: "none" })`. **Alternatives**:
(a) same-direction larger value (`yPercent: 20`) — subtler, penguin drifts with the card, weak
depth read; (b) one shared callback tweening both — the existing code has no shared callback,
each element is its own `ScrollTrigger.create`, so a second instance is the faithful mirror and
keeps triggers independently inspectable/killable. **Rationale**: `.penguin-sprite` is a CHILD
of `.hero-card`, so its own transform COMPOSES on top of the card's inherited `+12`. A
counter-direction `-18` makes the penguin drift up while the card frame drifts down, maximizing
relative separation for a convincing layered depth effect. Different CSS property from the sprite
`background-position` cycle → no collision. Nested in the `else` branch → never created under
reduced motion. Exact magnitude is a feel/tuning value (see Open Questions).

### Decision: StickyWhatsApp — `toggleActions` reveal on `.hero-shell`, not scrub
**Choice**: `ScrollTrigger.create({ trigger: ".hero-shell", start: "bottom top",
toggleActions: "play none none reverse", animation: gsap.fromTo(btn, { autoAlpha: 0, y: 18 },
{ autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }) })`. **Alternatives**: (a) `scrub`
— wrong; visibility is binary, not scroll-linked; (b) per-section `start: "top 78%"` — the
button is not a section (sibling of `<main>` in `index.astro`), it gates on "past Hero", so
`.hero-shell` `start: "bottom top"` is the correct anchor; (c) `toggleActions: "play none none
none"` (reveal once, never hide) — rejected because the stated motivation is the button
competing with Hero CTAs, so `reverse` re-hides it whenever the user scrolls back to Hero.
**Rationale**: `autoAlpha` (opacity + `visibility`) is deliberate — the hidden state becomes
`visibility: hidden`, which Playwright's `toBeHidden()` detects (plain `opacity: 0` reads as
visible to Playwright). The `fromTo` `from` state renders immediately on load, hiding the button
WITHOUT any CSS pre-hide; because this lives in the JS-ran (non-reduced) branch only, a script
failure leaves the button fully visible (fail-open, ≈ current behavior).

### Decision: Reduced-motion parity + CSS ownership
**Choice**: `sticky-whatsapp-animation.js` opens with `matchMedia` — if reduced, `gsap.set(btn,
{ clearProps: "all" })` (button visible instantly, no scroll gating, no animation); else build
the trigger. Delete the CSS `sticky-whatsapp-in` keyframe, its usage on `.sticky-whatsapp`, and
the CSS `@media (prefers-reduced-motion)` override so GSAP is the SOLE visibility source.
**Rationale**: eliminates the double-driver (CSS + GSAP) and the CSS pre-animation the spec
forbids. `toggleActions`/`autoAlpha` is a NEW mechanism in this codebase — no existing
`src/scripts/*.js` uses either; existing scripts use `scrub: true` or one-shot `.from()`
timelines with the implicit `toggleActions: "play none none none"`. What this decision actually
follows is the established PRECEDENT of a reduced-motion-first branch, GSAP-only hiding, and
fail-open on script failure — not mechanism reuse. Reduced-motion users keep today's "instant,
always-visible" behavior.

## Data Flow

    load ─► hero-animation.js ─ else branch ─► ScrollTrigger#1 card yPercent:+12
                                            └► ScrollTrigger#2 penguin yPercent:-18 (child, composes)

    load ─► sticky-whatsapp-animation.js ─► reduced? ─yes─► clearProps (visible, no gating)
                                                  │no
                                                  ▼
              gsap.fromTo(btn,{autoAlpha:0}) renders hidden immediately (no CSS pre-hide)
              ScrollTrigger(trigger:.hero-shell,start:"bottom top",toggleActions:play…reverse)
                scroll past Hero ─► play (reveal) ; scroll back to Hero ─► reverse (hide)
              JS fails ⇒ nothing hides ⇒ button visible (fail-open)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/scripts/hero-animation.js` | Modify | Add 2nd `ScrollTrigger.create` for `.penguin-sprite` (`yPercent:-18`) in existing `else`, guarded by a `penguin` null-check |
| `src/scripts/sticky-whatsapp-animation.js` | Create | Guarded `matchMedia` + `ScrollTrigger` reveal on `.hero-shell`, `autoAlpha` fromTo |
| `src/components/StickyWhatsApp.astro` | Modify | Add `<script>import "~/scripts/sticky-whatsapp-animation.js";</script>` |
| `src/styles/global.css` | Modify | Remove `animation: sticky-whatsapp-in…` line, `@keyframes sticky-whatsapp-in`, and the RM `animation:none` override; keep base styles + `md:hidden` rule |
| `tests/e2e/hero-penguin.spec.ts` | Modify | Add parallax assertion (penguin transform changes / differs from card after scroll) |
| `tests/e2e/visual-refresh.spec.ts` | Modify | Add StickyWhatsApp scroll-gating + reduced-motion assertions |

## Interfaces / Contracts

`sticky-whatsapp-animation.js` follows the `hero-animation.js` shape: `registerPlugin(ScrollTrigger)`
→ `querySelector(".sticky-whatsapp")` + null guard → `matchMedia` reduced branch (`clearProps`)
→ else `gsap.fromTo` + `ScrollTrigger.create`. No exported API. Penguin trigger resolves
`shell.querySelector(".penguin-sprite")` with a null guard mirroring the `card` guard.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| E2E | Penguin parallax | Scroll partway; assert `.penguin-sprite` computed `transform` is non-identity and its matrix differs from `.hero-card` (proves independent rate). Existing box/aria/RM assertions unchanged |
| E2E | StickyWhatsApp gated reveal | Mobile viewport: `toBeHidden()` at page top; `scrollTo(bottom)` then `toBeVisible()` |
| E2E | Reduced motion | `emulateMedia({ reducedMotion:"reduce" })`: button `toBeVisible()` at load, no console errors; penguin trigger not created |
| Build | Render smoke | `npm run build` after CSS removal |

TDD: extend E2E contracts (RED — new parallax + gating assertions fail against current
CSS-fade/no-parallax) → implement script + markup + CSS removal → GREEN. Existing suites
(`npm run test`, current `hero-penguin` assertions) stay green throughout.

## Migration / Rollout

No data/schema/config migration — static client scripts/markup/CSS. Single PR; `git revert`
restores the CSS-driven fade and card-only parallax instantly. Est. ~70–110 changed lines.
Budget risk: Low.

## Open Questions

- [x] Penguin `yPercent` magnitude/sign — kept the recommended `-18`. E2E confirms the sprite's
  computed transform diverges from the card's at mid-scroll (non-identity, non-equal matrices),
  proving clear depth separation with no over/under-shoot signal.
- [x] StickyWhatsApp `toggleActions` — kept `play none none reverse` (re-hide at Hero). E2E
  assertions for reveal, re-hide, and reduced-motion all pass GREEN across two full clean-server
  runs with no flakiness; no jank signal from the deterministic scroll-position checks used in
  this non-interactive apply session.
