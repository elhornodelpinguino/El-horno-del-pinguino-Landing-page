# Proposal: B2B outbound collateral page (`/negocios`)

## Intent

The owner sells B2B by walking into cafés, schools, clubs and companies and pitching in person.
Businesses do not search for him. Today there is nothing to leave behind: the homepage is now 100%
B2C (consumers 16–30) and `BusinessBridge` only dumps the reader into WhatsApp with a cold "Pedir
cotización". The decision inputs a business buyer actually needs — consistent portioning, volume
cadence, agreed delivery windows, restocking, proof of sale — exist nowhere on the site.

This change builds one shareable page the owner pastes into WhatsApp after a visit, or shows on his
phone during one. Success = he stops re-explaining the offer by voice note.

## Scope

### In Scope

- New static route `src/pages/negocios.astro` (single page, in-page sections per segment).
- Typed segment data module `src/lib/business-segments.ts` — 4 segments: cafeterías,
  colegios/escuelas, **clubes** (new), empresas.
- Section-scoped CSS appended to `src/styles/global.css`; one quiet entrance script.
- Homepage hand-off: `BusinessBridge` primary CTA → `/negocios`, WhatsApp demoted to secondary;
  `Hero.astro` nav anchors (lines 17, 34) `#negocios` → `/negocios`.
- Vitest unit coverage for the segment module + Playwright route spec.

### Out of Scope

- Price figures of any kind (owner decision — pricing stays a WhatsApp conversation).
- Aria Text G2 adoption. Stay on Fraunces/Poppins; the brand-guide gap is real debt, deferred.
- `SpecialEditions.astro` / `LimitedSpots.astro` — untouched, unrendered, undeleted.
- `BusinessUseCases.astro` — data shape is migrated, the component file is left on disk untouched.
- Any `src/lib/api.ts` dependency. The page must render with zero network calls; it is shown live,
  on mobile data, mid-pitch.
- New photography, per-segment sub-routes, contact forms, `hero-penguin.spec.ts:32`.

## Capabilities

### New Capabilities

- `business-landing`: the `/negocios` outbound-collateral route — section contract, typed segment
  data, CTA behavior (post-pitch framing, prefilled WhatsApp per segment), no-price invariant,
  tuteo copy invariant, sharing metadata, motion restraint, and the homepage hand-off.

### Modified Capabilities

- None. No existing spec (`mobile-navigation`, `faq-accordion`, `counter-animation`,
  `responsive-polish`, `hero-penguin-animation`, `scroll-animations`) constrains link targets or
  business content, so the hand-off is covered as a requirement inside `business-landing`.

## Approach

### Page structure

| # | Section | Intent | Sample copy (Ecuadorian Spanish, tuteo) |
|---|---------|--------|------------------------------------------|
| 1 | Identity header | Cold-open orientation: who this is, from where, for whom. Logo mark + location, no site nav clutter. | H1: "Postres artesanales para tu vitrina, tu evento y tu equipo." Sub: "Minitortas y minidonas hechas a mano en Loja." |
| 2 | Proof line | The single sanctioned proof point. One number, stated flatly — elegance is not overselling. | "+120 pedidos entregados." |
| 3 | How we work with you | The real gap. A genuine 4-step sequence (portion definition → volume and cadence → delivery window → restock), so numbered markers are earned, not decoration. | "Definimos la porción y los sabores contigo." / "Coordinamos la entrega en la fecha y hora que te sirve." |
| 4 | Segments (×4) | One editorial row per segment with 2–3 operational bullets and its own prefilled WhatsApp CTA, so the owner links straight to the row he just pitched. | Clubes: "Postres para tus eventos y reuniones de socios, en cantidades que puedes anticipar." |
| 5 | Product line | Minitortas and minidonas, signature flavours (frutos rojos, maracuyá, Oreo), using existing `public/` photography. | "Frutos rojos, maracuyá y Oreo son los que más se repiten." |
| 6 | Volume framing | States that unit price scales with volume and frequency **without a single figure**. | "El precio por unidad mejora según el volumen y la frecuencia. Lo conversamos con tu cantidad y tus fechas." |
| 7 | Closing CTA | Assumes the pitch already happened. | "Ya nos conocimos. Cuéntanos qué necesitas y te armamos la propuesta." |

### "More elegant", concretely

| Axis | B2C page today | `/negocios` |
|------|----------------|-------------|
| Surfaces | `rounded-3xl` + `shadow-card` candy cards | flat surfaces, hairline `border-horno-magentaDeep/15`, generous vertical rhythm |
| Type | frequent mid-sentence colour swaps | Fraunces at larger sizes, tighter tracking, one colour per heading; Poppins body at longer measure |
| Palette | orange as repeated motif | weighted to `magentaDeep` / `ink`; orange used once, as a single accent |
| Imagery | pixel-art chef penguins | product photography only; **no penguin sprites on this page** |
| Motion | multiple effects | one fade/slide-up entrance via the existing `data-negocios-anim` + `src/scripts/negocios-animation.js` convention, reduced-motion branch first, no ScrollTrigger wrapper |

**Clubes without an asset**: segment rows are text-led, with media as an *optional* slot. A segment
with no photo renders as a typographic row with the space reallocated to the copy measure — never an
empty frame or placeholder box. This also makes future segments cheap to add.

### Reuse plan

| Component | Decision |
|-----------|----------|
| `BusinessUseCases.astro` | Not imported. Its `{title, copy, bullets, message}` shape is migrated and widened into `src/lib/business-segments.ts` (adds `slug`, optional `media`, 4th segment). File left untouched; deletion belongs to a separate dead-code cleanup. |
| `BusinessBridge.astro` | Kept on the homepage. Primary CTA `href` → `/negocios` ("Ver la propuesta para negocios"); the existing `whatsappLink(...)` becomes the secondary action. ~10 changed lines. |
| `Hero.astro` | Both nav anchors point at `/negocios`. ~2 changed lines. |
| `src/lib/config.ts` | `SITE` + `whatsappLink()` reused as-is, unchanged. |
| `BaseLayout.astro` | Reused unchanged via its `title` / `description` / `ogImage` / `canonicalUrl` props. |

