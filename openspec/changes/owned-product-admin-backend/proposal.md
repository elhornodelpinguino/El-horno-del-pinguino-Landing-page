# Proposal — Owned Product Admin Backend

Change: `owned-product-admin-backend`

## Intent

Build a separate owned backend/admin for El Horno del Pingüino so the business no longer depends on a friend's external backend for product and organization data. The first version should let a non-technical administrator manage products and product images, while keeping the existing Astro landing migration low-risk and reversible.

The proposed first release is a focused catalog-admin backend, not a full commerce platform.

## Problem Statement

The current Astro landing consumes public data from an external backend outside the business's control. This creates operational and product risks:

- Product availability, prices, images, and organization content depend on a third-party service.
- Backend data quirks leak into frontend code, such as typo correction for `Chesscake` → `Cheesecake`.
- Product/image updates are not owned end-to-end by the business.
- The landing needs stable public product data but should not absorb backend replacement complexity.

## Goals

- Own organization and product data for El Horno del Pingüino.
- Provide an authenticated admin area for managing products.
- Make product image upload, replacement, removal, and preview easy for non-technical users.
- Expose public read endpoints compatible with the current Astro landing contract.
- Preserve the existing environment-variable-based migration path where possible.
- Keep fallback/rollback available during the cutover.
- Apply clean architecture boundaries so business rules remain testable and not coupled to the web framework.
- Keep implementation slices reviewable under the 400 changed-line review budget where practical.

## Non-Goals

The first version will not include:

- Online ordering or checkout.
- Payments.
- Inventory reservation or stock automation beyond fields required for current public display compatibility.
- Customer accounts.
- Delivery logistics.
- Promotions, coupons, loyalty programs, or analytics dashboards.
- Multi-tenant SaaS behavior beyond preserving an organization identifier for compatibility.
- Full redesign of the Astro landing.
- Breaking changes to the public product DTO unless explicitly approved later.

## Scope

### In Scope

- A separate backend/admin application, recommended as a Next.js 15 full-stack app.
- Organization data for El Horno del Pingüino.
- Product catalog persistence.
- Product image storage integration through a managed media/object storage provider.
- Public read API for organizations and products.
- Admin authentication and authorization for write operations.
- Admin CRUD for products.
- Product publish/unpublish behavior through `is_active`.
- Migration strategy from the current external/fallback data.
- Rollback strategy to the existing backend or fallback data during cutover.

### Out of Scope for First Release

- Advanced inventory workflows.
- Order lifecycle management.
- Payment integrations.
- Complex role-based permission systems beyond one protected admin operator/admin role.
- Bulk import/export unless needed for initial seed/migration.
- Custom image transformations beyond what the chosen provider offers by default.

## Recommended Product Direction

Build a separate Next.js 15 full-stack admin/backend application with explicit clean architecture boundaries:

- **Domain layer:** organization, product, media/image concepts, invariants.
- **Application layer:** use cases such as list public products, create product, update product, publish/unpublish product, upload/replace/remove product image.
- **Infrastructure layer:** database, media storage provider, authentication provider, persistence adapters.
- **Interface layer:** Next.js admin pages, route handlers, server actions, DTO mappers.

Next.js should host delivery mechanisms; it should not become the architecture. Business rules and DTO mapping should stay framework-independent and covered by tests.

## Affected Areas

- New owned backend/admin application.
- Database/schema for organization, product, and image metadata.
- Media/object storage provider configuration.
- Admin authentication configuration.
- Public API endpoints consumed by the Astro landing.
- Astro landing environment variables:
  - `PUBLIC_API_BASE_URL`
  - `PUBLIC_ORG_EXTERNAL_ID`
- Existing landing fallback behavior and fallback data.
- Deployment, secrets, backup, and monitoring responsibilities for the new backend.

## User Stories

### Business Owner / Admin

- As an admin, I want to log in securely so only authorized people can change product data.
- As an admin, I want to create a product with name, description, price, on-demand status, active status, and image so it appears correctly on the landing.
- As an admin, I want to edit product details so the landing stays accurate without developer intervention.
- As an admin, I want to publish or unpublish products so unavailable products can be hidden without deleting them.
- As an admin, I want to upload, preview, replace, or remove a product image easily so the catalog looks current.

### Landing Visitor

- As a visitor, I want the product list to load reliably so I can understand what the bakery offers.
- As a visitor, I should only see active/public products.
- As a visitor, I should not experience a visible disruption during the backend migration.

### Developer / Operator

- As a developer, I want the public API contract to remain compatible so the Astro landing can migrate with minimal code changes.
- As an operator, I want rollback options so production can return to the previous backend/fallback if the new backend has issues.

## Business Rules

- Public product listings must include only products marked active/public.
- Admin writes must require authentication.
- Public read endpoints must not require authentication.
- Product price must be a valid non-negative monetary value.
- Product name is required.
- Product image uploads must validate file type and size.
- Uploaded images must be stored outside the application filesystem in production.
- A product may exist without an image, but the public response must remain safe for the current landing.
- Organization identity should preserve the current external identifier initially: `horno-del-pinguino-92f9`.
- The backend should emit clean owned data; known upstream typos should be fixed during migration rather than preserved as canonical data.
- Deleting or removing an image must not leave the product in a broken public-display state.
- Public DTO compatibility is preferred for the first migration slice over redesigning the landing contract.

