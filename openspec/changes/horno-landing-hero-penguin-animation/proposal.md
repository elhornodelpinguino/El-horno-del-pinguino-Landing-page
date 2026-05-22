# Proposal: Hero Pixel-Art Penguin Animation

## Intent

Replace the static cheesecake hero image with an animated pixel-art penguin chef mascot to reinforce the "Horno del Pingüino" brand identity and add playful, memorable character to the landing page.

## Scope

### In Scope
- Author a 4-frame pixel-art sprite sheet (PNG) of a penguin chef mixing in a bowl
- Implement CSS `steps()` sprite animation in the hero
- Replace current hero image section; keep text and CTAs unchanged
- Add `prefers-reduced-motion` fallback and accessibility attributes
- Ensure responsive scaling and crisp pixel rendering

### Out of Scope
- Sound effects or interactive penguin behavior
- Replacing the logo or navbar
- Lottie, GIF, WebP, or SVG inline pixel animation
- Generative AI sprite creation (pixel art will be hand-authored or commissioned)

## Capabilities

### New Capabilities
- `hero-penguin-animation`: Pixel-art sprite animation rendering and lifecycle

### Modified Capabilities
- None (visual replacement only; no spec-level behavior changes)

## Approach

**Sprite sheet PNG + CSS `steps()` animation.** A single horizontal sprite sheet with 4 frames. CSS animates `background-position` using `steps(4)` for frame-perfect playback without tweening. `image-rendering: pixelated` preserves hard edges when scaling.

**Sprite specs:** 64×64 px per frame, 256×64 px total sheet. Colors drawn from brand palette: magenta apron, cream belly, orange beak/accents, ink outline. Authoring via Aseprite or Piskel.

**Hero composition:** The penguin replaces the current right-column image container. Desktop keeps the two-column grid; mobile stacks vertically. The penguin container uses `aspect-square` or `aspect-[4/5]` to match the replaced image’s footprint, avoiding layout shift.

**Animation spec:** 4-frame idle mixing loop, 0.6s duration, `steps(4)` timing, `infinite` iteration, no easing (step function is the easing). First frame is the static pose shown when `prefers-reduced-motion: reduce` is active.

**Accessibility:** Decorative animation gets `aria-hidden="true"`. Respect `prefers-reduced-motion: reduce` by pausing animation and showing frame 1. Focusable elements remain the CTAs, not the mascot.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/Hero.astro` | Modified | Replace image block with penguin sprite container |
| `public/penguin-sprite.png` | New | Sprite sheet asset |
| `src/styles/global.css` | Modified | Add `.penguin-sprite` keyframes and reduced-motion rule |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Sprite sheet authoring delay | Med | Fallback to static frame 1 PNG if animation asset slips |
| `image-rendering: pixelated` unsupported in old WebViews | Low | Acceptable visual degradation; modern browsers OK |
| Layout shift on load | Low | Reserve exact sprite container dimensions in HTML |

## Rollback Plan

Revert `Hero.astro` to previous commit restoring `<img src="/chesscake-hero.png">`. Remove `public/penguin-sprite.png` and delete `.penguin-sprite` CSS.

## Dependencies

- Aseprite, Piskel, or similar pixel-art tool for sprite sheet authoring

## Success Criteria

- [ ] Sprite sheet renders crisply at 1× and 2× DPR with no blur
- [ ] Animation loops smoothly at 60fps on desktop and mobile
- [ ] `prefers-reduced-motion: reduce` shows static frame, no motion
- [ ] Hero text and CTAs remain unchanged and fully accessible
- [ ] No layout shift during sprite load
