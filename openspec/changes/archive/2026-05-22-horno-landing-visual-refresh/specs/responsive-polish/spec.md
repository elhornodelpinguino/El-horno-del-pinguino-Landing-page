# responsive-polish Specification

## Purpose

Ensure all interactive elements are touch-friendly, spacing is consistent across viewports, and typography scales correctly for a polished mobile-first experience.

## Requirements

### Requirement: Touch Target Minimum Size

All interactive elements (buttons, links, form controls) MUST have a minimum touch target of 44×44px on viewports below 768px. On desktop (≥768px), the minimum MAY be reduced to 24×24px.

### Requirement: Responsive Spacing Scale

The system MUST use a consistent spacing scale: 4px base unit. All padding and margins MUST be multiples of 4px (e.g., 8px, 12px, 16px, 24px, 32px). No arbitrary spacing values are allowed.

### Requirement: Typography Scale

Body text MUST be at least 16px on mobile to prevent iOS auto-zoom on input focus. Headings MUST scale using `clamp()` for fluid responsiveness: H1 `clamp(1.75rem, 5vw, 3rem)`, H2 `clamp(1.25rem, 3vw, 2rem)`.

### Requirement: Gap Property for Flex/Grid

The system MUST use CSS `gap` property for spacing between flex or grid children instead of margins. This prevents last-child margin hacks and ensures consistent spacing.

### Requirement: No Horizontal Scroll

The system MUST ensure no horizontal scrollbar appears at any viewport width from 320px to 1920px. All content MUST reflow or wrap as needed.

### Requirement: Hover States on Interactive Elements

Interactive elements (buttons, cards, links) MUST have visible `:hover` states. On touch devices where hover cannot be detected, the `:focus-visible` state MUST serve as the primary visible feedback state.

### Requirement: Viewport Meta Tag

The page MUST include `<meta name="viewport" content="width=device-width, initial-scale=1">` to ensure proper scaling on mobile devices.

#### Scenario: Button tap target on mobile

- GIVEN a button on a 375px wide viewport
- WHEN the button renders
- THEN the clickable area is at least 44px tall and 44px wide

#### Scenario: Body text prevents iOS zoom

- GIVEN an input field on iOS Safari
- WHEN the input receives focus
- THEN the font-size is at least 16px to prevent auto-zoom

#### Scenario: No unexpected horizontal scroll

- GIVEN a viewport of 375px
- WHEN the page renders
- THEN there is no horizontal scrollbar and all content fits within 375px

#### Scenario: Grid gap provides consistent spacing

- GIVEN a grid container with 3 children
- WHEN `gap: 16px` is set
- THEN all three children have 16px spacing between them without extra margins

#### Scenario: Focus state visible on cards

- GIVEN a product card is focusable
- WHEN the user navigates via keyboard
- THEN the card has a visible `:focus-visible` outline or ring