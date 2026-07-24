# Exploration — B2B outbound-collateral page (`/negocios`)

Change: `b2b-business-landing`
Phase: `sdd-explore`
Status: done → ready for `sdd-propose`

## Framing

Businesses will not find this page by searching. The owner visits cafés, schools, clubs and
companies in person and pitches. The page is **outbound sales collateral** — a link pasted into
WhatsApp after a visit, or shown on a phone during one. It must therefore be shareable standalone
and must not be written as inbound lead capture.

## Current State

**Site architecture**: Astro 4.16, `output: "static"`, single page today (`src/pages/index.astro`).
A new page is just a new `.astro` file under `src/pages/`; the sitemap integration picks it up
automatically. No adapter work required.

> Verified by the orchestrator: `astro.config.mjs:7` declares `output: "static"` and
> `@astrojs/node` is absent from `package.json`. The `openspec/config.yaml` context line claiming
> "SSR with @astrojs/node (standalone)" was stale and has been corrected.

**B2C repositioning (commit `8bb2840`)**: `index.astro` no longer imports `BusinessUseCases`. It
renders `BusinessBridge` at `#negocios` — a compact block whose CTA currently opens `wa.me`
directly, because no dedicated page exists yet to link to. `Hero.astro`'s desktop and mobile nav
both point `#negocios` at that bridge.

**Homepage voice** is now fully consumer-personal. `MiniFormat`'s copy ("Sin sobras en la refri,
sin partir nada, sin compartir si no quieres") is explicitly individual-portion framing — the wrong
register for a business buyer, which confirms a dedicated surface is needed rather than an adapted
homepage section.

**Layout/CSS conventions**: `BaseLayout.astro` is fully parameterized (`title`, `description`,
`ogImage`, `canonicalUrl`, `jsonLd`) and reusable unchanged. `global.css` is one growing stylesheet
with section-scoped class blocks appended per component — no component uses Astro scoped `<style>`.
GSAP entrance animations follow a strict convention: `data-{section}-anim` attributes plus
`src/scripts/{section}-animation.js`, reduced-motion branch first, entrance timelines never wrapped
in `ScrollTrigger`.

**Testing**: Vitest unit tests cover only pure TS modules; there is no existing pattern for testing
`.astro` markup directly. Playwright `tests/e2e/smoke.spec.ts` is the template for route-level
coverage (200 status, title, WhatsApp CTA `href` validity, no console errors, sitemap reachability).

**Voseo check**: `src/` was grepped for Rioplatense forms — no true positives remain. The tuteo
constraint is currently satisfied site-wide. New copy must not reintroduce voseo.

## Affected Areas

| Path | Involvement |
| --- | --- |
| `src/pages/negocios.astro` | new route (to create) |
| `src/components/BusinessBridge.astro` | CTA `href` hand-off to the new route |
| `src/components/Hero.astro` | nav anchor `#negocios` may become a real route link |
| `src/components/BusinessUseCases.astro` | reuse data shape, rewrite voice and visuals |
| `src/styles/global.css`, `tailwind.config.mjs` | theme/typography gap vs brand guide |
| `src/lib/config.ts` | `SITE` and `whatsappLink()` reusable as-is |
| `src/lib/api.ts` | deliberately NOT used — no live catalog dependency |

## Brand Asset Inventory

Source: `/home/alejandro/Documents/Negocio/el-horno-del-pinguino-branding`

- **Logos/marks** (`01_identidad_visual/`): full family in transparent PNG across color/black/white
  variants, plus vector SVGs. Directly usable; SVGs preferred for header/footer marks.
- **Product photography** (`05_fotos_producto/`): only **2 photos** exist (cheesecake frutos rojos,
  vertical + horizontal). Neither is minitorta/minidona-specific, and none show volume, café,
  school or office context. The repo's own `public/` holds more usable, already-deployed product
  photography — the better source for this change.
- **Typography gap**: the brand guide specifies **Aria Text G2** for identity and Poppins for
  functional web text. The implemented Tailwind theme uses **Fraunces** as `font-display`,
  established site-wide. Aria Text G2 is not loaded as a web font anywhere. Unresolved brand debt;
  deliberately not fixed here.
- **Palette**: guide gives magenta `#a81452`, crema `#fbebde`, naranja `#f49d50`. The theme's
  derived shades are already-shipped tints, not a violation.
- **Gap**: no icon or photo exists for the new **clubes** segment. Existing pixel-art penguin icons
  cover only empresa, colegio and cafetería.

## Structural Differences: Standalone Collateral vs. B2C Single-Page

The B2C page assumes an in-page journey (anchored nav, self-referential links, order-now framing).
The B2B page is a **cold-open link** clicked days after an in-person pitch, outside any homepage
context. It therefore needs:

- A self-contained header stating who this is and why the reader is seeing it.
- Content mapped to the buyer's real decision inputs: consistent portioning, price per unit by
  volume, agreed delivery windows, restocking cadence, proof of sale. **None of this content
  exists today** — the site has no B2B pricing tiers anywhere.
