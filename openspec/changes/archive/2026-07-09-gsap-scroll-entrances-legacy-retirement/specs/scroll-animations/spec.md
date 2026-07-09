# Delta for scroll-animations

## ADDED Requirements

### Requirement: ScrollTrigger-Gated Section Entrances

Below-fold section entrance timelines (catalog, business, order, trust, final-cta, FAQ, contact) MUST be wired to a `ScrollTrigger` on their section root so the timeline plays on viewport entry, not on page load. The Hero entrance MUST remain load-triggered and MUST NOT use a `ScrollTrigger`.

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

### Requirement: GSAP-Only Content Hiding

Entrance-animated content MUST NOT be hidden via CSS before JavaScript runs. Hiding MUST come exclusively from the GSAP timeline's `.from()` tween, so a script failure never leaves content permanently invisible.

#### Scenario: JavaScript fails to load

- GIVEN the GSAP animation script for a section fails to execute
- WHEN the page renders
- THEN the section's content remains visible because no CSS pre-hid it

## MODIFIED Requirements

### Requirement: prefers-reduced-motion Support

The system MUST check `window.matchMedia('(prefers-reduced-motion: reduce)')` at the start of every section's GSAP script, before creating any timeline or `ScrollTrigger`. If it matches, the script MUST call `gsap.set(targets, { clearProps: "all" })` on that section's targets and MUST skip the timeline and `ScrollTrigger` entirely.

(Previously: reduced-motion handling only covered the legacy IntersectionObserver system, toggling `.animate-on-scroll` elements to `opacity: 1` immediately.)

#### Scenario: Reduced motion preference detected

- GIVEN `prefers-reduced-motion: reduce` is set in the OS/browser
- WHEN a section's animation script runs (on load or before its `ScrollTrigger` would fire)
- THEN `gsap.set(targets, { clearProps: "all" })` runs for that section's targets
- AND no timeline or `ScrollTrigger` is created for that section

#### Scenario: All sections respect reduced motion

- GIVEN `prefers-reduced-motion: reduce` is set
- WHEN the full page loads, including Hero, catalog, business, order, trust, final-cta, FAQ, and contact
- THEN every section's content is fully visible immediately with no entrance animation

## REMOVED Requirements

### Requirement: IntersectionObserver Class Toggling

(Reason: replaced by per-section GSAP `ScrollTrigger` entrances, collapsing two parallel animation stacks into one.)
(Migration: `src/scripts/scroll-animations.js` is deleted; its `index.astro` import is removed; per-section GSAP scripts provide equivalent behavior.)

### Requirement: CSS Transition States

(Reason: superseded by GSAP-only hiding via `.from()` tweens; CSS pre-hiding is now disallowed.)
(Migration: legacy `.animate-on-scroll` / `is-visible` CSS rules are removed from `src/styles/global.css`.)

### Requirement: Staggered Animation for Grouped Elements

(Reason: per-element stagger is now expressed via relative position offsets in each section's GSAP timeline, not a generic `.animate-group` / `.animate-item` CSS stagger.)
(Migration: `.animate-group` / `.animate-item` classes and `--i` stagger styles are stripped from all components, including unused `LimitedSpots.astro` and `SpecialEditions.astro`.)

### Requirement: Performance — No Layout Shift

(Reason: GSAP `.from()` tweens animate only opacity/transform and never remove elements from layout, so the standalone `min-height` reservation rule is no longer needed.)
(Migration: None — no `min-height` reservation required.)
