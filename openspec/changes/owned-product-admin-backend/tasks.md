# Tasks — Owned Product Admin Backend

Change: `owned-product-admin-backend`

Implementation target: a new separate backend/admin repository, referred to below as `horno-product-admin/`. The current `horno-landing/` repository stores planning artifacts and should only be touched for explicit landing compatibility verification or a later approved landing migration slice.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2,500–4,000 across the full backend/admin release |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 foundation → PR 2 domain/schema/seed → PR 3 public API compatibility → PR 4 auth/admin shell → PR 5 product CRUD → PR 6 image flows → PR 7 ops/cutover verification |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No — feature-branch-chain selected
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

## Global Implementation Constraints

- Use strict TDD for behavior changes: RED → GREEN → TRIANGULATE → REFACTOR.
- Keep public DTOs compatible with the existing landing types in `horno-landing/src/lib/api.ts`, where `Organization.id`, `Product.id`, and `Product.org_id` are currently `number`.
- Chosen DTO ID resolution for first release: keep UUIDs internally in Postgres/Prisma, but expose landing-compatible numeric public IDs through stable legacy-compatible mapping fields. Do not expose UUID strings in public `id` or `org_id` unless a separate approved landing type migration updates `horno-landing/src/lib/api.ts` and fallback data.
- Prefer Auth.js magic link/email provider with `ADMIN_ALLOWED_EMAILS` over password credentials for first release. If credentials are chosen later, add password hashing and login rate limiting before any admin mutation ships.
- Scope `AUTH_TRUST_HOST` to deployed trusted hosting only; verify Auth.js cookie defaults are not weakened.
- Prefer Server Actions for admin image mutations to inherit framework CSRF protections. If a Route Handler is used for multipart upload, add explicit CSRF protection before enabling it.
- Use TypeScript const-object pattern for roles, statuses, image content types, provider names, and other runtime enum-like values.

## PR 1 — Backend Repository Foundation

### 1.1 RED — Create baseline project and test harness expectations

- Target paths:
  - `horno-product-admin/package.json`
  - `horno-product-admin/tsconfig.json`
  - `horno-product-admin/vitest.config.ts`
  - `horno-product-admin/src/tests/unit/architecture-boundaries.test.ts`
- Tasks:
  - Initialize a Next.js 15 App Router TypeScript project in the separate repo.
  - Add Vitest test command and an initial failing architecture-boundary test that asserts domain/application modules do not import `next/*`, Prisma client, Cloudinary SDK, or Auth.js.
- Acceptance criteria:
  - `npm run test` runs and the boundary test fails before implementation wiring exists.
  - No code is added to `horno-landing/` for this slice.

### 1.2 GREEN/REFACTOR — Establish folder boundaries and strict TypeScript

- Target paths:
  - `horno-product-admin/app/layout.tsx`
  - `horno-product-admin/app/page.tsx`
  - `horno-product-admin/src/domain/`
  - `horno-product-admin/src/application/`
  - `horno-product-admin/src/infrastructure/`
  - `horno-product-admin/src/interface/`
- Tasks:
  - Create the planned clean architecture folders with placeholder exports where needed.
  - Configure strict TypeScript and path aliases.
  - Add `server-only` usage guidance for future infrastructure modules.
- Acceptance criteria:
  - `npm run test` and `npm run typecheck` pass.
  - Boundary test passes without suppressions or `any`.

## PR 2 — Domain, Schema, and Seed/Migration Base

### 2.1 RED — Domain validation tests

- Target paths:
  - `horno-product-admin/src/tests/unit/domain/product.test.ts`
  - `horno-product-admin/src/domain/product.ts`
  - `horno-product-admin/src/domain/money.ts`
- Tasks:
  - Write failing tests for required product name, non-negative price, active/inactive transitions, archive state, and valid product without image.
- Acceptance criteria:
  - Tests fail for missing behavior before implementation.

### 2.2 GREEN/REFACTOR — Implement domain models and const objects

- Target paths:
  - `horno-product-admin/src/domain/product.ts`
  - `horno-product-admin/src/domain/organization.ts`
  - `horno-product-admin/src/domain/product-image.ts`
  - `horno-product-admin/src/domain/money.ts`
  - `horno-product-admin/src/domain/constants.ts`
- Tasks:
  - Implement domain rules using const-object patterns for product/admin status and image provider/content-type values.
  - Store money as cents in domain/application values.
- Acceptance criteria:
  - Domain tests pass.
  - No direct string-union enum pattern is introduced for runtime values.

### 2.3 RED/GREEN — Prisma schema with internal UUIDs and public legacy numeric IDs

