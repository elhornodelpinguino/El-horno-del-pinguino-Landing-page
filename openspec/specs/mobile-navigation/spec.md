# mobile-navigation Specification

## Purpose

Implement a hamburger menu for viewports under 768px with keyboard-accessible toggle and focus management.

## Requirements

### Requirement: Hamburger Toggle Button

The system MUST render a `<button>` with `aria-expanded` and `aria-controls` attributes in the header. The button MUST display a visible label or icon indicating the menu state. On mobile (<768px), the button MUST be visible; on desktop (≥768px), the button MUST be hidden.

### Requirement: Navigation Menu Visibility Toggle

When the hamburger button is activated, the system MUST toggle a `data-menu-open` attribute on the `<nav>` element. CSS MUST show the menu when `data-menu-open="true"` and hide it when `data-menu-open="false"`.

### Requirement: Focus Trap Within Open Menu

When the menu is open, Tab key navigation MUST remain within the menu until the user closes it. The system MUST trap focus inside the open menu; pressing Escape MUST close the menu and return focus to the hamburger button.

### Requirement: Keyboard Activation

The hamburger button MUST be activatable via Enter and Space keys. The menu MUST NOT open on arrow key press.

### Requirement: Touch Target Size

The hamburger button and all interactive menu links MUST have a minimum touch target of 44×44px on mobile viewports.

### Requirement: aria Attributes

The hamburger button MUST have `aria-label="Abrir menú"` when closed and `aria-label="Cerrar menú"` when open. The nav element MUST have matching `id` referenced by `aria-controls`.

#### Scenario: Menu opens on button click

- GIVEN the user is on mobile viewport
- WHEN the user clicks/taps the hamburger button
- THEN `aria-expanded` becomes `true`, `data-menu-open="true"` is set on nav, menu is visible

#### Scenario: Menu closes on second click

- GIVEN the menu is open (`data-menu-open="true"`)
- WHEN the user clicks the hamburger button again
- THEN `aria-expanded` becomes `false`, `data-menu-open="false"`, menu is hidden, focus returns to button

#### Scenario: Escape key closes menu

- GIVEN the menu is open and focus is on a menu link
- WHEN the user presses Escape
- THEN the menu closes, focus returns to hamburger button

#### Scenario: Focus trapped while menu open

- GIVEN the menu is open and focus is on the last menu link
- WHEN the user presses Tab
- THEN focus moves to the first menu link (trap loop)

#### Scenario: Button hidden on desktop

- GIVEN the viewport width is ≥768px
- WHEN the page renders
- THEN the hamburger button has `display: none` or `visibility: hidden` in CSS