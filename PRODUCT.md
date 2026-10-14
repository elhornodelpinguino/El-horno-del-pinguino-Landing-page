# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary (home page `/`): people in Loja, Ecuador, with a personal craving
("antojo") who want something sweet for themselves or to share at home, today
or tomorrow. They arrive mostly on mobile and decide fast.

Secondary (`/negocios/`): cafeterias, offices, schools and clubs buying in
volume. They have their own page and their own WhatsApp context.

## Product Purpose

A small artisan bakery in Loja selling mini cakes (minitortas, cheesecakes)
and mini donuts, baked to order. The landing page exists to turn a craving
into a WhatsApp conversation. Success is a visitor tapping a WhatsApp CTA.

## Positioning

- **Mini format:** individual portions (minitortas, minidonas), not whole
  cakes.
- **Direct, fast contact:** you write on WhatsApp and they answer the same
  day; delivery point and time are coordinated in the chat, within Loja.

## Operating Context

- Ordering happens entirely on WhatsApp (`SITE.whatsapp` in
  `src/lib/config.ts`); the site has no cart or checkout.
- Catalogue comes from the horno-product-admin backend
  (`PUBLIC_API_BASE_URL`), with `src/data/fallback.json` as fallback.
- Analytics: GoatCounter with WhatsApp contexts `consumer`, `business-intro`,
  `business-closing` (see `docs/plan-mensual-lanzamiento.md`).

## Capabilities and Constraints

- Static Astro site deployed on Cloudflare (`docs/deploy-cloudflare.md`).
- Signature flavours: frutos rojos, maracuyá, Oreo.
- Delivery within Loja only; payment methods are answered in the FAQ.
- Prices are not published on the site; they are given on WhatsApp.

## Brand Commitments

- Name: "El Horno del Pingüino". Logo files in `public/logo*.svg`,
  `public/isotipo.png`.
- The penguin chef is the protagonist of the brand and must stay present
  and active, not reduced to a stamp. Pixel-art sprites live in
  `public/penguin-*.png` (prompts in `docs/penguin-section-sprite-prompts.md`).
- Site copy speaks Spanish with "tú" (e.g. "Escríbenos qué quieres"), not
  voseo.

## Evidence on Hand

- Real product photography in `public/` (`chesscake-hero.webp`,
  `flavour-*.webp`, `producto-mini-donas.jpg`, `destacada-*.jpg`,
  `b2b-*.webp`).
- Confirmed by the owner (2026-10-14): more than 120 orders delivered and 3 years
  baking in Loja; everything is handmade.
- No testimonials, ratings or press exist. Do not invent them.

## Product Principles

1. The real product sells; illustration supports it, never replaces it.
2. Every section ends one tap away from WhatsApp.
3. Speak like the person who answers the chat: warm, short, local.
4. The penguin is a character with things to do, not a decoration.
