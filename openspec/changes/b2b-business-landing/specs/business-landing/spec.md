# business-landing Specification

## Purpose

Defines the `/negocios` outbound-collateral route: a static, network-free page the owner shares
after (or during) an in-person B2B pitch. Covers page/section structure, the typed segment data
contract, copy invariants (no prices, no voseo), CTA behavior, accessibility, motion, offline
resilience, and SEO metadata. Excludes homepage hand-off wiring, which is out of scope for this
spec (see proposal Modified Capabilities: none).

## Requirements

### Requirement: Route and Static Rendering

The system MUST serve `/negocios` as a static Astro page that renders without any call to
`src/lib/api.ts` or any other network dependency.

#### Scenario: Route responds successfully offline-safe

- GIVEN the built site is served
- WHEN a client requests `/negocios`
- THEN the response status MUST be 200
- AND the page MUST NOT issue any network request to a product-admin API

### Requirement: Segment Data Contract

The system MUST expose a typed module `src/lib/business-segments.ts` containing exactly 4
segments — `cafeterias`, `colegios`, `clubes`, `empresas` — with unique slugs, in pitch order.

#### Scenario: Segment count and uniqueness

- GIVEN `business-segments.ts` is imported
- WHEN the exported segment list is inspected
- THEN it MUST contain exactly 4 entries with unique `slug` values

#### Scenario: Segment content completeness

- GIVEN any segment entry
- WHEN its fields are inspected
- THEN `title` and `copy` MUST be non-empty
- AND it MUST have 2 or more bullets

#### Scenario: Media is optional and clubes has none

- GIVEN the `clubes` segment
- WHEN its `media` field is inspected
- THEN `media` MAY be absent
- AND the segment MUST remain valid without it (no placeholder or empty frame is rendered)

### Requirement: No Price Figures

The system MUST NOT present any price, currency amount, or numeric unit cost anywhere on
`/negocios`, in copy or in segment data.

#### Scenario: Copy guard rejects price patterns

- GIVEN all segment and page copy strings
- WHEN scanned against a currency/numeric-price pattern
- THEN no match MUST be found

### Requirement: Ecuadorian Tuteo Copy Only

All copy on `/negocios` MUST use Ecuadorian tuteo and MUST NOT use Rioplatense voseo forms.

#### Scenario: Copy guard rejects voseo forms

- GIVEN all segment and page copy strings
- WHEN scanned against the pattern `contás|querés|tenés|podés|hacé|escribinos|\bvos\b`
- THEN no match MUST be found

### Requirement: Sanctioned Proof Point Only

The page MUST present only the sanctioned proof points ("+120 pedidos entregados" and the
business being 3 years old) and MUST NOT display any other statistic, urgency counter, or
testimonial.

#### Scenario: Proof line renders the sanctioned figure

- GIVEN the rendered page
- WHEN the proof section is inspected
- THEN it MUST contain the text "+120 pedidos entregados"
- AND it MUST NOT contain any other numeric claim, countdown, or fabricated testimonial

### Requirement: Per-Segment WhatsApp CTA

Each of the 4 segments MUST render a CTA linking to a valid `wa.me` URL whose prefilled message
text names that segment, and the CTA copy MUST assume the in-person pitch already happened.

#### Scenario: Each segment CTA is a valid, segment-named WhatsApp link

- GIVEN a rendered segment row
- WHEN its CTA `href` is inspected
- THEN it MUST match `^https://wa\.me/`
- AND the URL-decoded message text MUST include a reference to that segment

### Requirement: All Four Segments Render

`/negocios` MUST render a distinct section for each of the 4 segments, including `clubes`
without a media asset.

#### Scenario: Four segment sections present

- GIVEN the rendered `/negocios` page
- WHEN the segment sections are counted
- THEN there MUST be exactly 4, one per segment slug, including `clubes`

### Requirement: Volume Pricing Framing Without Figures

The page MUST state that unit price scales with volume and frequency without disclosing any
number.

#### Scenario: Volume framing section present and figure-free

- GIVEN the rendered page
- WHEN the volume-framing section is inspected
- THEN it MUST convey that price scales with volume/frequency
- AND it MUST contain no numeric price figure (covered by the no-price-figures guard)

### Requirement: Reduced-Motion-First Entrance Animation

`/negocios` MUST use a single quiet entrance animation following the existing
`data-negocios-anim` + `src/scripts/negocios-animation.js` convention, evaluating the
reduced-motion branch first.

#### Scenario: Reduced motion is honored

- GIVEN a client with `prefers-reduced-motion: reduce`
- WHEN `/negocios` loads
- THEN no animated transition MUST play beyond the reduced-motion branch

#### Scenario: Standard motion is a single entrance

- GIVEN a client without reduced-motion preference
- WHEN `/negocios` loads
- THEN exactly one fade/slide-up entrance MUST play, with no marquee, magnetic CTA, or looping
  sprite effects

### Requirement: SEO and Sharing Metadata

`/negocios` MUST provide a page title, description, and be reachable via the sitemap.

#### Scenario: Title and sitemap reachability

- GIVEN the built site
- WHEN `/negocios` is loaded and `/sitemap-index.xml` is requested
- THEN the page title MUST be present and non-generic
- AND `/sitemap-index.xml` MUST return 200 with XML content-type

### Requirement: No Console Errors on Load

`/negocios` MUST load without emitting browser console errors.

#### Scenario: Clean console on load

- GIVEN a client navigating to `/negocios`
- WHEN the page finishes loading
- THEN zero console error events MUST be recorded
