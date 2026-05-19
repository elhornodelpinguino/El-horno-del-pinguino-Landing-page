# ci-cd Specification

## Purpose

Provide automated quality gates on every PR and push so that broken builds and failing tests never reach the main branch.

## Requirements

### Requirement: Build Validation on Every PR

The GitHub Actions workflow MUST run `astro build` on every pull request targeting `main` and on every push to `main`. The PR MUST be blocked if the build fails.

#### Scenario: Clean build passes CI

- GIVEN a PR with valid Astro code
- WHEN the workflow runs `astro build`
- THEN the step exits with code 0 and the workflow succeeds

#### Scenario: Build error blocks PR merge

- GIVEN a PR that introduces a TypeScript or Astro compile error
- WHEN the workflow runs `astro build`
- THEN the step exits with a non-zero code and the workflow is marked as failed
- AND GitHub's branch protection prevents merging the PR

---

### Requirement: Dependency Install with Lockfile

The workflow MUST install dependencies using `npm ci` (or `pnpm install --frozen-lockfile`) to guarantee reproducible builds.

#### Scenario: Lockfile is respected

- GIVEN the CI environment has no `node_modules`
- WHEN the install step runs
- THEN it uses the lockfile and fails if `package-lock.json` / `pnpm-lock.yaml` is out of sync

---

### Requirement: Node Version Pinned

The workflow MUST pin Node.js to the version declared in `.nvmrc` or `engines` in `package.json`.

#### Scenario: Node version matches project requirement

- GIVEN the workflow sets up Node using `actions/setup-node`
- WHEN it resolves the version
- THEN it uses the version from the project config file, not CI defaults

---

### Requirement: Workflow Status Badge

The repository README SHOULD display a CI status badge reflecting the latest `main` branch workflow result.

#### Scenario: Badge reflects current status

- GIVEN the GitHub Actions workflow has run on `main`
- WHEN the README is viewed on GitHub
- THEN the badge shows "passing" or "failing" matching the latest run result
