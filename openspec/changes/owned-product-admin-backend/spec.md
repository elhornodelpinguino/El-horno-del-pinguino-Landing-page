# Owned Product Admin Backend Specification

## Purpose

The owned product admin backend MUST let El Horno del Pingüino manage its public catalog independently from the current external backend while preserving the Astro landing migration path, public API compatibility, and rollback safety. The first release SHALL remain catalog-focused and SHALL NOT include ordering, payments, customer accounts, delivery logistics, promotions, analytics dashboards, or inventory automation beyond compatibility fields required by the current landing.

## Requirements

### Requirement: Public Organization API Compatibility

The system MUST expose a public unauthenticated `GET /api/public/organizations` endpoint compatible with the current landing contract, returning an `organizations` array and `count` number. Organization data MUST preserve the initial external identifier `horno-del-pinguino-92f9` for migration compatibility.

#### Scenario: Landing fetches organizations without authentication

- GIVEN the owned backend has El Horno del Pingüino organization data
- WHEN the landing requests `GET /api/public/organizations` without admin credentials
- THEN the response MUST include `organizations` and `count`
- AND at least one organization MUST expose the compatible external identifier `horno-del-pinguino-92f9`
- AND the request MUST NOT require authentication

### Requirement: Public Products API Compatibility

The system MUST expose a public unauthenticated `GET /api/public/organizations/{orgExternalId}/products` endpoint compatible with the current landing contract. The response MUST include `products`, `count`, `page`, and `page_size`; each product visible to the landing MUST include at least `name`, `description`, `price`, `photo_url`, `on_demand`, and `is_active`. Additional legacy-compatible fields MAY be returned, but the first release MUST NOT require the Astro landing to depend on new fields.

#### Scenario: Landing fetches products with the existing DTO shape

- GIVEN active products exist for organization `horno-del-pinguino-92f9`
- WHEN the landing requests `GET /api/public/organizations/horno-del-pinguino-92f9/products`
- THEN the response MUST include `products`, `count`, `page`, and `page_size`
- AND every product item MUST include the landing-required fields
- AND the endpoint MUST NOT require authentication

### Requirement: Public Product Visibility

The system MUST include only active/public products in public product listings. Inactive products MUST remain manageable by admins but MUST NOT appear in public landing responses.

#### Scenario: Inactive product is hidden from visitors

- GIVEN one product is active and another product is inactive
- WHEN a visitor requests the public products endpoint
- THEN the response MUST include the active product
- AND the response MUST NOT include the inactive product

### Requirement: Admin Authentication for Mutations

The system MUST require authenticated admin access before any product, organization, or image mutation is accepted. Public read endpoints MUST remain unauthenticated. The first release SHOULD support one protected admin operator/admin role and MUST NOT require a complex role-permission model.

#### Scenario: Unauthenticated write is rejected

- GIVEN no valid admin session or credential is present
- WHEN a client attempts to create, update, delete, publish, unpublish, upload, replace, or remove product data
- THEN the system MUST reject the request
- AND no catalog or media state MUST be changed

#### Scenario: Authenticated admin write is accepted

- GIVEN a valid admin operator is authenticated
- WHEN the admin submits a valid product mutation
- THEN the system MUST process the mutation
- AND the updated state MUST be available to subsequent admin reads

### Requirement: Product CRUD and Publish State

The system MUST allow an authenticated admin to create, view, update, and delete or archive products for the catalog. Product records MUST support name, description, price, on-demand status, active status, and image association. Publishing and unpublishing MUST be controlled through `is_active` or an equivalent compatible field.

#### Scenario: Admin creates a product

- GIVEN an authenticated admin provides a valid name, description, non-negative price, on-demand status, active status, and optional image
- WHEN the admin creates the product
- THEN the system MUST persist the product
- AND the product MUST be available in admin product lists
- AND the product MUST appear in public product lists only when active

#### Scenario: Admin updates product display data

- GIVEN an authenticated admin is editing an existing product
- WHEN the admin changes the name, description, price, on-demand status, or active status with valid values
- THEN the system MUST persist the updated values
- AND subsequent public responses MUST reflect the changes for active products

### Requirement: Product Validation

The system MUST validate product data before persistence. Product name MUST be present, price MUST be a valid non-negative monetary value, and public responses MUST remain safe when optional fields such as `photo_url` are absent. Invalid product data MUST be rejected without partially changing persisted state.

#### Scenario: Invalid product data is rejected

- GIVEN an authenticated admin submits a product without a name or with a negative price
- WHEN the system validates the request
- THEN the system MUST reject the request
- AND it MUST explain the validation failure to the admin interface or API caller
- AND no partial product change MUST be persisted

### Requirement: Product Image Upload and Preview

The system MUST allow an authenticated admin to upload and preview a product image. Production uploads MUST use managed media or object storage, not the application filesystem. Image uploads MUST validate accepted content type and maximum file size before storage. The system MUST store media metadata, keep provider-specific asset identifiers separate from public URLs, and expose or derive a stable public `photo_url` for landing compatibility.

#### Scenario: Admin uploads a valid product image

- GIVEN an authenticated admin selects a supported image within the maximum allowed size
- WHEN the admin uploads the image for a product
- THEN the system MUST store the image in managed media or object storage
- AND it MUST persist the media metadata and provider asset identifier separately from the public URL
- AND it MUST provide a previewable image URL to the admin
- AND the public product DTO MUST expose a safe `photo_url` when the product is active

