# testing Specification

## Purpose

Provide a Vitest unit test suite for pure utility logic and a Playwright smoke test for critical user-facing flows, establishing a baseline quality gate before each deploy.

## Requirements

### Requirement: Vitest Unit Tests — formatPrice

The `formatPrice` utility MUST be tested with Vitest covering its happy path, edge cases, and locale formatting.

#### Scenario: Formats a whole number price

- GIVEN `formatPrice(1500)` is called
- WHEN the function returns
- THEN the result is `"$1.500"` (Ecuadorian dot-separator convention) or the configured locale format

#### Scenario: Formats a decimal price

- GIVEN `formatPrice(9.99)` is called
- WHEN the function returns
- THEN the result includes two decimal places in the correct locale format

#### Scenario: Zero price returns formatted zero

- GIVEN `formatPrice(0)` is called
- WHEN the function returns
- THEN the result is a valid formatted string and does not throw

#### Scenario: Negative price is handled

- GIVEN `formatPrice(-5)` is called
- WHEN the function returns
- THEN the result is a valid string (no crash); exact format is implementation-defined

---

### Requirement: Vitest Unit Tests — Retry Logic

The retry logic inside `request<T>` MUST be tested with Vitest using a mocked `fetch` to validate retry count and backoff without real HTTP calls.

#### Scenario: Retries exactly 3 times on failure

- GIVEN `fetch` is mocked to always reject
- WHEN `request<T>` is called
- THEN `fetch` is called exactly 4 times (1 initial + 3 retries)
- AND the function throws `ApiError` after the last attempt

#### Scenario: Returns on second attempt

- GIVEN `fetch` is mocked to reject once then resolve with valid JSON
- WHEN `request<T>` is called
- THEN `fetch` is called exactly 2 times
- AND the function returns the resolved value

---

### Requirement: Playwright Smoke Test — Page Load

The Playwright suite MUST include a smoke test that verifies the index page loads and key elements are visible.

#### Scenario: Index page loads without errors

- GIVEN the built site is served locally (or on a preview URL)
- WHEN Playwright navigates to `/`
- THEN the page title is non-empty
- AND HTTP status is 200
- AND no uncaught console errors are present

---

### Requirement: Playwright Smoke Test — Product Card Visible

The Playwright suite MUST verify that at least one product card is rendered on the index page.

#### Scenario: Product card is visible

- GIVEN the page has loaded
- WHEN Playwright queries for the product card selector
- THEN at least one card element is visible in the viewport

---

### Requirement: Playwright Smoke Test — WhatsApp Link Valid

The Playwright suite MUST verify that the WhatsApp contact link is present and points to a `wa.me` URL.

#### Scenario: WhatsApp link exists and is valid

- GIVEN the page has loaded
- WHEN Playwright queries for the WhatsApp CTA link
- THEN the `href` attribute starts with `https://wa.me/`
- AND the element is visible

---

### Requirement: Tests Run in CI

All Vitest and Playwright tests MUST run as steps in the GitHub Actions workflow defined in `ci-cd`. Both test suites MUST pass for the workflow to succeed.

#### Scenario: Vitest suite passes in CI

- GIVEN the workflow runs on a PR
- WHEN the Vitest step executes
- THEN it exits with code 0 if all unit tests pass

#### Scenario: Playwright suite passes in CI

- GIVEN the workflow runs on a PR and the site has been built
- WHEN the Playwright step executes against the built output
- THEN it exits with code 0 if all smoke tests pass
