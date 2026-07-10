# Delta for scroll-animations

## ADDED Requirements

### Requirement: Pinned Scrubbed Step Advancement (HowToOrder)

The `.order-section` MUST pin (`pin: true`) with a `scrub`-driven step timeline, advancing one step sprite per scroll increment, and MUST release cleanly with no leftover pin-spacing gap after the last step. On mobile, the pinned range MUST NOT trap scroll for an unreasonable distance.

#### Scenario: Steps advance and pin releases

- GIVEN the order section's pin start is crossed
- WHEN the user scrolls through the pinned range to the last step
- THEN each step sprite advances in sync with scroll, staying pinned
- AND once the last step is reached, the section unpins with no pin-spacing gap

#### Scenario: Mobile pin does not trap scroll

- GIVEN the viewport is a mobile width
- WHEN the user scrolls through the pinned order section
- THEN scroll releases within a bounded distance, without requiring excessive scrolling

### Requirement: Scrubbed Clip-Path Rise (FinalCTA)

The FinalCTA card MUST scrub-animate its `clipPath` so it visually rises as the user scrolls the section's trigger range. Without JS, the full card MUST remain visible, never clipped or hidden.

#### Scenario: Card rises on scroll

- GIVEN the FinalCTA section's `ScrollTrigger` range is being crossed
- WHEN the user scrolls through that range
- THEN the card's `clipPath` interpolates, producing the rise effect tied to scroll position

### Requirement: Batch-Based Catalog Reveals

Catalog reveals MUST use `ScrollTrigger.batch()` instead of a `.from()` stagger, so entrances scale correctly for any product count (1 to N), including future backend-driven counts. A single product MUST reveal like a batch. Zero products MUST NOT error and MUST leave no orphaned triggers.

#### Scenario: Multiple products reveal in batches

- GIVEN the catalog renders N product cards (N > 1)
- WHEN the user scrolls the catalog into view
- THEN cards reveal in `onEnter` batches without being CSS pre-hidden

#### Scenario: Single product reveals correctly

- GIVEN the catalog renders exactly 1 product card
- WHEN the user scrolls the catalog into view
- THEN the single card reveals via `batch()`, with no stuck-invisible state

#### Scenario: Empty catalog does not error

- GIVEN the catalog renders 0 product cards
- WHEN the catalog animation script initializes
- THEN `ScrollTrigger.batch()` is not created for an empty set, and no runtime error occurs

### Requirement: Trust Checklist Stagger and Check-Icon Reveal

Trust checklist items MUST stagger in via GSAP; each item's check SVG MUST also play a small scale/rotate reveal in the same stagger.

#### Scenario: Checklist items stagger with icon reveal

- GIVEN the Trust section's `ScrollTrigger` start is crossed
- WHEN the checklist entrance timeline plays
- THEN items stagger in sequence
- AND each item's check icon animates its scale/rotate reveal alongside its item

## MODIFIED Requirements

### Requirement: GSAP-Only Content Hiding

Entrance-animated content MUST NOT be hidden via CSS before JavaScript runs. Hiding MUST come exclusively from the GSAP timeline's `.from()` tween (or scrub/pin/batch equivalent), so a script failure never leaves content permanently invisible.
(Previously: covered only `.from()` entrance timelines; now also covers pin/scrub/clip-path/batch mechanics.)

#### Scenario: JavaScript fails to load

- GIVEN the GSAP animation script for a section fails to execute (including order, final-cta, or catalog)
- WHEN the page renders
- THEN the section's content remains visible because no CSS pre-hid, clipped, or pinned it

### Requirement: prefers-reduced-motion Support

The system MUST check `window.matchMedia('(prefers-reduced-motion: reduce)')` before creating any timeline or `ScrollTrigger`. If it matches, the script MUST call `gsap.set(targets, { clearProps: "all" })` and MUST skip the timeline, `ScrollTrigger`, and any `pin`, `scrub`, or `batch()` configuration entirely.
(Previously: covered only entrance timelines/ScrollTriggers; now explicitly extends to pin/scrub/batch mechanics.)

#### Scenario: Reduced motion preference detected

- GIVEN `prefers-reduced-motion: reduce` is set in the OS/browser
- WHEN a section's animation script runs (on load or before its `ScrollTrigger` would fire)
- THEN `gsap.set(targets, { clearProps: "all" })` runs for that section's targets
- AND no timeline or `ScrollTrigger` is created for that section

#### Scenario: All sections respect reduced motion

- GIVEN `prefers-reduced-motion: reduce` is set
- WHEN the full page loads, including Hero, catalog, business, order, trust, final-cta, FAQ, and contact
- THEN every section's content is fully visible immediately, with no entrance animation, pin, scrub, or `batch()` created
