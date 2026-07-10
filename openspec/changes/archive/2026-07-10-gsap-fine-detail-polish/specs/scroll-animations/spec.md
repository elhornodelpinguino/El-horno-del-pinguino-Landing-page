# scroll-animations Specification

## Purpose

Add entrance animations triggered by scroll position using GSAP ScrollTrigger, enhancing visual hierarchy without introducing heavy JS frameworks.

## Requirements

### Requirement: ScrollTrigger-Gated Section Entrances

Below-fold section entrance timelines (catalog, business, order, trust, final-cta, FAQ, contact) MUST be wired to a `ScrollTrigger` on their section root so the timeline plays on viewport entry, not on page load. The Hero entrance MUST remain load-triggered and MUST NOT use a `ScrollTrigger`. StickyWhatsApp, as a persistent fixed (non-section) element, MUST use a `ScrollTrigger` gated on `.hero-shell` (`start: "bottom top"`) to toggle its visibility rather than a viewport-entry entrance timeline.
(Previously: covered only below-fold section entrance timelines and the Hero load-triggered exception; now also defines the pattern for a persistent fixed element gated on a different section's scroll position.)

#### Scenario: Below-fold section enters viewport

- GIVEN a below-fold section (e.g. catalog) is outside the viewport on load
- WHEN the user scrolls past its `ScrollTrigger` start position
- THEN the section's GSAP entrance timeline plays
- AND it does not play before that position is crossed

#### Scenario: Hero entrance plays on load

- GIVEN the page has just loaded
- WHEN the Hero component mounts
- THEN the Hero entrance timeline plays immediately, not on scroll

#### Scenario: Page-bottom section reaches its trigger

- GIVEN a section sits near the page bottom (e.g. final-cta) where a `top 78%` trigger may never be crossed
- WHEN the user scrolls toward that section
- THEN its `ScrollTrigger` start is set later (e.g. `top 85%`) so the entrance fires before page end

#### Scenario: StickyWhatsApp is hidden at page top and reveals after scrolling past Hero

- GIVEN the page has just loaded and the user has not scrolled
- WHEN the Hero (`.hero-shell`) is still on screen
- THEN the WhatsApp button is in its hidden/neutral GSAP-driven state
- WHEN the user scrolls past `.hero-shell` (`start: "bottom top"` is crossed)
- THEN the button reveals via its GSAP `ScrollTrigger` toggle

#### Scenario: StickyWhatsApp re-hides when scrolling back up past Hero

- GIVEN the button has revealed after scrolling past `.hero-shell`
- WHEN the user scrolls back up so `.hero-shell` is on screen again
- THEN the button returns to its hidden/neutral state via the `toggleActions` reverse action

### Requirement: Hero Penguin Sprite Parallax Layering

The `.penguin-sprite` element MUST have its own scrub-driven `ScrollTrigger` in `src/scripts/hero-animation.js`, using the same `trigger: shell` / `start: "top top"` / `end: "bottom top"` / `scrub: true` range as the existing `.hero-card` tween, but animating `yPercent` to a distinct value so the sprite visibly separates from the card during scroll (depth effect). This trigger MUST live inside the existing reduced-motion-safe `else` branch, alongside the card's `ScrollTrigger.create`.

#### Scenario: Penguin parallaxes at a different rate than the card

- GIVEN the Hero section is rendered and `prefers-reduced-motion` is not set
- WHEN the user scrolls through the `.hero-shell` trigger range (`top top` to `bottom top`)
- THEN `.hero-card` translates via its existing `yPercent: 12` scrub tween
- AND `.penguin-sprite` translates via a separate scrub tween with a different `yPercent`, producing visible depth separation between the two

#### Scenario: Reduced motion leaves the sprite static

- GIVEN `prefers-reduced-motion: reduce` is set
- WHEN the Hero animation script runs
- THEN the `motionQuery.matches` branch executes `gsap.set(entranceTargets, { clearProps: "all" })`
- AND no `ScrollTrigger` is created for `.penguin-sprite`, so it does not translate on scroll

#### Scenario: Sprite cycle animation is unaffected by the parallax tween

- GIVEN `.penguin-sprite` has its CSS `animation: penguin-mix 1.45s steps(4, end) infinite` running on `background-position`
- WHEN the GSAP scrub tween animates `yPercent` (a `transform` property) on the same element
- THEN the CSS `steps(4, end)` background-position cycle continues uninterrupted, because `transform` and `background-position` do not collide

### Requirement: FAQ and Contact GSAP Entrances

FAQ and Contact sections MUST use dedicated GSAP entrance scripts (`faq-animation.js`, `contact-animation.js`) with `data-faq-anim` / `data-contact-anim` targets and a `ScrollTrigger`, replacing their prior IntersectionObserver reveal.

#### Scenario: FAQ section reveals via GSAP on scroll

- GIVEN the user scrolls the FAQ section into view
- WHEN the section's `ScrollTrigger` start position is crossed
- THEN the `data-faq-anim` targets animate in via the GSAP timeline

#### Scenario: Contact section reveals via GSAP on scroll

- GIVEN the user scrolls the Contact section into view
- WHEN the section's `ScrollTrigger` start position is crossed
- THEN the `data-contact-anim` targets animate in via the GSAP timeline

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

### Requirement: GSAP-Only Content Hiding

Entrance-animated content and scroll-gated visibility MUST NOT be hidden via CSS before JavaScript runs. Hiding MUST come exclusively from the GSAP timeline's `.from()` tween (or scrub/pin/batch/ScrollTrigger-toggled equivalent), so a script failure never leaves content permanently invisible.
(Previously: covered `.from()` entrance timelines and pin/scrub/clip-path/batch mechanics; now also covers ScrollTrigger-gated visibility of persistent fixed elements like StickyWhatsApp.)

#### Scenario: JavaScript fails to load

- GIVEN the GSAP animation script for a section fails to execute (including order, final-cta, or catalog)
- WHEN the page renders
- THEN the section's content remains visible because no CSS pre-hid, clipped, or pinned it

#### Scenario: StickyWhatsApp script fails to load

- GIVEN `sticky-whatsapp-animation.js` fails to execute
- WHEN the page renders
- THEN the WhatsApp button remains visible/accessible at all times, because no CSS pre-hide or `sticky-whatsapp-in` keyframe governs its visibility

### Requirement: prefers-reduced-motion Support

The system MUST check `window.matchMedia('(prefers-reduced-motion: reduce)')` before creating any timeline or `ScrollTrigger`. If it matches, the script MUST call `gsap.set(targets, { clearProps: "all" })` and MUST skip the timeline, `ScrollTrigger`, and any `pin`, `scrub`, `batch()`, or visibility-toggling configuration entirely.
(Previously: covered entrance timelines and pin/scrub/batch mechanics; now also covers StickyWhatsApp's scroll-gated visibility toggle.)

#### Scenario: Reduced motion preference detected

- GIVEN `prefers-reduced-motion: reduce` is set in the OS/browser
- WHEN a section's animation script runs (on load or before its `ScrollTrigger` would fire)
- THEN `gsap.set(targets, { clearProps: "all" })` runs for that section's targets
- AND no timeline or `ScrollTrigger` is created for that section

#### Scenario: All sections respect reduced motion

- GIVEN `prefers-reduced-motion: reduce` is set
- WHEN the full page loads, including Hero, catalog, business, order, trust, final-cta, FAQ, and contact
- THEN every section's content is fully visible immediately, with no entrance animation, pin, scrub, or `batch()` created

#### Scenario: StickyWhatsApp is immediately visible under reduced motion

- GIVEN `prefers-reduced-motion: reduce` is set
- WHEN `sticky-whatsapp-animation.js` runs
- THEN the button is set to its fully visible state via `clearProps: "all"` immediately, without waiting for scroll past `.hero-shell`
- AND no `ScrollTrigger` is created to gate its visibility
