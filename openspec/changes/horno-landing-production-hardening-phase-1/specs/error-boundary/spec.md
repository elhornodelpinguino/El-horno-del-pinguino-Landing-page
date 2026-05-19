# error-boundary Specification

## Purpose

Provide friendly Spanish-language fallback UI when data fetches fail at runtime or build time, so users never see blank sections or raw error messages.

## Requirements

### Requirement: Error Boundary Component

An `ErrorBoundary.astro` component MUST wrap `Hero` and `ProductGrid` sections on the index page and render a styled fallback when its slot content fails to load data.

#### Scenario: Products fetch fails — fallback UI shown

- GIVEN `ProductGrid` cannot retrieve product data
- WHEN the component is rendered
- THEN `ErrorBoundary.astro` renders a fallback message in Spanish
- AND the fallback uses brand colors (magenta `#a81452`, crema `#fbebde`)
- AND a WhatsApp contact link is displayed so users can still reach the business

#### Scenario: Hero fetch fails — fallback UI shown

- GIVEN `Hero` cannot retrieve featured product data
- WHEN the component is rendered
- THEN `ErrorBoundary.astro` renders a graceful fallback instead of a blank hero section

#### Scenario: Fetch succeeds — no fallback shown

- GIVEN the API returns valid data
- WHEN `Hero` and `ProductGrid` render
- THEN no fallback UI is visible; normal content displays

---

### Requirement: No Unhandled Render Errors

The index page MUST NOT display a raw JavaScript error, stack trace, or blank white section when a data fetch fails.

#### Scenario: Unhandled exception does not reach the user

- GIVEN a runtime exception is thrown inside a wrapped component
- WHEN the page is rendered
- THEN `ErrorBoundary.astro` catches it and renders the fallback UI
- AND no stack trace or raw error message is visible in the HTML output

---

### Requirement: Fallback Content Accessibility

The error fallback UI MUST meet WCAG 2.1 AA color-contrast requirements.

#### Scenario: Fallback text is readable

- GIVEN the fallback UI is rendered
- WHEN contrast is measured between text and background
- THEN all text elements meet a minimum contrast ratio of 4.5 : 1
