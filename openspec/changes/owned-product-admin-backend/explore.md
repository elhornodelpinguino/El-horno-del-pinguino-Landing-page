# Exploration — Owned Product Admin Backend

Change: `owned-product-admin-backend`

## 1. Current State and Constraints

The current `horno-landing` project is an Astro 4 SSR landing page for El Horno del Pingüino. It consumes product and organization data from an external backend owned by a friend, not by the business.

Current public data coupling lives mainly in `src/lib/api.ts`:

- Default API base URL: `https://product-admin-backend-vfyy.onrender.com/api`
- Default organization external ID: `horno-del-pinguino-92f9`
- Public endpoints consumed:
  - `GET /public/organizations`
  - `GET /public/organizations/{orgId}/products`
- The landing filters products by `is_active`.
- Fallback behavior uses `src/data/fallback.json` when the backend is unreachable.
- `displayProductName()` currently compensates for an upstream typo: `Chesscake` → `Cheesecake`, showing that backend data quirks leak into frontend behavior.

`src/components/ProductCard.astro` depends on the current `Product` contract from `src/lib/api.ts`, especially:

- `name`
- `description`
- `price`
- `photo_url`
- `on_demand`
- `is_active`

The current fallback data mirrors the external backend response shape, so any replacement backend should either preserve this public contract or provide a thin adapter in the landing.

Project constraints:

- Technical artifacts should be in English.
- Planning phases must not implement backend code.
- Strict TDD is enabled for future implementation.
- Review budget is 400 changed lines per review slice.
- Delivery strategy is ask-on-risk / auto-forecast.
- The landing should consume the new owned backend with minimal disruption.
- Product/image uploads should be easy for non-technical administration.
- Clean architecture and best practices are desired.

## 2. Options Compared

### Option A — Next.js Full-Stack Admin/Backend

Build a separate Next.js 15 application that owns both the admin UI and backend API using App Router route handlers and server-side data access.

Possible shape:

- `app/admin/...` for protected admin pages.
- `app/api/public/...` for landing-consumable public endpoints.
- `app/api/admin/...` or Server Actions for authenticated mutations.
- Database through a typed persistence layer.
- Image upload integration through object storage or managed media service.

Strengths:

- One deployable app owns admin UI, public API, auth, and upload flows.
- Next.js App Router supports colocated admin pages, route handlers, server actions, and server components.
- Good fit for small-to-medium admin needs.
- Lower operational complexity than separate API plus separate frontend.
- Easy to keep backend/domain/application/infrastructure boundaries inside one repository if enforced deliberately.

Weaknesses:

- Risk of mixing UI concerns with domain/application logic unless architecture boundaries are explicit.
- Public API uptime now depends on the Next.js app deployment.
- Requires careful authentication, authorization, validation, and storage design.

Best fit when:

- The admin is small and business-specific.
- The team wants ownership without over-splitting infrastructure.
- The first goal is replacing the external backend cleanly and quickly.

### Option B — Standalone API + Separate Admin

Build a dedicated backend API service and a separate admin frontend.

Possible shape:

- API: NestJS, Fastify, Hono, Express, or similar.
- Admin UI: Next.js, Astro, React SPA, or another frontend.
- Public API served by backend.
- Admin frontend consumes authenticated admin API.

Strengths:

- Strong separation between backend and UI.
- Easier to scale API and admin independently.
- Clear ownership boundaries for larger systems.
- Backend can be designed around clean/hexagonal architecture from day one.

Weaknesses:

- More repositories or packages, deployments, configuration, and CI/CD surface area.
- Slower first implementation.
- More integration work for auth, CORS, API clients, and environments.
- Likely overkill for a small bakery product catalog/admin unless future requirements are broader.

Best fit when:

- The backend will serve multiple clients beyond the landing/admin.
- There are expected integrations, ordering flows, inventory, payments, or multi-tenant requirements.
- The business needs independent service scaling or a long-lived backend platform.

### Option C — Temporary CMS/Storage Alternative

Use a managed CMS or database/storage platform as an interim owned backend.

Possible candidates:

- Directus, Strapi, Payload, Sanity, Contentful, Supabase, Firebase, or similar.
- Managed image storage via Cloudinary, Uploadcare, Supabase Storage, S3-compatible storage, or the CMS media library.

Strengths:

- Fastest route to business-owned product editing and image uploads.
- Less custom admin code.
- Built-in media handling in several CMS options.
- Good for validating content workflows before building custom admin.

Weaknesses:

- Public API contract may differ significantly from current landing expectations.
- Vendor lock-in or platform-specific content modeling.
- Custom business rules may become awkward.
- Clean architecture is harder if the CMS becomes the domain model instead of an infrastructure dependency.

Best fit when:

- The immediate pain is content ownership and uploads, not custom business workflows.
- The team wants a temporary bridge while designing the owned backend.
- Operational simplicity matters more than full custom control.

