# Verification Report — `b2b-business-landing`

- **Change**: b2b-business-landing (`/negocios` B2B outbound collateral page)
- **Repo / branch**: horno-landing @ `docs/sdd-b2b-spec-design`
- **Mode**: Full artifacts (proposal + spec + design + tasks; no standalone `apply-progress.md` file — deviation/risk notes live inline in `tasks.md`)
- **Commits verified**: `9d7c1bc`, `dfbfec1`, `11fef78`, `42de10a`
- **Verified at**: 2026-07-24T20:56:10Z
- **Verdict**: **PASS WITH WARNINGS** (2 CRITICAL test-coverage gaps found — implementation is correct on manual inspection, but automated regression protection is narrower than the spec scenarios claim; see CRITICAL section)

## Task Completeness

All tasks in `tasks.md` are checked `[x]` across Phase 1a, 1b, 2, and 3. No unchecked implementation task found. One self-documented deviation: task 3.3 records slice 1b measured 574 changed lines (over the 400-line review budget) — acknowledged in-file, not hidden. This is a process/workload-guard miss, not a spec violation (WARNING, not CRITICAL).

## Command Chain Evidence

```
npm run test        → 8 test files, 58/58 passed (Duration 1.98s)
npm run build        → astro build clean, output: "static", dist/negocios/index.html generated,
                        sitemap-index.xml created, 2 pages built, 0 errors
npm run test:e2e      → 67 tests run, 66 passed, 1 failed:
                        tests/e2e/hero-penguin.spec.ts:32 "animation respects prefers-reduced-motion"
                        Expected "0% 0%", Received "0px 0px" — pre-existing, unrelated to this change
                        (confirmed against clean tree before this change existed, per orchestrator brief)
```

Matches the expected baseline exactly: 58 unit passing, build clean, 66/67 E2E passing with the one
known pre-existing failure. No stray `astro preview` process was running (checked via `ps aux`), so
the four catalog-batch e2e-fixtures tests were not at risk of the documented harness trap, and none
failed.

Isolated re-run of `tests/e2e/negocios.spec.ts` alone: **12/12 passed**, including both the `/negocios`
page suite and the `Homepage hand-off to /negocios` suite.

## Spec Compliance Matrix

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Route and Static Rendering | **Satisfied** | `src/pages/negocios.astro` imports only `BaseLayout`, `BusinessSegmentRow`, `business-segments`, `config` — no `~/lib/api` anywhere in the chain (checked `BaseLayout.astro:2-3`, `config.ts` has zero imports). Built JS bundles (`dist/_astro/hoisted*.js`, `magnetic-cta.*.js`) contain zero `fetch(`/`XMLHttpRequest` occurrences project-wide. E2E test `negocios.spec.ts:4` asserts 200 + non-generic title — passed. |
| 2 | Segment Data Contract (count/uniqueness) | **Satisfied** | `src/lib/business-segments.ts:23-94` — 4 entries, slugs `cafeterias, colegios, clubes, empresas`, unique. `tests/unit/business-segments.test.ts:39-45` asserts length 4, unique slugs, exact pitch order — passed. |
| 3 | Segment content completeness | **Satisfied** | Test `business-segments.test.ts:47-53` — non-empty title/lead, `bullets.length >= 2` for all 4 — passed. |
| 4 | Media is optional, `clubes` has none | **Satisfied** | `clubes` entry (`business-segments.ts:62-74`) has no `media` key. Unit test `business-segments.test.ts:55-61` confirms `media` undefined and record otherwise valid — passed. E2E `negocios.spec.ts:19-24` confirms `figure` and `img` counts are **0** inside the `clubes` row in the *rendered* page (not just hidden) — passed. Verified independently against built `dist/negocios/index.html`: clubes row markup contains no `<figure>`/`<img>` at all. |
| 5 | No Price Figures | **Partially satisfied — see CRITICAL-1** | `business-segments.ts` copy is guarded by `PRICE_PATTERN` regex in `business-segments.test.ts:14-15,89-93` — passed for segment data. Manually scanned the full built `dist/negocios/index.html` (all page-level copy: H1, lead, proof line, §3 steps, §5 product list, §6 volume framing, JSON-LD `description`) against the same pattern plus `offers`/`priceRange`/`"price"` keys — zero matches, currently compliant. **But no automated test covers page-level copy** — only segment-data copy is regression-protected. |
| 6 | Ecuadorian Tuteo Copy Only | **Partially satisfied — see CRITICAL-1** | Same split as above: `VOSEO_PATTERN` regex (`business-segments.test.ts:10,83-87`) only scans `BUSINESS_SEGMENTS` strings — passed. Manually scanned built `dist/negocios/index.html` (all page-level copy) against the identical regex — zero matches, currently compliant, but unguarded by CI. |
| 7 | Sanctioned Proof Point Only | **Satisfied, weak test — see WARNING-1** | Rendered page contains "+120 pedidos entregados" and "3 años horneando en Loja" (`negocios.astro:70-74`). Grepped all digit-containing text nodes in built HTML: only `+120`, and step numerals `1 2 3 4` (aria-hidden, `negocios-step-number`), and the `3` in "3 años" — no other numeric claim. E2E test `negocios.spec.ts:54-66` passed, but it only asserts absence of `[data-countdown]`/`[data-testimonial]`/`[data-stat]:not([data-stat='proof'])` selectors rather than scanning for arbitrary numeric text — a hypothetical future stray statistic without one of those data attributes would not be caught by this test. Manual text-node scan closes that gap for the current state only. |
| 8 | Per-Segment WhatsApp CTA | **Satisfied** | `segmentWhatsappLink()` (`business-segments.ts:96-98`) wraps `whatsappLink()`. Unit test `business-segments.test.ts:72-81` asserts `^https://wa\.me/` and decoded text contains segment name for all 4 — passed. E2E `negocios.spec.ts:34-52` re-asserts on the rendered DOM — passed. CTA message text assumes prior contact ("Hola, ya conversamos sobre pedidos para tu cafetería...") satisfying "assumes the in-person pitch already happened." |
| 9 | All Four Segments Render | **Satisfied** | `negocios.astro:112-114` maps `BUSINESS_SEGMENTS` through `BusinessSegmentRow`. E2E `negocios.spec.ts:16-17` asserts `[data-negocios-segment]` count === 4 — passed. |
| 10 | Volume Pricing Framing Without Figures | **Satisfied, manual-only for figure-free claim — see CRITICAL-1** | §6 copy (`negocios.astro:155-158`): "El precio por unidad mejora según el volumen y la frecuencia..." — conveys volume/frequency scaling, no figures. Same automated-coverage gap as req. 5/6: this string is not scanned by any test. |
| 11 | Reduced-Motion-First Entrance Animation | **Satisfied** | `src/scripts/negocios-animation.js:16-27` — `motionQuery.matches` branch checked and handled *first*, before the `else` timeline branch; `gsap` import has zero `ScrollTrigger` reference anywhere in the file (`rg` confirmed no `ScrollTrigger` string in the module). E2E `negocios.spec.ts:100-120` (reduced-motion, opacity stays `1` at 500ms) and `:122-134` (standard motion, opacity settles to `1` at 2200ms) both passed. Confirmed no CSS rule sets base opacity on `[data-negocios-anim]`/`.negocios-hero` elements, so the reduced-motion test is not vacuously true — it genuinely distinguishes the `gsap.set(clearProps)` path from a still-animating timeline. |
| 12 | SEO and Sharing Metadata | **Satisfied** | Title = "Pedidos para negocios en Loja — El Horno del Pingüino" (`negocios.astro:15`), distinct from homepage title. E2E `negocios.spec.ts:4-11` and `:78-98` (sitemap-index 200 + XML content-type + `/negocios` present in a referenced per-page sitemap) both passed. |
| 13 | No Console Errors on Load | **Satisfied** | E2E `negocios.spec.ts:68-76` — 0 console error events recorded — passed. |