## Public API Compatibility

The first version should preserve the current landing-facing shape where possible.

### Public Endpoints

- `GET /api/public/organizations`
- `GET /api/public/organizations/{orgExternalId}/products`

### Expected Organization Response Shape

- `organizations: Organization[]`
- `count: number`

### Expected Products Response Shape

- `products: Product[]`
- `count: number`
- `page: number`
- `page_size: number`

### Product Fields Needed by Current Landing

- `name`
- `description`
- `price`
- `photo_url`
- `on_demand`
- `is_active`

The backend may preserve additional existing fields for compatibility, including IDs, SKU, stock, attributes, and timestamps, but the first version should avoid adding landing dependencies on new fields.

## Image Upload Requirements

- Use managed media/object storage, not local disk, for production uploads.
- Store media metadata in the database.
- Store or derive a stable public `photo_url` for landing compatibility.
- Keep provider-specific asset IDs separate from public URLs to support replacement/deletion.
- Support upload, replace, remove, and preview flows.
- Validate accepted content types and maximum file size.
- Keep the public API safe when a product has no image.

Recommended default: Cloudinary or Uploadcare if upload simplicity and CDN delivery matter most; Supabase Storage if the project chooses Supabase for database/auth and wants an integrated stack.

## Migration Strategy

1. Model organization, products, and image metadata in the owned backend.
2. Seed/import El Horno del Pingüino organization and product data from current known backend/fallback data.
3. Clean known data defects during import, including the cheesecake typo.
4. Implement public endpoints compatible with the current Astro landing contract.
5. Deploy the backend/admin to a staging environment.
6. Point the Astro landing staging environment to the owned backend via `PUBLIC_API_BASE_URL`.
7. Verify product rendering, active filtering, fallback behavior, and image loading.
8. Switch production `PUBLIC_API_BASE_URL` after validation.
9. Keep the old external backend URL and fallback JSON available for one release window.
10. Remove landing-side defensive quirks only after the owned backend is proven stable.

## Rollback Strategy

- Keep `PUBLIC_API_BASE_URL` configurable so production can point back to the previous external backend if needed.
- Keep `src/data/fallback.json` available during migration.
- Do not remove current fallback behavior in the first migration slice.
- Avoid destructive data migration steps during cutover.
- Keep initial owned backend public DTO compatible so rollback does not require frontend code changes.
- If image delivery fails, admin should be able to remove/replace image metadata without deleting products.

## Success Criteria

- The business can manage products without relying on the friend's backend.
- An authenticated admin can create, edit, publish/unpublish, and manage product images.
- Public endpoints return organization and product data compatible with the Astro landing.
- The landing can switch to the owned backend primarily through environment configuration.
- Only active products appear in public product lists.
- Product image upload and replacement are understandable for a non-technical admin.
- The old backend/fallback rollback path remains available during the release window.
- Core domain/application behavior has tests before implementation completion, following strict TDD mode.
- Review slices remain small enough to protect the 400-line review budget, or risks are explicitly called out before apply.

## Risks

- **Scope creep:** backend/admin can expand into ordering, payments, and inventory. Keep first release catalog-focused.
- **Review size risk:** admin auth, CRUD, uploads, persistence, and migration can exceed 400 changed lines if bundled.
- **API drift:** changing the public DTO too early will force unnecessary Astro landing changes.
- **Authentication risk:** mutation endpoints must be protected before any write capability is exposed.
- **Image storage risk:** provider credentials, validation, public delivery, deletion, and cache behavior need explicit handling.
- **Migration quality risk:** importing external data without cleanup can preserve defects as owned data.
- **Operational ownership risk:** the business now owns deployment, secrets, database backups, storage credentials, and monitoring.

## Open Decisions and Recommended Defaults

1. **Hosting provider**
   - Recommended default: Vercel for a Next.js-first deployment, unless database/storage/provider constraints make Render/Railway simpler.

2. **Database provider**
   - Recommended default: Postgres via Supabase or Neon.
   - Rationale: reliable relational fit for organization/product/image metadata and future growth.

3. **Auth provider**
   - Recommended default: Auth.js/NextAuth or Supabase Auth, depending on database/provider choice.
   - Rationale: avoid custom auth unless there is a strong reason.

4. **Image storage provider**
   - Recommended default: Cloudinary/Uploadcare for easiest media UX, or Supabase Storage for integrated infrastructure.

5. **Repository strategy**
   - Recommended default: separate app with clear deployment ownership; monorepo only if shared CI/tooling is already desired.

6. **Compatibility duration**
   - Recommended default: preserve the current public API shape for at least the first production release window.

7. **Admin UI language**
   - Recommended default: Spanish UI copy for the business operator, while technical artifacts remain in English.

## First Release Boundary

The first release is successful when the owned backend/admin can replace the external backend for organization and product display on the Astro landing, with admin-managed product data and images, authenticated writes, public reads, and rollback safety.

Ordering, payment, and advanced inventory decisions should be deferred until this foundation is working in production.