### Testing (strict TDD active)

The segment module exists precisely so this change has RED-GREEN-REFACTOR logic instead of
untestable markup. `tests/unit/business-segments.test.ts` (written first) asserts:

1. exactly 4 segments, in pitch order, with unique slugs;
2. every segment has non-empty title, copy and ≥2 bullets;
3. every WhatsApp URL is a valid `wa.me` link whose encoded text names its segment;
4. `clubes` is present and valid **with no media asset** (media is optional by contract);
5. **no voseo** — copy fails on `contás|querés|tenés|podés|hacé|escribinos|\bvos\b`;
6. **no price figures** — copy fails on any currency/number-price pattern.

Rules 5 and 6 turn two owner decisions into executable guarantees rather than review etiquette.
`tests/e2e/negocios.spec.ts` mirrors `smoke.spec.ts`: 200 + title, four segment sections rendered,
all CTA `href`s valid, `/negocios` in the sitemap, zero console errors.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/negocios.astro` | New | The route |
| `src/lib/business-segments.ts` | New | Typed segment data + message builders |
| `src/scripts/negocios-animation.js` | New | Single entrance timeline |
| `src/styles/global.css` | Modified | Appended `.negocios-*` block |
| `src/components/BusinessBridge.astro` | Modified | Primary CTA → `/negocios` |
| `src/components/Hero.astro` | Modified | Nav anchors → `/negocios` |
| `tests/unit/business-segments.test.ts`, `tests/e2e/negocios.spec.ts` | New | Coverage |

## Delivery: 400-line budget forecast

**Forecast ≈ 520–590 changed lines — over budget. Split recommended.**

| Slice | Contents | Est. lines |
|-------|----------|-----------|
| **PR 1 — page + data** | `business-segments.ts`, unit tests, `negocios.astro`, CSS block, entrance script, e2e spec | ~330 |
| **PR 2 — homepage hand-off** | `BusinessBridge` CTA, `Hero` anchors, navigation e2e assertion | ~80 |

Order matters: PR 1 must land first so nothing links to a 404. Each slice is independently
shippable — after PR 1 the owner can already paste the link; PR 2 only routes existing traffic.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No visual asset exists for `clubes` | High (known) | Optional-media segment layout; a missing photo reads as intentional whitespace, not a hole |
| No B2B-context photography (café shelf, school event, office) | High | Launch with existing `public/` product photos; log a shoot as follow-up — it would strengthen sections 4–5 materially |
| Omitting prices adds WhatsApp back-and-forth | Medium | Deliberate owner tradeoff: no price data exists, and inventing tiers would be fabrication. Section 6 sets the expectation that price scales with volume |
| Brand-guide typeface (Aria Text G2) vs shipped Fraunces | Medium | Out of scope by decision — fixing it for one page would fracture site consistency. Track as brand debt |
| Page shown live on mobile data mid-pitch | Medium | Zero backend calls, no `api.ts`, static output, reuse already-deployed images |
| `LimitedSpots.astro:24` fake urgency counter `data-target="15"` | Low (dead code) | Not live and not touched here. Flagged as a separate cleanup worth doing — a fabricated scarcity counter contradicts the real-proof-only stance |
| `hero-penguin.spec.ts:32` misread as a regression | Medium | Pre-existing and unrelated; `sdd-verify` must exclude it |
| Split not honoured → oversized PR | Medium | Guard lines above; `sdd-tasks` must carry the two-slice plan |

## Rollback Plan

The change is additive. Full rollback = `git revert` of both slices, in reverse order:

1. Revert PR 2 → `BusinessBridge` and `Hero` return to direct `wa.me` links. Homepage is back to its
   current behavior with no other side effects.
2. Revert PR 1 → `/negocios`, the segment module, the CSS block, the script and both test files
   disappear. Nothing else imports them.

Emergency partial pull (page is wrong mid-campaign, no time for a full revert): revert PR 2 first,
then delete `src/pages/negocios.astro`. No data migration, no config change, no backend, no build
setting is touched. Deploy is a static rebuild via the existing deploy hook.

## Dependencies

- None external. Brand assets already in `public/`; `whatsappLink()` already shipped.

## Success Criteria

- [ ] `/negocios` renders standalone with no backend call and no console errors.
- [ ] All four segments render, including `clubes`, with no empty media frames.
- [ ] Zero price figures and zero voseo forms on the page, enforced by unit tests.
- [ ] Every CTA opens WhatsApp with a prefilled message naming its segment.
- [ ] Homepage `#negocios` nav and `BusinessBridge` reach `/negocios`; WhatsApp stays available.
- [ ] `npm run test && npm run build && npm run test:e2e` passes, `hero-penguin.spec.ts:32` excluded.
- [ ] Each PR slice stays under the 400-line review budget.

## Proposal question round

Execution mode is `automatic`, so these were not asked live. The eight exploration questions are
resolved by owner decision and recorded above. Three assumptions still deserve owner confirmation
before `sdd-apply`:

1. May the page state "3 años horneando en Loja" as factual context alongside "+120 pedidos
   entregados", or is +120 the only figure allowed to appear at all?
2. Should each segment CTA name its segment in the prefilled WhatsApp message (helps the owner
   triage incoming chats), or is one shared message preferred?
3. Is a print/PDF-friendly variant of `/negocios` ever needed for in-person visits without signal,
   or is the shared link always sufficient?
