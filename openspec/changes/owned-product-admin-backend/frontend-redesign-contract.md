# Frontend Redesign Contract — Decisions the Backend Must Honor

Change: `owned-product-admin-backend`
Source: approved landing redesign (blueprint: `design/horno-landing-redesign.op`, approved 2026-07-11). This document communicates every frontend decision with backend impact so the backend is built against the real consumer.

## 1. Catalog display model (hard requirement)

- The landing renders **all active products, always** — uniform vertical grid (1/2/3 columns), no carousel, no pagination, no featured col-span card.
- **API implication**: the public products endpoint must be able to return the complete active catalog in a single response. If pagination is implemented for admin purposes, the public read path needs an "all active" mode (or a limit high enough to be effectively unbounded for a bakery catalog).
- The entrance animation (`ScrollTrigger.batch`) already scales to any N — product count is unbounded from the frontend's perspective.
- Growth plan: past ~15 products, product **category tags become client-side filters** (all products of a category still shown). **Schema implication**: include a `category` (or tags) field on products now, even if the admin UI exposes it later.

## 2. Product photos ("fotos sueltas")

- Redesigned cards are **photo-first**: a 4:3 image block leads every card (`aspect-[4/3]`, `object-cover`).
- **Media requirements**:
  - One standalone photo per product, uploaded/replaced/removed individually by a non-technical admin (already in proposal goals — confirmed as the priority).
  - Recommended stored/served size: at least **800×600** (4:3-friendly); WebP or JPEG. Frontend crops with `object-cover`, so exact 4:3 is not mandatory but center-weighted composition is.
  - An **alt text** field per photo is desirable for accessibility/SEO; fallback is the product name.
- **Empty-state contract**: when a product has no photo, `photo_url` must be `""` or `null` — never a placeholder URL or a URL that 404s. The frontend renders a flat cream placeholder block on empty values.

## 3. Display order and "favoritos"

- The catalog section is titled "Los favoritos de la vitrina"; JSON-LD offers are built from the **first 3 products** returned.
- **Schema implication**: the admin needs control over product ordering — a `sort_order` integer (or a `featured` flag affecting order). Response order = display order.

## 4. Fields the landing consumes today (keep contract-compatible)

`id`, `external_id`, `org_id`, `name`, `description`, `sku`, `price`, `cost`, `stock`, `on_demand`, `perecedero`, `photo_url`, `is_active`, `attributes`, `created_at`, `updated_at`.

- `on_demand` maps to schema.org availability: `true` → `PreOrder`, `false` → `InStock`.
- `price` is rendered directly, currency **USD**.
- Organization data consumed: `name`, `description`, `logo_url` (hero + JSON-LD).

## 5. Content rules (admin validation hints)

- Copy is Spanish; product names/descriptions should be plain text.
- **No emojis** in any product or organization content — hard brand rule; worth a soft validation warning in the admin.

## 6. What the backend does NOT need to serve (explicitly static)

- Penguin mascot sprites and character art (`public/penguin-*.png`) — static frontend assets, including the three new audience characters (business/student/coffee).
- Marquee, statement band, business-section copy, steps, FAQ, trust stats — hardcoded frontend copy in v1.
- The trust band numbers ("+120 pedidos", "5 años", "100%") are hardcoded today; an org-level settings object for such stats is a **possible later slice**, not v1.

## 7. Later slice (non-blocking): org-level media slots

- The hero currently uses the penguin mascot card (approved direction) with the design prepared to receive real photography when available.
- When professional photos exist, org-level image slots (e.g. `hero_photo_url`) or a small media library would let the admin manage non-product photos ("todo lo demás"). Explicitly **not required for v1**; do not let it grow the first release.
