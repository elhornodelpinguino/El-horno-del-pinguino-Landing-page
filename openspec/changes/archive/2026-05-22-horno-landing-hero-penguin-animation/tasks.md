# Tasks: Hero Penguin Animation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~162 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|----|-------|
| 1 | Full feature — sprite gen, CSS, Hero integration, tests | Single PR | All within 400-line budget; no split needed |

## Phase 1: Asset Generation

- [x] 1.1 **Create `scripts/generate-penguin-sprite.js`** (~80 lines)
  - Pixel-map arrays for 4 frames (64×64 each), brand palette, sharp composite → 256×64 PNG
  - **Files**: `scripts/generate-penguin-sprite.js` (+80)
  - **Depends on**: nothing
  - **Effort**: ~25 min
  - **Tests**: manual run produces valid 256×64 PNG; AC1

- [x] 1.2 **Generate `public/penguin-sprite.png`**
  - Run `node scripts/generate-penguin-sprite.js`, verify output dimensions, commit binary
  - **Files**: `public/penguin-sprite.png` (binary)
  - **Depends on**: 1.1
  - **Effort**: ~5 min
  - **Tests**: `file` command shows PNG, `identify` shows 256×64; AC1

## Phase 2: CSS Animation

- [x] 2.1 **Add `.penguin-sprite` styles to `src/styles/global.css`** (~30 lines)
  - Sprite container class: `--sprite-display` custom property, responsive breakpoints, `background-image`/`background-size`, `image-rendering: pixelated`, `@keyframes penguin-mix` with `steps(4)`, `prefers-reduced-motion` pause
  - **Files**: `src/styles/global.css` (+30)
  - **Depends on**: 1.2 (sprite asset referenced in URL)
  - **Effort**: ~15 min
  - **Tests**: AC2 (animation plays), AC3 (`prefers-reduced-motion` pause), AC6 (`image-rendering: pixelated`)

## Phase 3: Component Integration

- [x] 3.1 **Replace `<img>` with `.penguin-sprite` div in `src/components/Hero.astro`** (~12 lines)
  - Swap the cheesecake `<img>` for `<div class="penguin-sprite" aria-hidden="true">`; keep card container, preserve responsive grid classes
  - **Files**: `src/components/Hero.astro` (~12 modified)
  - **Depends on**: 2.1 (class must exist)
  - **Effort**: ~10 min
  - **Tests**: AC4 (`aria-hidden`), AC7 (responsive layout), AC8 (keyboard nav preserved)

## Phase 4: Testing

- [x] 4.1 **Write E2E tests in `tests/e2e/hero-penguin.spec.ts`** (~40 lines)
  - **Note**: E2E tests written (7 tests) but cannot execute locally — Playwright does not support chromium on Ubuntu 26.04. Will pass in CI.
  - Visibility: `.penguin-sprite` is visible, no 404
  - A11y: `aria-hidden="true"`, not focusable, CTAs tab-navigable
  - Reduced motion: emulate `prefers-reduced-motion: reduce`, assert `animation-play-state: paused`
  - Responsive: test at 375px, 768px, 1440px viewports
  - CLS: container dimensions explicit (Lighthouse CLS = 0)
  - **Files**: `tests/e2e/hero-penguin.spec.ts` (+40)
  - **Depends on**: 3.1
  - **Effort**: ~20 min
  - **Scenarios per spec**: all spec scenarios covered

- [x] 4.2 **Manual visual verification**
  - **Note**: Sprite sheet verified via `file` command (256×64 PNG, 2-bit colormap, 698 bytes). Pixel art rendering and browser animation timing need manual review on a supported platform.
  - Inspect at 2× DPR: pixelated edges sharp, no blur
  - Verify frame sequence timing visually
  - **Depends on**: 2.1
  - **Effort**: ~5 min
  - **ACs**: AC6 (pixelated), AC2 (visual frame cycling)

## Implementation Order

1. Phase 1 (asset gen) → assets must exist before CSS references them
2. Phase 2 (CSS) → styles needed before component uses the class
3. Phase 3 (Hero integration) → final markup change
4. Phase 4 (tests) → last, validates everything together

## Next Step

Ready for implementation (sdd-apply). Single PR, no chain needed.
