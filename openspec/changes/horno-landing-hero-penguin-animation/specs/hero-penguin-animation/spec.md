# Delta Spec: Hero Penguin Animation

## ADDED Requirements

### Requirement: Sprite Sheet Asset

The system SHALL provide a valid PNG sprite sheet at `public/penguin-sprite.png`.

The sprite sheet MUST:
- Be a horizontal strip of exactly **4 frames**
- Each frame MUST be **64×64 px** at 1× DPR
- Total dimensions: **256×64 px** (4 × 64)
- Use **PNG-8** or **PNG-24** lossless format
- Color palette limited to brand palette: magenta `#a81452`, crema `#fbebde`, naranja `#f49d50`, and black `#1a1a1a` for outline
- Background MUST be **transparent**

#### Scenario: Sprite sheet loads correctly

- GIVEN the landing page is accessed
- WHEN the browser requests `public/penguin-sprite.png`
- THEN the image loads with dimensions 256×64 px and renders without 404

---

### Requirement: CSS Sprite Animation

The system SHALL animate the penguin sprite using CSS `background-position` with `steps(4)` timing.

The animation MUST:
- Target `.penguin-sprite` class on the hero container
- Animate `background-position` from `0 0` to `-256px 0`
- Use `steps(4)` timing function — no interpolation
- Run for **0.6s** per cycle
- Loop infinitely with `animation-iteration-count: infinite`
- Use `image-rendering: pixelated` to preserve hard pixel edges

#### Scenario: Animation plays on loop

- GIVEN the page has loaded
- WHEN no `prefers-reduced-motion` preference is detected
- THEN the penguin cycles through 4 frames at 0.6s/cycle, indefinitely

#### Scenario: Reduced-motion fallback

- GIVEN the user has `prefers-reduced-motion: reduce` active
- WHEN the page loads or the browser detects the preference
- THEN the animation is **paused** and only **frame 1** (static pose) is shown
- AND no looping occurs

---

### Requirement: Hero Layout Integration

The penguin sprite container SHALL replace the existing cheesecake image in the hero right column.

The integration MUST:
- Use a `<div>` with class `.penguin-sprite` and inline `width`/`height` or CSS
- Set container to **64×64 px** logical size, scaling via CSS to ~200–280px display
- Reserve exact dimensions via `aspect-ratio: 1 / 1` or explicit width/height attributes
- Set `background-image: url('/penguin-sprite.png')`
- Set `background-size: 256px 64px` (total sheet)
- Keep existing two-column grid on desktop (text 60% / image 40%)
- Stack vertically on mobile with penguin below text

#### Scenario: Responsive scaling

- GIVEN the hero is displayed on a 1440px desktop viewport
- WHEN the penguin container is visible
- THEN the sprite renders at device pixel ratio with no blur, using `image-rendering: pixelated`
- AND the layout matches the existing two-column grid proportions

- GIVEN the hero is displayed on a 375px mobile viewport
- WHEN the penguin container is visible
- THEN the layout stacks with text above the penguin sprite
- AND the sprite scales proportionally without distortion

---

### Requirement: Accessibility

The penguin animation SHALL respect accessibility requirements.

The implementation MUST:
- Add `aria-hidden="true"` to the sprite container (decorative)
- NOT make the penguin a focusable element
- Ensure CTAs remain keyboard-navigable and visible
- Pause animation completely when `prefers-reduced-motion: reduce` is detected

#### Scenario: Screen reader compatibility

- GIVEN a screen reader user lands on the page
- WHEN the reader encounters the hero section
- THEN the penguin sprite is hidden (`aria-hidden="true"`) and does not announce motion

---

### Requirement: Performance Constraints

The sprite sheet and animation SHALL meet performance budgets.

- Sprite sheet file size: **≤ 8 KB** (PNG-8, 256×64 px is well within this)
- No layout shift (CLS = 0) from sprite load — container dimensions reserved in HTML
- Animation runs on compositor thread via CSS (no JS animation loop)
- No external dependencies beyond the PNG asset

#### Scenario: No layout shift on load

- GIVEN the page starts loading
- WHEN the sprite image begins downloading
- THEN the container already occupies 64×64 px of space
- AND the layout does not shift when the image decodes

---

## Acceptance Criteria

| # | Criterion | Validation |
|---|-----------|------------|
| AC1 | Sprite sheet is 256×64 px PNG with 4 transparent frames | Check file dimensions and frame count |
| AC2 | CSS `steps(4)` animation cycles through all 4 frames | Visual inspection at 0.6s/cycle |
| AC3 | `prefers-reduced-motion` shows only static frame 1 | DevTools motion preference test |
| AC4 | `aria-hidden="true"` on sprite container | Inspect DOM |
| AC5 | No CLS from sprite load | Lighthouse CLS = 0 |
| AC6 | `image-rendering: pixelated` applied | Visual inspection — no blur at 2× DPR |
| AC7 | Responsive: desktop two-column, mobile stacked | Browser responsive test |
| AC8 | CTAs still keyboard-navigable | Tab key navigation test |

---

## Technical Spec Summary

| Property | Value |
|----------|-------|
| Frames | 4 |
| Frame size | 64×64 px @1× |
| Total sheet | 256×64 px |
| Format | PNG-8 or PNG-24, transparent |
| Animation | CSS `steps(4)`, 0.6s, infinite |
| DPR handling | `image-rendering: pixelated` |
| Reduced-motion | `animation-play-state: paused`, frame 1 only |
| Accessibility | `aria-hidden="true"`, non-focusable |