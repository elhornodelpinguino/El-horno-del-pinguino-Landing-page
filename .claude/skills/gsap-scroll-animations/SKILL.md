---
name: gsap-scroll-animations
description: "Trigger: GSAP, ScrollTrigger, scroll animation, hero animation, migrate animate-on-scroll. Apply horno-landing's GSAP+ScrollTrigger entrance/parallax pattern to a section."
license: Apache-2.0
metadata:
  author: alejandro
  version: "1.0"
---

## Activation Contract

Load when adding or migrating scroll/entrance animations in any `src/components/*.astro` section of horno-landing, replacing or complementing the existing `.animate-on-scroll` / `.animate-item` IntersectionObserver system (`src/scripts/scroll-animations.js`).

## Hard Rules

- Never call `gsap.set(el, { opacity: 0 })` before a `.from()` tween on the same property. `.from()` already captures the element's current computed value as its end state — pre-zeroing it animates 0→0 and the element never appears. This exact bug happened in the Hero migration.
- Always branch on `window.matchMedia("(prefers-reduced-motion: reduce)")` first. If it matches: `gsap.set(targets, { clearProps: "all" })` and skip all animation — no exceptions.
- Call `gsap.registerPlugin(ScrollTrigger)` once per script file, before creating any `ScrollTrigger`.
- Entrance timelines run once on load — never wrap an above-the-fold entrance in a `ScrollTrigger`. Reserve `ScrollTrigger` for effects tied to actual scroll position (parallax, scrub, pin).

## Decision Gates

| Effect needed | Tool |
|---|---|
| Section appears once when scrolled into view, no extra personality needed | Keep the existing `.animate-on-scroll` IntersectionObserver system — don't migrate for its own sake |
| Entrance needs per-element stagger/timing/easing variety | GSAP timeline `.from()` chain, no `ScrollTrigger` |
| Element should move with scroll position | `ScrollTrigger.create({ trigger, start, end, scrub: true, animation })` |
| Section should pin while an inner animation plays | `ScrollTrigger` with `pin: true` |

## Execution Steps

1. Add `data-{section}-anim="{role}"` attributes to the elements the timeline targets — don't rely on brittle `nth-child` selectors. See `Hero.astro` for the convention.
2. Create `src/scripts/{section}-animation.js`: query the section root with `document.querySelector`, guard for `null`, branch on reduced motion first.
3. Build `gsap.timeline({ defaults: { ease, duration } })` with relative position offsets (e.g. `"-=0.3"`) so beats overlap instead of queuing sequentially.
4. Import the script from the component's `<script>` block, alongside any existing imports (see `Hero.astro`).
5. Verify with Playwright: screenshot after the animation settles (nothing stuck at `opacity: 0`), a `getBoundingClientRect` diff after scrolling for any `ScrollTrigger` scrub, and a re-run with `page.emulateMedia({ reducedMotion: "reduce" })`.

## Output Contract

Report which sections were migrated, the script files added, and the three verification results (settled screenshot, scrub delta if applicable, reduced-motion pass) — same shape as the Hero verification.

## References

- `src/scripts/hero-animation.js` — reference implementation
- `src/components/Hero.astro` — reference `data-*-anim` attribute + `<script>` wiring
- `src/scripts/scroll-animations.js` — existing IntersectionObserver reveal system this pattern extends/replaces per section