- CTA copy that assumes the pitch already happened, rather than the cold-quote framing that both
  `BusinessUseCases.astro` ("Cotizar") and `BusinessBridge.astro` ("Pedir cotización") use today.

## Route Options

| Option | Pros | Cons | Effort |
| --- | --- | --- | --- |
| `/negocios` (single static page) | Matches the existing `#negocios` anchor and nav label; easy to say aloud during a pitch; Spanish-only URL convention held | none significant | Low |
| `/negocios/[segmento]` | Hyper-tailored per visit type | 4x content to maintain; splits the social-proof story; contradicts "one link he pastes" | High |
| `/empresas` or `/b2b` | Shorter | `/empresas` semantically excludes colegios/clubes/cafeterías; `/b2b` breaks the Spanish URL convention | Low |

**Recommendation**: single static page at `/negocios`, with in-page sections per segment.

## Reuse vs Rewrite

1. **`BusinessUseCases.astro`** — reuse the **data shape** (segment: title/copy/bullets), not the
   component. Only 3 segments, CTA copy is inbound-quote framed, and the card visual language reads
   playful/consumer rather than elegant. Effort to adapt: Medium.
2. **`BusinessBridge.astro`** — reuse as-is on the homepage; change its primary CTA `href` from
   `whatsappLink(...)` to `/negocios`. Small, isolated, separately deliverable. Effort: Low.
3. **`SpecialEditions.astro` / `LimitedSpots.astro`** — confirmed dead code, imported nowhere.
   Content is fabricated, and `LimitedSpots` uses a hardcoded fake urgency counter
   (`data-target="15"`, no real scarcity data) — a dark pattern inconsistent with both "more
   elegant" and the real-social-proof-only stance. **Not reusable.** Leave untouched and unrendered;
   formal deletion is a separate cleanup change.

> Verified by the orchestrator: `src/components/LimitedSpots.astro:24` does contain
> `data-target="15"`. The component is not rendered anywhere, so nothing fake is live today.

## What "More Elegant" Means Concretely

- **Type scale**: fewer inline colour-swaps mid-sentence, more whitespace, Fraunces leaned into
  harder at larger sizes for an editorial feel.
- **Spacing/surfaces**: flatter surfaces and hairline borders instead of the `rounded-3xl` +
  `shadow-card` "candy" bordering used almost everywhere on the B2C page.
- **Motion restraint**: a single quiet fade/slide-up entrance. No magnetic buttons, no marquee, no
  pixel-sprite loop. Motion should read calm and credible, not playful.
- **Photography over illustration**: real product photography instead of the pixel-art chef-penguin
  iconography. Note the gap — no B2B-context photos (delivery to a café, a school event, an office)
  exist today.
- **Palette weighting**: keep the three canonical colours but lean on `magentaDeep`/`ink`, using
  orange sparingly as a single accent rather than a repeated motif.

## Testing Implications (strict TDD active)

- A page shell alone implies no unit-testable logic. Extracting segment data into a typed module
  (e.g. `src/lib/business-segments.ts`) makes it genuinely RED-GREEN-REFACTOR testable via Vitest —
  recommended so this change yields real TDD coverage.
- Primary verification surface is a new Playwright spec mirroring `smoke.spec.ts`: 200 status and
  correct title, all four segment sections present, valid contact CTA `href`, sitemap reachability,
  no console errors.
- `tests/e2e/hero-penguin.spec.ts:32` is **known-failing and unrelated** (expects
  `backgroundPosition` `"0% 0%"`, browser returns `"0px 0px"`; verified against a clean tree).
  `sdd-verify` must not misattribute it to this change.

## Open Questions for `sdd-propose`

1. Confirm `/negocios` as the final slug.
2. Does "clubes" ship with a new icon/photo, or copy-only at first?
3. Does the page display price-per-unit-by-volume figures, or does pricing stay a WhatsApp
   conversation?
4. Is `BusinessBridge`'s homepage CTA fully replaced by a link to `/negocios`, or kept as dual CTA?
5. Typeface: stay with Fraunces (consistent) or introduce Aria Text G2 per the brand guide?
6. Are `SpecialEditions`/`LimitedSpots` formally deleted here, or left untouched?
7. Is additional B2B-context photography planned, or does launch proceed with product-only photos?
8. Follow the single-growing-stylesheet convention, or introduce scoped Astro `<style>` blocks?

## Risks

- No visual asset exists for the new "clubes" segment.
- Sparse B2B-context photography overall; "proof of sale" tone may be copy-only at launch.
- Typeface gap between the brand guide (Aria Text G2) and the implemented theme (Fraunces) is
  unresolved brand debt, deliberately out of scope here.
- `.atl/skill-registry.md` is stale — several listed paths no longer resolve. Exact paths were
  injected for this phase; the registry should be refreshed before a phase runs without injection.
- Pre-existing unrelated E2E failure `tests/e2e/hero-penguin.spec.ts:32` must not be read as a
  regression.