#### Scenario: Invalid image upload is rejected

- GIVEN an authenticated admin selects an unsupported file type or oversized file
- WHEN the admin attempts to upload the image
- THEN the system MUST reject the upload before accepting it as product media
- AND the existing product image state MUST remain unchanged

### Requirement: Product Image Replacement and Removal

The system MUST allow an authenticated admin to replace or remove a product image without deleting the product. Removing or replacing an image MUST NOT leave public product responses in a broken display state. Provider deletion or cleanup MAY be asynchronous, but product metadata MUST reflect the admin-visible state consistently.

#### Scenario: Admin replaces a product image

- GIVEN a product already has an image
- WHEN an authenticated admin replaces it with a valid new image
- THEN the product MUST reference the new public `photo_url`
- AND the previous provider asset identifier MUST no longer be the active product image
- AND the product MUST remain valid for public display

#### Scenario: Admin removes a product image

- GIVEN a product has an image
- WHEN an authenticated admin removes the image
- THEN the product MUST remain in the catalog
- AND public responses MUST return a safe missing-image representation compatible with the current landing
- AND visitors MUST NOT see a broken product record because the image is absent

### Requirement: Data Migration and Cleanup

The system MUST support seeding or importing the initial organization and product catalog from current known backend or fallback data. Migration MUST preserve public API compatibility, preserve the organization external identifier, and clean known data defects such as `Chesscake` to `Cheesecake` instead of making upstream typos canonical owned data. Migration MUST avoid destructive cutover steps in the first release.

#### Scenario: Initial catalog is imported with cleanup

- GIVEN current external or fallback product data is available
- WHEN the initial owned backend catalog is seeded or imported
- THEN the organization MUST be created with external identifier `horno-del-pinguino-92f9`
- AND products MUST be migrated into the owned catalog
- AND known data defects MUST be corrected during import
- AND the resulting public DTO MUST remain compatible with the landing

### Requirement: Rollback and Cutover Safety

The system MUST preserve a reversible cutover path for the Astro landing. The landing MUST be able to point to the owned backend primarily through `PUBLIC_API_BASE_URL` while keeping `PUBLIC_ORG_EXTERNAL_ID`, the previous external backend URL, and local fallback data available during the first release window. The first release MUST NOT remove existing landing fallback behavior.

#### Scenario: Production rolls back to the previous backend

- GIVEN the owned backend has been selected through `PUBLIC_API_BASE_URL`
- AND an operational issue is detected during the release window
- WHEN production configuration is changed back to the previous backend URL
- THEN the landing MUST be able to fetch compatible organization and product data without frontend code changes
- AND fallback JSON behavior MUST remain available if remote fetching fails

### Requirement: Landing Integration Boundary

The system MUST keep backend replacement complexity outside the Astro landing. The landing integration SHOULD require only environment configuration and minimal compatibility verification for the first release. The backend MUST NOT force a landing redesign or require new product DTO fields during the first migration slice.

#### Scenario: Staging landing switches to the owned backend

- GIVEN the owned backend is deployed to staging with migrated catalog data
- WHEN staging `PUBLIC_API_BASE_URL` points to the owned backend and `PUBLIC_ORG_EXTERNAL_ID` remains `horno-del-pinguino-92f9`
- THEN the landing MUST render products using the existing public contract
- AND active filtering, fallback behavior, and image loading MUST be verified before production cutover

### Requirement: Operational Basics and Observability

The system MUST define operational ownership for deployment, secrets, database persistence, media storage credentials, backups, and basic monitoring. Public read failures and admin mutation failures SHOULD be observable through logs or provider monitoring without exposing secrets or sensitive admin details to public clients.

#### Scenario: Operator investigates a public API failure

- GIVEN the public products endpoint returns an unexpected error
- WHEN an operator reviews backend logs or monitoring
- THEN the operator SHOULD be able to identify the failing endpoint and error category
- AND logs MUST NOT expose admin credentials, secrets, or sensitive provider tokens

#### Scenario: Operator verifies backup readiness

- GIVEN the owned backend stores organization, product, and media metadata
- WHEN the service is prepared for production cutover
- THEN database backup responsibility MUST be documented or configured
- AND media storage credential ownership MUST be documented or configured

### Requirement: First Release Scope Guardrails

The first release MUST remain focused on owned catalog administration and public catalog delivery. It MUST exclude online ordering, checkout, payments, customer accounts, delivery logistics, promotions, loyalty, analytics dashboards, and automated inventory reservation or stock workflows. Compatibility stock or SKU fields MAY exist only to preserve public DTO compatibility and MUST NOT become automated inventory behavior in this release.

#### Scenario: Commerce feature request is deferred

- GIVEN a request is made to add checkout, payment, customer account, delivery, promotion, analytics, or automated stock behavior during the first release
- WHEN the request is evaluated against this change scope
- THEN the feature MUST be deferred outside this release
- AND the catalog-admin migration MUST remain the priority

### Requirement: Testable Architecture Boundaries

The system MUST keep domain and application behavior testable independently from the web framework. Public DTO mapping, validation, active filtering, migration cleanup, auth-required mutation behavior, and image state transitions MUST have tests before implementation completion under strict TDD mode.

#### Scenario: Core behavior is tested before completion

- GIVEN implementation work begins for catalog, public API, migration, auth, or image behavior
- WHEN the behavior is considered complete
- THEN tests MUST cover happy paths, validation failures, edge cases, and relevant error paths
- AND tests MUST be runnable through the project test command before verification