## Hard Checks Requested by Orchestrator

- **No-price-figures guard genuinely catches price-shaped strings**: yes for segment data (regex tested against `$5`, `5 usd`, `5 dólares`, `5 ctv`, `5 centavos` shapes) — but only applied to `business-segments.ts`, not page copy (see CRITICAL-1).
- **No price figure anywhere in rendered page or JSON-LD**: confirmed via manual grep of built `dist/negocios/index.html` — zero matches for currency/price pattern and zero `offers`/`priceRange`/`"price"` keys in the embedded JSON-LD (`negocios.astro:20-28`, matches design's "no `offers` array" decision).
- **No-voseo guard not weakened**: regex in `business-segments.test.ts:10` is character-for-character identical to the spec's required pattern `contás|querés|tenés|podés|hacé|escribinos|\bvos\b`. Confirmed no voseo forms anywhere in `business-segments.ts`, `negocios.astro`, or `BusinessSegmentRow.astro` via manual regex scan of both source and built HTML.
- **`clubes` no-media requirement**: confirmed conditional rendering (`hasMedia && segment.media && (<figure>...)`) in `BusinessSegmentRow.astro:40-52` — not rendered-then-hidden. Verified in built HTML: zero `<figure>`/`<img>` bytes inside the `clubes` row markup. CSS (`global.css:711-717`) assigns no reserved gutter column to `.negocios-row--text`, so no empty space is held either.
- **No network dependency**: `negocios.astro` → `BaseLayout.astro` → `config.ts` (no imports) and `business-segments.ts` (imports only `~/lib/config`) — `src/lib/api.ts` is not in the import graph at any depth. Corroborated by zero `fetch`/`XMLHttpRequest` occurrences in any built JS bundle.
- **Motion**: `negocios-animation.js` has no `ScrollTrigger` import/reference; reduced-motion branch (`if (motionQuery.matches)`) precedes the `else` timeline branch — matches design's GSAP Entrance Plan exactly, including easing (`power3.out` only, no `back.out`).
- **Homepage hand-off**: `BusinessBridge.astro:26` primary CTA `href="/negocios"`, secondary WhatsApp action retained (`:29`). `Hero.astro:17` (desktop nav) and `:34` (mobile nav) both `href="/negocios"`. Route confirmed present in `dist/` after build: `dist/negocios/index.html` exists.
- **Only sanctioned proof points**: confirmed "+120 pedidos entregados" and "3 años horneando en Loja" are the only numeric claims rendered; no invented statistic, testimonial, or urgency device found anywhere on the page (manual text-node scan of built HTML, see req. 7 above).

## Issues

### CRITICAL

- **CRITICAL-1 — No-price and no-voseo guards do not cover page-level copy, only segment data.**
  The spec's "No Price Figures" and "Ecuadorian Tuteo Copy Only" scenarios both open with "GIVEN all
  segment **and page** copy strings." The only automated test enforcing these regexes
  (`tests/unit/business-segments.test.ts:83-93`) scans `BUSINESS_SEGMENTS` exclusively. It does not
  touch `negocios.astro`'s inline copy: H1, lead paragraph, proof line, the 4 "how we work" steps,
  the §5 product `dl` (Minitortas/Minidonas descriptions + flavours line), the §6 volume-framing
  paragraph, the closing CTA heading, or the two WhatsApp intro/closing message templates built at
  `negocios.astro:10-11`. All of that copy is currently compliant on manual inspection (verified by
  regex-grepping the built `dist/negocios/index.html`), but nothing in CI would catch a future edit
  that reintroduces a price figure or a voseo form in page-level copy — which is exactly the failure
  mode the design doc says this module exists to prevent ("no prices and no voseo enforced by CI
  rather than reviewer etiquette" — design.md, "content lives in a typed module" decision). Per the
  verify hard rule, a spec scenario with no passing covering test for part of its GIVEN clause is not
  fully satisfied even when current content happens to comply.
  **Recommendation**: add an e2e or unit-level test that regex-scans the full rendered `/negocios`
  body text (or at minimum the seven inline-section copy strings in `negocios.astro`) against both
  patterns before archiving, or explicitly accept this as a documented residual risk.

### WARNING

- **WARNING-1 — "Sanctioned proof point only" e2e test is narrower than the spec scenario.**
  `negocios.spec.ts:54-66` asserts absence of `[data-countdown]`, `[data-testimonial]`, and
  `[data-stat]:not([data-stat='proof'])` selectors, not an actual scan for "any other numeric claim."
  A future contributor could add a bare numeric statistic in prose (no special data attribute) without
  this test catching it. Currently compliant per manual verification; recommend hardening the test to
  scan rendered text nodes for stray digit sequences outside the proof/step-numeral allowlist.

- **WARNING-2 — Review workload budget exceeded and self-reported.**
  `tasks.md:70` documents slice 1b measured 574 changed lines (552 insertions + 22 deletions) against
  the 400-line review budget, despite the pre-planned 1a/1b split designed specifically to stay under
  it. This is transparently disclosed in-file, not hidden, and does not affect spec correctness — flagged
  per the SDD Review Workload Guard for the record.

- **WARNING-3 — Design deviations from `design.md`, both non-breaking.**
  (a) §5 "Product line" was designed as photography reuse; shipped implementation is a text-only
  product `dl` with a code comment explaining the change (avoids a duplicate image and a
  heading/photo mismatch — commit `42de10a`). No spec requirement mandates photography here, so this
  does not break any requirement.
  (b) The media-row grid split was designed as 4/3/5 columns; shipped CSS (`global.css:699-709`) uses
  4/4/4, documented in a CSS comment as a fix for CTA label wrapping at the originally-designed
  3-column width. No spec requirement dictates exact column spans.

### SUGGESTION

- None beyond the above. Implementation quality, copy register, and motion behavior otherwise match
  the design and spec closely, including subtleties like the `clubes` interior placement (3rd of 4,
  not last) and the absence of any `shadow-*`, `penguin-*`, or `data-magnetic` markers on this page
  (confirmed via `rg` — zero matches in `negocios.astro` and `BusinessSegmentRow.astro`).

## Design Coherence

Reviewed against `design.md` in full. Architecture decisions (single static route, typed content
module separate from frontmatter, only `BusinessSegmentRow` extracted, no `ScrollTrigger`,
`BaseLayout` reuse without `offers`) all match the shipped code. Two non-breaking deviations are
documented above (WARNING-3). Component tree, interfaces/contracts (`SegmentSlug`, `SegmentMedia`,
`BusinessSegment`, `segmentWhatsappLink`), and data-flow (`src/lib/api.ts` excluded) all match
`design.md` verbatim.

## Final Verdict

**PASS WITH WARNINGS.** All 13 spec requirements are satisfied by the shipped implementation on
direct inspection of source and built output, and the full command chain matches the expected
baseline exactly (58 unit / clean build / 66 of 67 e2e, with the one pre-existing unrelated failure).
The one CRITICAL finding (CRITICAL-1) is a test-coverage gap, not a functional defect: the page's
non-segment copy currently complies with the no-price and no-voseo rules but has zero automated
regression protection, which is a real gap against the spec's own "GIVEN all segment and page copy
strings" wording. Recommend closing CRITICAL-1 (add a page-copy regex guard) before archiving, or
explicitly accepting it as a known, documented risk if the owner prefers to proceed.