- Target paths:
  - `horno-product-admin/prisma/schema.prisma`
  - `horno-product-admin/src/tests/integration/prisma-schema.test.ts`
- Tasks:
  - Add failing tests/verification for organization, product, product image, and admin user persistence.
  - Implement Prisma models with UUID primary keys plus stable public numeric compatibility fields, e.g. `legacyPublicId` on organizations/products and a product relation that can map `org_id` to the organization legacy ID.
- Acceptance criteria:
  - Internal DB IDs are UUID strings.
  - Public mapper inputs can produce numeric `id` and `org_id` without exposing UUIDs.
  - Prisma migration is additive and reviewable.

### 2.4 RED/GREEN — Idempotent seed/import with cleanup

- Target paths:
  - `horno-product-admin/prisma/seed.ts`
  - `horno-product-admin/src/application/use-cases/import-initial-catalog.ts`
  - `horno-product-admin/src/tests/unit/migration/import-initial-catalog.test.ts`
- Tasks:
  - Write tests for preserving `horno-del-pinguino-92f9`, converting decimal prices to cents, preserving compatibility fields, and correcting `Chesscake` to `Cheesecake`.
  - Implement idempotent upsert by external ID.
- Acceptance criteria:
  - Seed can run twice without duplicate organizations/products.
  - Logs counts only and never secrets.

## PR 3 — Public API Compatibility

### 3.1 RED — Public DTO mapper contract tests

- Target paths:
  - `horno-product-admin/src/interface/dto/public-organization-dto.ts`
  - `horno-product-admin/src/interface/dto/public-product-dto.ts`
  - `horno-product-admin/src/interface/mappers/to-public-organization-dto.ts`
  - `horno-product-admin/src/interface/mappers/to-public-product-dto.ts`
  - `horno-product-admin/src/tests/unit/interface/public-dto-mappers.test.ts`
- Tasks:
  - Write failing tests for exact wrappers and field names expected by `horno-landing/src/lib/api.ts`.
  - Include numeric public `id` and `org_id`, `photo_url: ""` for missing image, cents-to-decimal `price`, and no new required landing fields.
- Acceptance criteria:
  - Mapper output is assignable to landing-compatible DTO shape with numeric public IDs.

### 3.2 GREEN/REFACTOR — Public read use cases

- Target paths:
  - `horno-product-admin/src/application/ports/organization-repository.ts`
  - `horno-product-admin/src/application/ports/product-repository.ts`
  - `horno-product-admin/src/application/use-cases/list-public-organizations.ts`
  - `horno-product-admin/src/application/use-cases/list-public-products.ts`
  - `horno-product-admin/src/tests/unit/application/list-public-products.test.ts`
- Tasks:
  - Implement active organization/product reads with public filtering by `isActive = true` and `archivedAt = null`.
  - Add page and page_size defaults matching current landing expectations.
- Acceptance criteria:
  - Inactive and archived products are excluded.
  - Public reads require no admin actor.

### 3.3 RED/GREEN — Next.js public route handlers

- Target paths:
  - `horno-product-admin/app/api/public/organizations/route.ts`
  - `horno-product-admin/app/api/public/organizations/[orgExternalId]/products/route.ts`
  - `horno-product-admin/src/infrastructure/db/repositories/`
  - `horno-product-admin/src/tests/integration/public-routes.test.ts`
- Tasks:
  - Write route tests for unauthenticated `GET /api/public/organizations` and `/api/public/organizations/{orgExternalId}/products`.
  - Implement route handlers that call use cases and DTO mappers only.
- Acceptance criteria:
  - Responses include `organizations/count` and `products/count/page/page_size`.
  - No route requires auth or leaks stack traces/secrets.

## PR 4 — Admin Authentication and Protected Shell

### 4.1 RED — Auth boundary tests

- Target paths:
  - `horno-product-admin/src/infrastructure/auth/auth-config.ts`
  - `horno-product-admin/src/infrastructure/auth/require-admin.ts`
  - `horno-product-admin/src/domain/admin.ts`
  - `horno-product-admin/src/tests/unit/auth/require-admin.test.ts`
- Tasks:
  - Write tests that unauthenticated or non-allowlisted users are rejected and active allowlisted admins produce an `AdminActor`.
- Acceptance criteria:
  - Tests cover no session, inactive admin, non-allowlisted email, and valid admin.

### 4.2 GREEN/REFACTOR — Auth.js magic link/email allowlist

