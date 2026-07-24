# Tasks: B2B outbound collateral page (`/negocios`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | Slice 1a ~160, Slice 1b ~335, Slice 2 ~36 (total ~531) |
| 400-line budget risk | Medium (each slice individually under budget; total change over) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1a → PR 1b → PR 2 (feature-branch-chain, local commits) |
| Delivery strategy | auto-chain (local-only, no push/PR) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely commit | Notes |
|------|------|-----------|-------|
| 1a | `business-segments.ts` + Vitest guards (voseo, price, contract) | Commit 1 | Base = current branch; pure data + tests, ~160 lines |
| 1b | `/negocios` page, `BusinessSegmentRow.astro`, CSS, entrance script, E2E | Commit 2 | Base = commit 1; depends on 1a; ~335 lines |
| 2 | Homepage hand-off: `BusinessBridge`, `Hero` nav anchors | Commit 3 | Base = commit 2; depends on slice 1 complete (no 404) |

Local-only delivery: no `git push`, no PR, no deploy step. Commits land sequentially on the current feature branch for the owner to review locally.

## Phase 1a: Segment Data Module (RED → GREEN → REFACTOR)

- [x] 1a.1 RED: create `tests/unit/business-segments.test.ts` asserting exactly 4 segments with unique slugs in pitch order (spec: Segment Data Contract).
- [x] 1a.2 RED: extend test — every segment has non-empty `title`/`copy`(`lead`) and `bullets.length >= 2` (spec: Segment content completeness).
- [x] 1a.3 RED: extend test — `clubes` segment is valid with `media` absent, no placeholder asserted (spec: Media is optional).
- [x] 1a.4 RED: extend test — each `segmentWhatsappLink()` output matches `^https://wa\.me/` and decoded text includes that segment's name (spec: Per-Segment WhatsApp CTA).
- [x] 1a.5 RED: extend test — all copy strings (title, lead, bullets, ctaLabel, whatsappMessage) fail against voseo regex `contás|querés|tenés|podés|hacé|escribinos|\bvos\b` (spec: Ecuadorian Tuteo Copy Only).
- [x] 1a.6 RED: extend test — all copy strings fail against a currency/numeric-price pattern (spec: No Price Figures).
- [x] 1a.7 GREEN: create `src/lib/business-segments.ts` with `SegmentSlug`, `SegmentMedia`, `BusinessSegment` types, `BUSINESS_SEGMENTS` (4 entries, `clubes` third, no media), `segmentWhatsappLink()` wrapping `whatsappLink()` from `~/lib/config` only — no `~/lib/api` import (design: Interfaces/Contracts).
- [x] 1a.8 REFACTOR: confirm `npm run test` passes; verify no import of `src/lib/api.ts` anywhere in the module (spec: Route and Static Rendering; design: Data Flow).
- [x] 1a.9 Commit slice 1a locally: `feat(negocios): add typed business-segments data module`.

## Phase 1b: Page, Row Component, Motion, E2E

- [ ] 1b.1 RED: create `tests/e2e/negocios.spec.ts` asserting `/negocios` returns 200 and a non-generic `<title>` (spec: SEO and Sharing Metadata) — expected to fail (no route yet).
- [ ] 1b.2 RED: extend e2e spec — exactly 4 segment sections render, `clubes` renders with no empty media frame/placeholder (spec: All Four Segments Render; design: `clubes` no-asset composition).
- [ ] 1b.3 RED: extend e2e spec — every segment CTA `href` matches `^https://wa\.me/` and decodes to include its segment name (spec: Per-Segment WhatsApp CTA).
- [ ] 1b.4 RED: extend e2e spec — proof section contains "+120 pedidos entregados" and no other numeric claim/countdown/testimonial (spec: Sanctioned Proof Point Only).
- [ ] 1b.5 RED: extend e2e spec — zero console error events on load (spec: No Console Errors on Load).
- [ ] 1b.6 RED: extend e2e spec — `/sitemap-index.xml` returns 200 with XML content-type and includes `/negocios` (spec: SEO and Sharing Metadata).
- [ ] 1b.7 RED: extend e2e spec — reduced-motion pass via `page.emulateMedia({ reducedMotion: "reduce" })` shows nothing stuck at `opacity: 0` (spec: Reduced-Motion-First Entrance Animation).
- [ ] 1b.8 GREEN: create `src/components/BusinessSegmentRow.astro` — 12-col grid, media-vs-text-only variants (`.negocios-row--media` / `.negocios-row--text`), conditional `<figure>` (design: `clubes` no-asset composition).
- [ ] 1b.9 GREEN: create `src/scripts/negocios-animation.js` — reduced-motion branch first, single header entrance timeline, no `ScrollTrigger` import (design: GSAP Entrance Plan).
- [ ] 1b.10 GREEN: create `src/pages/negocios.astro` — `BaseLayout` (title/description/ogImage/canonicalUrl/jsonLd without `offers`), 7 inline sections, iterates `BUSINESS_SEGMENTS` through `BusinessSegmentRow`, volume-framing copy with no figures (spec: Route and Static Rendering, Volume Pricing Framing Without Figures; design: Component Tree).
- [ ] 1b.11 GREEN: append `.negocios-*` block to `src/styles/global.css` — bullet markers, ledger grid, media frame, numeral typography only (design: Component Tree, Visual Design table).
- [ ] 1b.12 GREEN: run `npm run test:e2e -- negocios` until all `tests/e2e/negocios.spec.ts` assertions pass.
- [ ] 1b.13 REFACTOR: confirm zero `penguin-*` classes/refs, zero `shadow-*` (focus rings excepted), zero `data-magnetic` attributes in `negocios.astro` (design: Visual Design table).
- [ ] 1b.14 Commit slice 1b locally: `feat(negocios): add /negocios page, segment row and entrance motion`.

## Phase 2: Homepage Hand-off

- [ ] 2.1 RED: extend `tests/e2e/negocios.spec.ts` (or add a homepage nav test) asserting `BusinessBridge` primary CTA and both `Hero` nav anchors navigate to `/negocios`.
- [ ] 2.2 GREEN: modify `src/components/BusinessBridge.astro` — primary CTA `href` → `/negocios`, demote existing `whatsappLink(...)` to secondary action.
- [ ] 2.3 GREEN: modify `src/components/Hero.astro` at lines 17 and 34 — `#negocios` → `/negocios`.
- [ ] 2.4 REFACTOR: confirm `npm run test:e2e` passes end-to-end for the updated navigation assertion.
- [ ] 2.5 Commit slice 2 locally: `feat(negocios): wire homepage hand-off to /negocios`.

## Phase 3: Final Verification

- [ ] 3.1 Run `npm run test && npm run build && npm run test:e2e`; confirm all pass excluding the pre-existing, unrelated `tests/e2e/hero-penguin.spec.ts:32` failure.
- [ ] 3.2 Manual check at 375px and 1280px: ledger balanced with `clubes` text-only, zero shadows, zero penguins, zero `data-magnetic` (design: Visual Design table).
- [ ] 3.3 Confirm each committed slice's diff stays under the 400-line review budget individually.
