# Proposal: horno-landing-visual-refresh

## Intent

Improve the Astro landing page for "Horno del Pingüino" by adding scroll-triggered animations, visual hierarchy polish, lightweight interactivity, and better responsive behavior — all without migrating away from Astro or introducing heavy JS frameworks.

## Scope

### In Scope
- Scroll-triggered entrance animations using IntersectionObserver + CSS transitions
- Mobile hamburger menu with Astro script islands
- FAQ accordion via native `<details>`/`<summary>` or minimal JS
- Hover/touch effect refinements on ProductGrid and CTAs
- Counter animation for LimitedSpots on viewport entry
- Responsive spacing and typography tweaks
- Touch-friendly tap targets

### Out of Scope
- Migration to React/Vue/Svelte
- New pages, routing changes, or backend/API changes
- Complex state management libraries
- Dark mode

## Capabilities

### New Capabilities
- `scroll-animations`: Entrance and scroll-triggered animations using IntersectionObserver
- `mobile-navigation`: Hamburger menu and responsive navigation patterns
- `faq-accordion`: Expandable/collapsible FAQ section
- `counter-animation`: Animated number counters
- `responsive-polish`: Touch-friendly and spacing improvements

### Modified Capabilities
- None (no existing main specs; this is a visual/interaction layer addition)

## Approach

Use Astro's zero-JS-by-default model: add `<script>` islands only where interactivity is needed. Animations via `IntersectionObserver` toggling CSS classes. Accordion via native `<details>` or minimal JS. Mobile menu via Astro script island toggling CSS classes. Counters via `requestAnimationFrame` in isolated scripts. Tailwind utility classes for all styling changes. No external animation libraries.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/` | Modified | Update existing section components for animations/interactivity |
| `src/layouts/` | Modified | Header/nav changes for mobile menu |
| `src/pages/index.astro` | Modified | Adjust section ordering/spacing if needed |
| `tests/` | Modified | Add/update E2E tests for accordion, menu, counters |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bundle size increase from JS islands | Low | Only 3–4 minimal `<script>` islands; audit with `astro build` |
| Accessibility regressions | Med | Test keyboard nav, focus traps, `prefers-reduced-motion` |
| Playwright/Vitest failures | Low | Run full test suite after each task; TDD mode active |
| CSS specificity conflicts | Low | Stick to Tailwind utilities; avoid custom CSS overrides |

## Rollback Plan

Revert to previous Git commit or restore backed-up `src/components/` and `src/layouts/` folders. No database or API changes involved.

## Dependencies

- None external; relies on existing Astro + Tailwind stack

## Success Criteria

- [ ] All 9 sections have scroll-triggered entrance animations
- [ ] Mobile hamburger menu works on `<768px`
- [ ] FAQ accordion opens/closes with keyboard support
- [ ] Counter animates on viewport entry
- [ ] `npm run test` and `npx playwright test` pass
- [ ] Changed lines ≤ 400
