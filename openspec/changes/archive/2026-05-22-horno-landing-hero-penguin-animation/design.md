# Design: Hero Pixel-Art Penguin Animation

## Technical Approach

Sprite sheet PNG (256×64 px, 4 frames) + CSS `steps(4)` animation. Pure CSS, no JavaScript animation loop. GPU-composited via `background-position`. The penguin replaces the `<img>` in Hero.astro's right column while preserving the surrounding card container and responsive grid.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Animation mechanism | CSS `background-position` + `steps(4)` | Individual `<img>` frames, GIF, Lottie | GPU-composited, zero JS overhead, crisp pixel edges |
| Asset format | PNG-8 sprite sheet (256×64) | SVG, WebP, multiple PNGs | Single HTTP request; `image-rendering: pixelated` works on backgrounds |
| Sprite authoring | Node.js script + `sharp` | Piskel, Aseprite | Reproducible, version-controlled; `sharp` is already a transitive Astro dependency |
| Scaling strategy | CSS `width`/`height` with `image-rendering: pixelated` | `transform: scale()` | Avoids layout complications; explicit dimensions reserve space |

## Component Design

`Hero.astro` right column changes:

```astro
<div class="relative">
  <div class="aspect-square rounded-[2rem] overflow-hidden shadow-soft ring-1 ring-white/50 relative bg-white flex items-center justify-center">
    <div class="penguin-sprite" aria-hidden="true"></div>
  </div>
  <!-- badge and status pill remain unchanged -->
</div>
```

- Replace `<img>` with `<div class="penguin-sprite" aria-hidden="true">`
- Keep card container for visual consistency
- Remove gradient overlay (not needed for transparent sprite)

## Sprite Sheet Authoring Plan

**Tool**: Node.js script using `sharp` (already installed via Astro).

**Script**: `scripts/generate-penguin-sprite.js`

**Frame specification** (4 frames, 64×64 each):

| Frame | Description |
|-------|-------------|
| 1 | Static pose — penguin holding bowl at chest level |
| 2 | Mixing down — bowl lowered, one wing stirring |
| 3 | Mixing up — bowl raised, other wing stirring |
| 4 | Return to static — transitional frame back to pose 1 |

**Color palette** (brand colors):

| Code | Color | Usage |
|------|-------|-------|
| `#` | `#1a1a1a` | Outline, eyes, feet |
| `M` | `#a81452` | Apron, chef hat band |
| `C` | `#fbebde` | Belly, face |
| `O` | `#f49d50` | Beak, feet accents |
| `W` | `#ffffff` | Chef hat |
| `.` | transparent | Background |

**Data format**: Each frame defined as an array of 64 strings (rows of 64 chars). The script iterates pixels, maps codes to RGBA, composites 4 frames horizontally, and writes `public/penguin-sprite.png` as a transparent PNG.

**Execution**: `node scripts/generate-penguin-sprite.js`

**Fallback**: If the script fails, use Piskel (piskelapp.com) with the same frame specs and palette, export as PNG sprite sheet.

## CSS Animation Implementation

Added to `src/styles/global.css`:

```css
.penguin-sprite {
  --sprite-display: 224px;
  width: var(--sprite-display);
  height: var(--sprite-display);
  background-image: url('/penguin-sprite.png');
  background-size: calc(var(--sprite-display) * 4) var(--sprite-display);
  background-repeat: no-repeat;
  image-rendering: pixelated;
  animation: penguin-mix 0.6s steps(4) infinite;
}

@media (min-width: 640px) {
  .penguin-sprite { --sprite-display: 240px; }
}

@media (min-width: 1024px) {
  .penguin-sprite { --sprite-display: 256px; }
}

@keyframes penguin-mix {
  from { background-position: 0 0; }
  to   { background-position: calc(var(--sprite-display) * -3) 0; }
}

@media (prefers-reduced-motion: reduce) {
  .penguin-sprite {
    animation: none;
    background-position: 0 0;
  }
}
```

The keyframes shift `background-position` by exactly 3 display-frame widths (`-3×`), because `steps(4)` divides the animation into 4 discrete stops. The final keyframe value is never rendered; it is the boundary. Container dimensions are reserved in HTML, eliminating layout shift.

## Responsive Strategy

- **Desktop (≥1024px)**: Two-column grid unchanged. Sprite at 256×256 px, centered in the right column card.
- **Tablet (640–1023px)**: Sprite at 240×240 px.
- **Mobile (<640px)**: Layout stacks vertically (existing `grid` behavior). Sprite at 224×224 px, centered below text.
- No grid or breakpoint changes required; existing `lg:grid-cols-[1.1fr_0.9fr]` handles layout.

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Decorative only | `aria-hidden="true"` on `.penguin-sprite` |
| Non-focusable | No `tabindex`, no `href`, no keyboard trap |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` pauses animation and shows frame 1 |
| CTA preservation | All hero links and buttons remain unchanged and tab-accessible |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| E2E | Sprite visible, no 404 | Playwright: `page.goto('/')`, assert `.penguin-sprite` is visible |
| E2E | Reduced motion respected | Playwright: emulate `prefers-reduced-motion: reduce`, assert `animation-play-state: paused` via computed style |
| E2E | `aria-hidden` present | Playwright: assert `.penguin-sprite` has `aria-hidden="true"` |
| E2E | No layout shift | Lighthouse CLS audit = 0 (container dimensions explicit) |
| E2E | Responsive scaling | Playwright: test at 375px, 768px, 1440px viewports |
| Visual | Pixelated rendering | Manual inspection at 2× DPR — edges must be sharp |

## File Changes

| File | Action | Est. Lines | Description |
|------|--------|-----------|-------------|
| `public/penguin-sprite.png` | Create | 0 (binary) | Generated sprite sheet asset |
| `scripts/generate-penguin-sprite.js` | Create | ~80 | Sprite generation script with pixel maps |
| `src/components/Hero.astro` | Modify | ~12 | Replace `<img>` with `.penguin-sprite` div |
| `src/styles/global.css` | Modify | ~30 | Add `.penguin-sprite`, keyframes, reduced-motion |
| `tests/e2e/hero-penguin.spec.ts` | Create | ~40 | E2E tests for visibility, a11y, reduced-motion |

**Estimated total**: ~162 lines (excluding binary). Well within the 400-line review budget.

## Rollback Plan

1. Revert `src/components/Hero.astro` to restore `<img src="/chesscake-hero.png">`
2. Revert `src/styles/global.css` to remove `.penguin-sprite` and keyframes
3. Delete `public/penguin-sprite.png`
4. Delete `scripts/generate-penguin-sprite.js`
5. Delete `tests/e2e/hero-penguin.spec.ts`

Rollback is a single `git revert` of the implementation commit, or manual deletion of the 5 changed/created files.

## Open Questions

- None. All technical decisions are resolved.