- Target paths:
  - `horno-product-admin/auth.ts`
  - `horno-product-admin/app/admin/layout.tsx`
  - `horno-product-admin/app/admin/login/page.tsx`
  - `horno-product-admin/middleware.ts`
  - `horno-product-admin/src/infrastructure/auth/auth-config.ts`
  - `horno-product-admin/src/infrastructure/auth/require-admin.ts`
- Tasks:
  - Configure Auth.js with email/magic-link provider and `ADMIN_ALLOWED_EMAILS`.
  - Protect `/admin/**` pages and require server-side auth at mutation boundaries.
  - Verify `AUTH_TRUST_HOST` is only enabled for trusted deployment hosts and Auth.js cookies remain default secure/httpOnly/sameSite behavior.
- Acceptance criteria:
  - Public `/api/public/**` remains unauthenticated.
  - `/admin/**` redirects unauthenticated users to login.
  - Mutation code cannot rely on middleware only.
  - If credentials provider replaces magic link, password hashing and login rate limiting tasks must be added before continuing.

## PR 5 — Admin Product CRUD

### 5.1 RED — Product mutation use-case tests

- Target paths:
  - `horno-product-admin/src/application/use-cases/create-product.ts`
  - `horno-product-admin/src/application/use-cases/update-product.ts`
  - `horno-product-admin/src/application/use-cases/archive-product.ts`
  - `horno-product-admin/src/application/use-cases/set-product-active-state.ts`
  - `horno-product-admin/src/tests/unit/application/product-mutations.test.ts`
- Tasks:
  - Write tests for authenticated create, update, archive/delete, publish/unpublish, invalid data rejection, and no partial persistence.
- Acceptance criteria:
  - Unauthenticated mutations are rejected with no state change.
  - Valid authenticated mutations update admin-visible state.

### 5.2 GREEN/REFACTOR — Use cases, validation schemas, and repository adapter

- Target paths:
  - `horno-product-admin/src/interface/validation/product-form-schema.ts`
  - `horno-product-admin/src/infrastructure/db/repositories/prisma-product-repository.ts`
  - `horno-product-admin/src/application/use-cases/*.ts`
- Tasks:
  - Implement product mutation use cases with transaction boundaries.
  - Use validation schema for admin form/API input.
- Acceptance criteria:
  - Product name and price validation match spec.
  - Archive is preferred over destructive deletion.

### 5.3 RED/GREEN — Admin product pages and Server Actions

- Target paths:
  - `horno-product-admin/app/admin/products/page.tsx`
  - `horno-product-admin/app/admin/products/new/page.tsx`
  - `horno-product-admin/app/admin/products/[productId]/page.tsx`
  - `horno-product-admin/app/admin/products/actions.ts`
  - `horno-product-admin/src/tests/integration/admin-product-actions.test.ts`
- Tasks:
  - Build minimal admin list/create/edit forms and Server Actions.
  - Keep UI copy in Spanish for the business operator, while code and technical artifacts stay English.
- Acceptance criteria:
  - Every Server Action calls `requireAdmin()` before use cases.
  - Admin can create/edit/publish/unpublish/archive products.
  - Public DTO updates reflect active product changes.

## PR 6 — Image Upload, Replacement, and Removal

### 6.1 RED — Image validation and state transition tests

- Target paths:
  - `horno-product-admin/src/interface/validation/image-upload-schema.ts`
  - `horno-product-admin/src/application/use-cases/upload-product-image.ts`
  - `horno-product-admin/src/application/use-cases/replace-product-image.ts`
  - `horno-product-admin/src/application/use-cases/remove-product-image.ts`
  - `horno-product-admin/src/tests/unit/application/product-image-flows.test.ts`
- Tasks:
  - Write tests for accepted types (`image/jpeg`, `image/png`, `image/webp`), 5 MB max size, invalid upload rejection before storage, replace/remove behavior, safe missing image DTO, and compensating cleanup after DB failure.
- Acceptance criteria:
  - Tests prove existing image state remains unchanged after invalid upload.

### 6.2 GREEN/REFACTOR — Media storage port and Cloudinary adapter

- Target paths:
  - `horno-product-admin/src/application/ports/media-storage.ts`
  - `horno-product-admin/src/infrastructure/media/cloudinary-media-storage.ts`
  - `horno-product-admin/src/tests/unit/infrastructure/cloudinary-media-storage.test.ts`
- Tasks:
  - Implement `MediaStorage` port and Cloudinary adapter behind `server-only` infrastructure boundary.
  - Keep provider asset ID separate from public URL.
- Acceptance criteria:
  - Application use cases depend only on `MediaStorage` port.
  - Provider credentials are server-only and never exposed to client code.

### 6.3 RED/GREEN — Admin image UI mutation flow