## 3. Recommendation and Rationale

Recommended direction: build a separate Next.js 15 full-stack admin/backend application with explicit clean architecture boundaries, while preserving the current public API contract for the Astro landing.

Rationale:

- It gives El Horno del Pingüino ownership over product data, organization data, and uploaded images.
- It avoids the operational overhead of a fully separate API and separate admin frontend at this stage.
- It supports a friendly admin UI for product/image management.
- It can expose public endpoints compatible with the current landing, minimizing disruption.
- It leaves room to extract a standalone API later if requirements grow.

Architectural boundary recommendation:

- Domain layer: product, organization, media/image concepts and business rules.
- Application layer: use cases such as create product, update product, publish/unpublish product, upload product image, list public products.
- Infrastructure layer: database, object storage/media provider, authentication provider, external service adapters.
- Interface layer: Next.js admin pages, route handlers, server actions, DTO mappers.

The key is not merely picking Next.js. The key is preventing the framework from becoming the architecture. Next.js should host the delivery mechanisms; business rules and DTO mapping should remain explicit and testable.

## 4. Public API Compatibility Strategy

The Astro landing should migrate with minimal disruption by keeping the current public DTO shape stable at first.

Initial compatibility target:

- `GET /api/public/organizations`
  - Response shape compatible with current `OrganizationsResponse`:
    - `organizations: Organization[]`
    - `count: number`
- `GET /api/public/organizations/{orgExternalId}/products`
  - Response shape compatible with current `ProductsResponse`:
    - `products: Product[]`
    - `count: number`
    - `page: number`
    - `page_size: number`

The owned backend SHOULD emit fields currently expected by the landing:

- Organization:
  - `id`
  - `external_id`
  - `name`
  - `legal_name`
  - `email`
  - `description`
  - `primary_color`
  - `secondary_color`
  - `tertiary_color`
  - `logo_url`
  - `address`
  - `telephone`
  - `org_type`
  - `is_active`
  - `extra_data`
  - `created_at`
- Product:
  - `id`
  - `external_id`
  - `org_id`
  - `name`
  - `description`
  - `sku`
  - `price`
  - `cost`
  - `stock`
  - `on_demand`
  - `perecedero`
  - `photo_url`
  - `is_active`
  - `attributes`
  - `created_at`
  - `updated_at`

Important compatibility decisions:

- Preserve `PUBLIC_API_BASE_URL` so the landing can switch backends through environment configuration.
- Preserve `PUBLIC_ORG_EXTERNAL_ID` to avoid hardcoding a new organization identifier in the landing.
- Keep `src/data/fallback.json` as rollback data during the migration.
- Remove typo-normalization only after the owned backend has clean data and the landing no longer needs `displayProductName()` as a defensive patch.
- Prefer an adapter/mapper in the new backend over large landing changes for the first migration slice.

Suggested migration flow:

1. Implement compatible public endpoints in the owned backend.
2. Seed/import organization and product data from the current known fallback/external data.
3. Deploy backend to a staging URL.
4. Point `PUBLIC_API_BASE_URL` to staging and verify the landing without code changes.
5. Switch production environment variable after validation.
6. Keep fallback data and old backend URL available as rollback for one release window.

## 5. Image Storage Strategy

Product/image uploads should be easy for the admin user and reliable for the public landing.

Recommended first choice: managed object/media storage with public, optimized delivery URLs.

Good candidates:

- Cloudinary or Uploadcare for easiest image upload, transformation, optimization, and CDN delivery.
- Supabase Storage if the project also uses Supabase for database/auth and wants an integrated platform.
- S3-compatible storage if the team wants lower-level ownership and accepts more setup.

Recommended image model:

- Store image metadata in the database.
- Store image binary files in object/media storage, not in the application filesystem.
- Store a stable public URL or derived delivery URL as `photo_url` for landing compatibility.
- Optionally store provider-specific asset IDs separately from public URLs to support replacement/deletion.

Minimum product image fields:

- `photo_url`: public URL consumed by the landing.
- `image_asset_id`: provider asset ID for admin replacement/deletion.
- `image_alt`: optional future accessibility improvement.
- `image_updated_at`: optional cache-busting/traceability field.

Admin upload behavior should support:

- Upload product image.
- Replace product image.
- Remove product image.
- Preview image before saving or immediately after upload.
- Validate file type and size.
- Keep a safe fallback when no image exists, matching the landing’s current behavior.

Risk note:

- Do not rely on local disk uploads in production for a serverless or containerized deployment unless persistent volumes are explicitly available and backed up.

## 6. First Implementation Slices

To stay under the 400-line review budget, this change should be split into small reviewable slices.

### Slice 1 — Public Contract and Data Model Planning

Goal:

- Define the owned public API DTOs and persistence model without changing the landing behavior.

Deliverables:

