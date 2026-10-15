# landing-admin-content

Make the public landing read the content the admin already manages (site settings, FAQs, banners),
then audit the live landing and fix what the user picks. Repos: horno-landing (this, branch
feat/landing-admin-content) and horno-product-admin (API + deploy hook, read-mostly).

## Specs

- S1: "Conectar la landing al admin. Es lo que encontramos recién: hoy tus cambios en Ajustes, FAQ y Banners no aparecen en el sitio. Después de esto, cualquier cosa que edites en el admin se ve en la web." (option chosen in L3). Context: the landing only calls /api/public/products (src/lib/api.ts); site data comes from SITE in src/lib/config.ts (3 PUBLIC_* overrides); FAQ is hard-coded in FAQ.astro; banners are never fetched. The admin already serves GET /api/public/site and GET /api/public/content (faqs, banners) and fires the Cloudflare deploy hook after every admin save; .github/workflows/rebuild.yml rebuilds daily as a safety net.
- S2: "Auditar la landing en producción y corregir lo que aparezca. Primero reviso sin tocar nada: velocidad, buscadores, accesibilidad, diseño en celular, errores, links rotos y botones de WhatsApp. Te traigo una lista priorizada y vos elegís qué se arregla." (option chosen in L3) — runs on the already-connected landing (S1 first).

## Tasks

- T1 (S1): build-time read of /api/public/site and /api/public/content with retry + fallback to today's hard-coded values when the API is down or a field is empty/invalid; WhatsApp/Instagram/TikTok/location come from the admin; FAQs render from the admin; active banners render (new announcement element) — route: inline/worker, test-first — commit: pending
- T2 (S1): content parity: compare the production admin's FAQs/settings with today's landing copy before switching, so the live site does not silently change — route: parent + user decision — commit: n/a
- T3 (S1): end-to-end check: landing build against the local admin preview (:3200) shows admin-edited values — route: verify — commit: n/a
- T4 (S2): read-only audit of the landing (perf, SEO, a11y, mobile, errors, links, WhatsApp) -> prioritized list for the user — route: explore/critique — commit: n/a
- T5 (S2): fix the audit items the user picks — route: after T4 — commit: pending

## Log

- L1 (user): "entonces primero enfoquyemonos en depurar bien mi pagina"
- L2 (parent): offered 1) connect the landing to the admin, 2) audit and fix the live landing, 3) both, connection first (recommended).
- L3 (user): "las 3" (= option 3: both, connection first).
- L4 (parent exploration): admin API shapes (docs/public-api.md): /api/public/site -> {whatsappNumber, instagramHandle, tiktokHandle, location, logoUrl}; /api/public/content -> {faqs:[{id,question,answer}], banners:[{id,title,body,ctaLabel}]} (banners already filtered to visible ones server-side, to confirm). triggerDeployHook is called by products, faqs, banners and site-settings admin actions.
- L5 (T2 parity, parent, production read of https://horno-product-admin.onrender.com/api/public/*): site settings MATCH the landing (593994808252, elhornodelpinguino x2, "Loja, Ecuador", logoUrl null). FAQs DO NOT match: production admin has the 6 migration-seeded FAQs, one edited to "¿Trabajan pedidos para empresas, colegios o cafeterías? HOLA" (test text); the landing shows 6 different ones ("¿Cuánto cuesta una minitorta?" with "Desde $0,99 el cheesecake pequeño…" from PR #28, "¿Puedo pedir una sola?", "¿Con cuánta anticipación pido?", "¿Puedo personalizar el diseño?", "¿Hacen entregas?", "¿Cuáles son los métodos de pago?"). Banners: none active. Switching the landing to the API without fixing the data would publish "HOLA" and drop the price FAQ -> deploy gated on the user's choice of the FAQ source of truth.
