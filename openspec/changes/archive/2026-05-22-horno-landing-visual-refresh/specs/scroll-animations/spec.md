# scroll-animations Specification

## Purpose

Add entrance animations triggered by scroll position using IntersectionObserver, enhancing visual hierarchy without introducing heavy JS frameworks.

## Requirements

### Requirement: IntersectionObserver Class Toggling

The system SHALL use IntersectionObserver to detect when section elements enter the viewport. When 20% of an element is visible, the observer MUST add an `is-visible` class to the element.

### Requirement: CSS Transition States

The system MUST define `.animate-on-scroll` elements with `opacity: 0` and `transform: translateY(20px)` as the initial hidden state. When the `is-visible` class is added, elements MUST transition to `opacity: 1` and `transform: translateY(0)` over 400ms with `ease-out` timing.

### Requirement: Staggered Animation for Grouped Elements

When a container element (`.animate-group`) receives `is-visible`, all direct child elements with class `.animate-item` MUST receive the class with a staggered delay of 100ms per item (max 5 items).

### Requirement: prefers-reduced-motion Support

The system MUST check `window.matchMedia('(prefers-reduced-motion: reduce)')` at runtime. If true, the system MUST skip all animation class toggling and set all `.animate-on-scroll` elements to `opacity: 1` immediately.

### Requirement: Performance — No Layout Shift

All animated elements MUST have explicit dimensions or use `min-height` to reserve space before animation. The system MUST NOT cause Cumulative Layout Shift (CLS) above 0.1 as measured by Lighthouse.

#### Scenario: Section enters viewport on scroll

- GIVEN the user scrolls and a section's `.animate-on-scroll` element reaches 20% visibility
- WHEN IntersectionObserver fires
- THEN the `is-visible` class is added within one animation frame

#### Scenario: Reduced motion preference detected

- GIVEN `prefers-reduced-motion: reduce` is set in OS/browser
- WHEN the page loads or the media query changes
- THEN all animated elements display immediately without delay or transition

#### Scenario: Grouped items animate with stagger

- GIVEN a `.animate-group` container with 3 `.animate-item` children becomes visible
- WHEN IntersectionObserver fires
- THEN item 1 receives `is-visible` at t+0ms, item 2 at t+100ms, item 3 at t+200ms

#### Scenario: Reserved space prevents layout shift

- GIVEN an animated element with unknown content height
- WHEN the element is not yet visible
- THEN the element's `min-height` equals its final height to prevent CLS