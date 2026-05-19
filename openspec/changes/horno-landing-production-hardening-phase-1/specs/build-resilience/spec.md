# build-resilience Specification

## Purpose

Ensure `astro build` succeeds even when the backend API is unreachable, using retry logic with exponential backoff and a bundled fallback dataset.

## Requirements

### Requirement: API Request Retry

The `request<T>` function in `src/lib/api.ts` MUST retry failed HTTP requests up to 3 times using exponential backoff (base 500 ms, factor 2×) before declaring failure.

#### Scenario: Transient failure recovers on retry

- GIVEN the backend is temporarily unavailable
- WHEN `request<T>` is called and the first attempt returns a network error
- THEN the function retries up to 3 times with delays of 500 ms, 1 000 ms, 2 000 ms
- AND returns the successful response when any retry succeeds

#### Scenario: All retries exhausted

- GIVEN the backend is down for all 3 retry attempts
- WHEN `request<T>` exhausts all retries
- THEN the function throws a typed `ApiError` with `retries: 3` and the last error cause

#### Scenario: Successful first attempt skips retries

- GIVEN the backend is healthy
- WHEN `request<T>` is called
- THEN it returns the response on the first attempt without any retry delay

---

### Requirement: Fallback Dataset at Build Time

The build MUST NOT fail when the API is unreachable. `src/lib/api.ts` MUST fall back to `src/data/fallback.json` when all retries are exhausted during `astro build`.

#### Scenario: Build succeeds with fallback data

- GIVEN the backend is unreachable at build time
- WHEN `astro build` runs and all retries fail
- THEN the site builds successfully using `fallback.json`
- AND the build output contains a warning: `"Using fallback data — backend unreachable"`

#### Scenario: Fallback data shape matches API contract

- GIVEN `fallback.json` is loaded
- WHEN it is parsed as `Product[]`
- THEN every product object satisfies the `Product` TypeScript interface without type errors

#### Scenario: Live data takes precedence

- GIVEN the backend is reachable
- WHEN `astro build` runs
- THEN `fallback.json` is NOT used and the build uses fresh API data

---

### Requirement: Fallback Data Currency Documentation

The project MUST include documented instructions for refreshing `fallback.json` so stale data does not persist indefinitely.

#### Scenario: Refresh instructions exist

- GIVEN a developer needs to update `fallback.json`
- WHEN they open `README.md` or `fallback.json` header comments
- THEN they find a command or step-by-step process to regenerate the file from the live API
