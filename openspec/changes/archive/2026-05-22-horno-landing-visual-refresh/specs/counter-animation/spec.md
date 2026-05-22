# counter-animation Specification

## Purpose

Animate numeric counters when they enter the viewport, displaying key metrics (e.g., limited spots remaining) with a smooth count-up effect.

## Requirements

### Requirement: Viewport Entry Trigger

The system MUST use IntersectionObserver to detect when a counter element enters the viewport. The animation MUST trigger when the element is at least 50% visible.

### Requirement: Count-Up Animation

The counter MUST animate from `0` to the target value over 1500ms using `requestAnimationFrame`. The easing MUST be `ease-out` (decelerating). The target value MUST be read from a `data-target` attribute on the element.

### Requirement: Duration and Speed

The system MUST NOT animate if `prefers-reduced-motion: reduce` is set. The animation MUST complete within 2000ms maximum regardless of target value.

### Requirement: Number Formatting

The final displayed number MUST be formatted as a locale-aware string (Ecuadorian Spanish: dot separator for thousands). The system SHOULD display the formatted number during animation (not just at the end).

### Requirement: No Re-Animation on Re-Scroll

Once a counter has completed its animation, scrolling away and returning MUST NOT re-trigger the animation. The `is-animated` class MUST be added to prevent re-animation.

#### Scenario: Counter animates when viewport enters

- GIVEN a counter element with `data-target="150"` exists
- WHEN the element becomes 50% visible
- THEN the counter begins animating from 0 to 150 over 1500ms

#### Scenario: Reduced motion prevents animation

- GIVEN `prefers-reduced-motion: reduce` is set
- WHEN a counter element becomes visible
- THEN the counter displays the final target value immediately without animation

#### Scenario: Counter does not re-animate on re-entry

- GIVEN a counter has completed its animation and has `is-animated` class
- WHEN the user scrolls away and back
- THEN the counter remains at its final value without restarting animation

#### Scenario: Number displays formatted during animation

- GIVEN the target value is `1500`
- WHEN the counter is partway through animation (e.g., at value 750)
- THEN the display shows `1.500` (formatted with dot separator) rather than `750`

#### Scenario: Large number animation stays within 2s

- GIVEN a counter target is `10000`
- WHEN the counter animates
- THEN animation duration remains capped at 2000ms (faster increment per frame)