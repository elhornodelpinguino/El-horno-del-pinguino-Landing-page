# Design: horno-landing-visual-refresh

## Technical Approach

Add lightweight interactivity via Astro `<script>` islands (4 total) while preserving zero-JS-by-default for static content. Scroll animations use `IntersectionObserver` toggling CSS classes. Mobile nav, FAQ accordion, and counter each carry isolated vanilla JS. All styling stays in Tailwind utilities; animation keyframes live in `global.css`.

## Architecture Decisions

| Decision | Options | Tradeoff | Chosen |
|----------|---------|----------|--------|
| JS delivery | 4 `<script>` islands vs one bundled module | Islands load only where needed; slight duplication acceptable | 4 isolated `<script>` islands |
| Scroll trigger | IntersectionObserver vs scroll event listener | IO is performant and native; no deps | IntersectionObserver |
| FAQ interaction | Native `<details>` vs custom divs | Details gives free keyboard/ARIA; needs JS only for smooth height + arrow nav | `<details>`/`<summary>` with minimal JS |
| Counter easing | CSS `@property` vs `requestAnimationFrame` | RAF gives exact easing control and locale formatting | `requestAnimationFrame` with ease-out |
| Animation CSS | Tailwind arbitrary values vs `@layer utilities` | `@layer` is cleaner, avoids arbitrary class bloat | `global.css` `@layer utilities` |

## Data Flow

```
Astro SSR (zero JS)
  └─ Hero ──► mobile-nav.js (toggle data-menu-open, focus trap)
  └─ Sections ──► scroll-animations.js (IO → is-visible class)
  └─ FAQ ──► faq-accordion.js (arrow nav, smooth max-height)
  └─ LimitedSpots ──► counter-animation.js (IO → RAF count-up)
```

No shared state. Each script queries its own DOM scope on `DOMContentLoaded`.

## File Changes

| File | Action | Description | Est. Lines |
|------|--------|-------------|------------|
| `src/styles/global.css` | Modify | Add `.animate-on-scroll`, `.is-visible`, `.animate-group`, `.animate-item`, `prefers-reduced-motion` override | +35 |
| `src/components/Hero.astro` | Modify | Add hamburger `<button>`, mobile nav overlay `<div>`, `<script>` island for toggle/focus trap | +55 |
| `src/components/FAQ.astro` | Modify | Refactor static cards to `<details>`/`<summary>`; add chevron + `<script>` for arrow nav & smooth open | +40 |
| `src/components/LimitedSpots.astro` | Modify | Add `<span data-target="{N}" class="counter">` + `<script>` for RAF count-up | +20 |
| `src/components/ProductGrid.astro` | Modify | Add `animate-on-scroll` / `animate-group` classes to section and cards | +8 |
| `src/components/HowToOrder.astro` | Modify | Add `animate-on-scroll` / `animate-group` classes to section and step cards | +8 |
| `src/components/SpecialEditions.astro` | Modify | Add `animate-on-scroll` / `animate-group` classes to section and cards | +8 |
| `src/components/Trust.astro` | Modify | Add `animate-on-scroll` / `animate-group` classes to section and grid items | +8 |
| `src/pages/index.astro` | Modify | Add shared `<script type="module" src="../scripts/scroll-animations.js">` at bottom of `<main>` | +4 |
| `tests/e2e/visual-refresh.spec.ts` | Create | E2E: mobile menu toggle, focus trap, Escape, FAQ open/close/arrow nav, counter animation, reduced-motion skip | +75 |
| `tests/unit/counter.test.ts` | Create | Unit: easeOut function, formatter, cap logic | +30 |

**Total estimated**: ~291 lines (well under 400 budget).

## Interfaces / Contracts

### Animation CSS Contract
```css
.animate-on-scroll { opacity: 0; transform: translateY(20px); transition: all 400ms ease-out; }
.animate-on-scroll.is-visible { opacity: 1; transform: translateY(0); }
.animate-group .animate-item { transition-delay: calc(var(--i, 0) * 100ms); }
@media (prefers-reduced-motion: reduce) {
  .animate-on-scroll { opacity: 1; transform: none; transition: none; }
}
```

### Counter JS Contract
```ts
type CounterElement = HTMLElement & { dataset: { target: string } };
// RAF loop: value = easeOut(elapsed / duration) * target
// Format: new Intl.NumberFormat('es-EC').format(value)
// Guard: add `is-animated` class on completion; skip if present.
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `easeOut(t)`, `formatCounter(n)` | Vitest — pure functions, no DOM |
| E2E | Mobile menu open/close, focus trap, Escape, FAQ keyboard nav, scroll animations appear, counter counts up, `prefers-reduced-motion` skips animation | Playwright — `emulateMedia({ reducedMotion: 'reduce' })`, `page.keyboard.press`, `page.evaluate` for IO trigger |
| E2E | No horizontal scroll 320–1920px | Playwright `page.setViewportSize` loop |
| E2E | Tap targets ≥44px on mobile | Playwright `expect(locator).toHaveCSS('min-height', '44px')` |

## Migration / Rollout

No data migration. No backend changes. Rollback: revert Git commit or restore `src/components/` and `src/styles/global.css` from backup. Feature is visual-only; safe to rollback instantly.

## Open Questions

- None — all dependencies (Astro, Tailwind, IO, RAF) are native and already in the project.