- Target paths:
  - `horno-product-admin/app/admin/products/[productId]/image-actions.ts`
  - `horno-product-admin/app/admin/products/[productId]/page.tsx`
  - optional only if unavoidable: `horno-product-admin/app/api/admin/products/[productId]/image/route.ts`
  - `horno-product-admin/src/tests/integration/admin-image-actions.test.ts`
- Tasks:
  - Prefer Server Actions for upload/replace/remove image mutations.
  - If a Route Handler is used for multipart upload, add explicit CSRF token validation and tests before enabling the route.
  - Show current preview, replace control, and removal confirmation.
- Acceptance criteria:
  - Authenticated admin can upload, preview, replace, and remove images.
  - Unauthenticated image mutation is rejected with no state change.
  - Public `photo_url` is a stable URL when present and `""` when absent.
  - CSRF protection exists for any admin Route Handler mutation.

## PR 7 — Operations, Cutover, and Landing Verification

### 7.1 RED/GREEN — Operational configuration and observability

- Target paths:
  - `horno-product-admin/.env.example`
  - `horno-product-admin/README.md`
  - `horno-product-admin/src/infrastructure/logging/`
  - `horno-product-admin/src/tests/unit/observability/log-redaction.test.ts`
- Tasks:
  - Document required env vars: `DATABASE_URL`, `AUTH_SECRET`, trusted host setting, `ADMIN_ALLOWED_EMAILS`, Cloudinary credentials, and `NEXT_PUBLIC_APP_URL`.
  - Add logging/redaction tests for public API and admin mutation failures.
  - Document database backup responsibility and media credential ownership.
- Acceptance criteria:
  - Logs include endpoint/use-case/error category and never secrets/tokens.
  - Backup and credential ownership are documented before cutover.

### 7.2 RED/GREEN — Staging compatibility smoke verification

- Target paths:
  - `horno-product-admin/src/tests/integration/landing-compatibility.test.ts`
  - `horno-product-admin/scripts/verify-landing-compatibility.ts`
  - planning reference only: `horno-landing/src/lib/api.ts`
- Tasks:
  - Add a script/test that fetches `/api/public/organizations` and `/api/public/organizations/horno-del-pinguino-92f9/products` from a configured backend URL and verifies the existing landing-compatible DTO shape.
  - Verify active filtering, fallback-safe missing image values, and numeric public `id`/`org_id`.
- Acceptance criteria:
  - Staging backend can be validated without modifying the landing repo.
  - Any public ID string output fails compatibility tests unless an approved landing type migration exists.

### 7.3 Cutover and rollback checklist

- Target paths:
  - `horno-product-admin/docs/cutover.md`
  - `horno-product-admin/docs/rollback.md`
- Tasks:
  - Document staging seed, staging `PUBLIC_API_BASE_URL=https://owned-backend-staging.example.com/api`, production seed, production switch, monitoring, and rollback to previous backend URL.
  - Explicitly keep `horno-landing/src/data/fallback.json` and current fallback behavior unchanged for the first release window.
- Acceptance criteria:
  - Rollback requires only reverting `PUBLIC_API_BASE_URL` to the previous external backend URL.
  - No destructive landing fallback removal is included in this change.

## Optional Later Slice — Landing Type Migration Only If Public IDs Become Strings

- Trigger: backend team explicitly decides to expose UUID strings in public `id` or `org_id`, contrary to the first-release compatibility default.
- Target paths:
  - `horno-landing/src/lib/api.ts`
  - `horno-landing/src/data/fallback.json`
  - `horno-landing/src/**/*.test.ts`
- Tasks:
  - Update landing `Organization.id`, `Product.id`, and `Product.org_id` types from `number` to `number | string` or `string`.
  - Update fallback fixtures and tests.
  - Verify current rendering, fallback behavior, and public fetches.
- Acceptance criteria:
  - This slice is separately approved before implementation.
  - Landing build and tests pass.
  - Public DTO compatibility expectations are updated in backend mapper tests.

## Final Verification Gate

- Run in `horno-product-admin/`:
  - `npm run test`
  - `npm run typecheck`
  - `npm run build`
  - any configured route/integration smoke tests
- Verify against the spec:
  - public unauthenticated organization/products endpoints;
  - numeric landing-compatible public IDs unless approved otherwise;
  - active-only public products;
  - authenticated admin mutations;
  - product validation;
  - image upload/replace/remove safety;
  - migration cleanup for `Chesscake` → `Cheesecake`;
  - rollback through environment configuration;
  - Auth.js trust host/cookie posture;
  - CSRF protection if admin Route Handlers mutate state.
