# faq-accordion Specification

## Purpose

Provide an accessible FAQ section with expand/collapse behavior using native `<details>`/`<summary>` elements or minimal JS, with keyboard navigation support.

## Requirements

### Requirement: Accordion Item Structure

Each FAQ item MUST use a `<details>` element containing a `<summary>` element for the trigger and a `<div>` for the content panel. The `<summary>` MUST be the only interactive child of `<details>`.

### Requirement: Keyboard Navigation

The `<summary>` element MUST be focusable and activatable via Enter and Space keys. Arrow Down/Up keys MUST move focus between `<summary>` elements when focused.

### Requirement: Smooth Open/Close Animation

The system SHOULD animate the content panel height from `0` to `auto` on open/close. If CSS-only animation is not possible, a minimal JS script MUST handle `max-height` transitions over 300ms.

### Requirement: Exclusive Open (Optional Enhancement)

The system MAY implement "single-open" behavior where opening one item closes others. If implemented, only one `<details>` may be open at a time.

### Requirement: Visual Indicator

Each `<summary>` MUST display an animated chevron or arrow icon that rotates 180° when the item is open. The icon MUST be inside the `<summary>` element.

### Requirement: WCAG 2.1 AA — Contrast

Text contrast between FAQ question text and background MUST be at least 4.5:1. The interactive `<summary>` must have a 3:1 contrast ratio against background when not focused, and 4.5:1 when focused.

### Requirement: Touch-Friendly Tap Target

The `<summary>` element MUST have a minimum height of 44px on mobile viewports to ensure a comfortable touch target.

#### Scenario: FAQ item opens on click

- GIVEN the user clicks a `<summary>` element
- WHEN the click event fires
- THEN the `<details>` element gains the `open` attribute, content panel is visible

#### Scenario: FAQ item closes on second click

- GIVEN the `<details>` is open
- WHEN the user clicks the `<summary>` again
- THEN the `open` attribute is removed, content panel collapses

#### Scenario: Arrow key navigates between items

- GIVEN focus is on a `<summary>` element
- WHEN the user presses Arrow Down
- THEN focus moves to the next `<summary>` element

#### Scenario: Enter key activates summary

- GIVEN focus is on a `<summary>` element
- WHEN the user presses Enter
- THEN the associated `<details>` toggles its open state

#### Scenario: Content animates smoothly

- GIVEN a `<details>` element is opening
- WHEN the `open` attribute is added
- THEN the content panel transitions height over 300ms with `ease-out`