- Public API contract for organization and products.
- Domain/application boundaries documented.
- Database schema draft for organization, product, and product image metadata.
- Seed/import strategy from fallback/current data.

Review risk: low to medium.

### Slice 2 — Backend Foundation

Goal:

- Create the new owned backend/admin app foundation.

Deliverables:

- Next.js 15 app skeleton.
- Strict TypeScript configuration.
- Test setup.
- Environment configuration.
- Health endpoint or minimal public route.
- Architecture folders for domain/application/infrastructure/interface.

Review risk: medium due to new project setup.

### Slice 3 — Compatible Public Read API

Goal:

- Serve landing-compatible organization and product data from owned storage.

Deliverables:

- `GET /api/public/organizations`.
- `GET /api/public/organizations/{orgExternalId}/products`.
- DTO mappers matching current landing expectations.
- Tests for active-product filtering and response shape.
- Seed data for El Horno del Pingüino.

Review risk: medium.

### Slice 4 — Admin Authentication and Product CRUD

Goal:

- Enable authorized product management.

Deliverables:

- Admin login/protection.
- List/create/edit/publish/unpublish products.
- Validation for required fields and prices.
- Tests for use cases and authorization boundaries.

Review risk: high; may need further splitting.

### Slice 5 — Image Uploads

Goal:

- Add easy product image management.

Deliverables:

- Storage provider integration.
- Upload/replace/remove image flow.
- File type and size validation.
- Persist `photo_url` compatible with the landing.
- Admin preview.

Review risk: high due to external provider behavior and upload edge cases.

### Slice 6 — Landing Migration

Goal:

- Point the Astro landing to the owned backend with minimal changes.

Deliverables:

- Environment variable update strategy.
- Optional small adapter only if the public contract intentionally differs.
- Remove or isolate external-backend-specific quirks when safe.
- Regression tests for fallback behavior and product rendering.

Review risk: low if public compatibility is preserved.

## 7. Risks and Open Decisions

### Risks

1. Scope creep

The phrase “owned backend/admin” can expand into inventory, ordering, payments, analytics, and CRM. The first version should stay focused on organization/product/image management for the landing.

2. Review budget overrun

A new backend plus admin plus uploads can easily exceed the 400-line review budget. Slices must be kept small, and image uploads/auth should not be bundled with public API migration.

3. API contract drift

If the owned backend changes DTO shape too early, the Astro landing will need more changes and migration risk increases. Preserve compatibility first; improve contracts later.

4. Image storage operational risk

Image uploads involve file validation, provider credentials, public delivery URLs, cache behavior, and deletion/replacement semantics. This should be isolated behind an infrastructure port.

5. Authentication and authorization risk

Admin mutation endpoints must be protected from the first implementation slice that exposes writes. Public read endpoints must remain unauthenticated but limited to active/public data.

6. Data migration quality

Current data includes upstream quirks, such as the `Chesscake` typo. Migration should clean owned data rather than preserve accidental external-backend defects.

7. Deployment ownership

The backend/admin needs its own deployment, environment variables, database, storage credentials, backups, and monitoring. These must be planned before production cutover.

### Open Decisions

1. Hosting target for the new backend/admin

Decision needed:

- Render, Vercel, Railway, Fly.io, or another platform.

Impact:

- Affects Next.js deployment mode, image upload handling, environment configuration, and persistence constraints.

2. Database provider

Decision needed:

- Postgres via Supabase, Neon, Render Postgres, Railway, or another provider.

Impact:

- Affects migrations, backups, connection pooling, local development, and cost.

3. Auth provider

Decision needed:

- NextAuth/Auth.js, Clerk, Supabase Auth, custom credentials, or platform-specific auth.

Impact:

- Affects admin protection, user management, session handling, and security posture.

4. Image storage provider

Decision needed:

- Cloudinary/Uploadcare for media-first simplicity, Supabase Storage for integrated stack, or S3-compatible storage for lower-level ownership.

Impact:

- Affects upload UX, transformations, CDN, deletion semantics, and operational complexity.

5. Repository strategy

Decision needed:

- Separate repository for backend/admin or monorepo/workspace with landing.

Impact:

- Affects CI/CD, shared DTOs, local development, and review boundaries.

6. Compatibility duration

Decision needed:

- How long the owned backend must preserve the current external API shape exactly.

Impact:

- Affects whether the landing can migrate by environment variable only or needs frontend code changes.

7. Admin language and UX copy

Decision needed:

- Whether admin UI copy should be Spanish, and whether it should follow the brand’s local tone.

Impact:

- Affects usability for business operators but should not affect technical artifact language.

## Conclusion

The strongest first direction is a separate Next.js 15 full-stack admin/backend with clean internal architecture and landing-compatible public endpoints. This balances ownership, speed, maintainability, and minimal frontend disruption.

The next SDD phase should produce a proposal that narrows the first release to product catalog ownership, image uploads, public read API compatibility, migration/rollback, and reviewable delivery slices.
