# Landing spacing + light/dark mode

Widen the landing layout so wide screens are not mostly empty margins, and add a dark theme that follows the system preference with a persisted header toggle.
Branch: `polish/landing` (from `origin/main` e20e256). Builds on the uncommitted polish pass (Trust contrast, hero eyebrow, negocios canonical).

## Specs

- **S1** — Spacing. User: "quiero un ajuste en los espacios de la lading, hay eso en todos lados". Screenshot at ~1880px viewport marks the empty side margins around the hero with red scribbles: content is boxed to a narrow column. Every section container must use the wider width consistently, on both `/` and `/negocios/`.
- **S2** — Dark mode. User: "ademas quisiera un modo claro y oscuro". Both themes must be available across `/`, `/negocios/` and `404`.
- **S3** — Default theme. User chose: "Seguir al sistema + botón (recomendado)" — "Usa la preferencia del celular/PC; el botón sol/luna en el header permite cambiarlo y se recuerda."
- **S4** — No regressions: existing brand contrast rules (orange never as ink, AA ink tokens) hold in both themes; no theme flash on load; existing unit tests stay green.
- **S5** — Visual redesign. User: "me gustaria un rediseño manteniendo la esencia pero siendo mas wow en general, la pagina aun no vende en los visual, no agregues ni quites secciones, lo que hay que hacer es mejorar lo visual". Keep brand essence (cream/magenta/orange, Fraunces/Poppins, pixel penguin); same sections, same order, same copy.
- **S6** — Type weight. User: "la letra la veo muy fina". Headings and body read heavier.
- **S7** — Penguin presence. User: "el pinguino que es wow, aperece muy poco". The penguin is larger and more present across the page.
- **S9** — Flavour showcase. User (screenshot of "Tres que nunca fallan." with empty side margins scribbled and an arrow pointing at the prev/next buttons): "mejorar esta seccion y las felchas en los lados". The carousel uses the empty side space and the arrows sit at the sides of the carousel.
- **S10** — How to order. User (screenshot of "Tres pasos y listo" with empty side margins scribbled): "aca hay espacios vacios hay que mejorar la animacion y agrandar los pinguinos".
- **S11** — Final CTA. User (screenshot of "¿Se te antojó?" with empty side margins scribbled): "aca hay espacio, si puedes anima el pinguino corriendo y entregando alrededor algo creativo".
- **S12** — Negocios page. User: "ahora corrige la de negocio"; clarified as "La página /negocios": apply the same redesign treatment (heavier type, width, penguin, animation) to /negocios/, same sections and copy.
- **S13** — Business bridge. User: "antes del modo oscuro mejora la seccion para llevar a la parte de negocios, esta oculta literalmente". The home's door to /negocios must stand out; same position, same copy, both exits kept.
- **S14** — Floating nav. User (screenshot of the header bar: logo, Catálogo/Sabores/Para negocios/Contacto pill, Pedir por WhatsApp): "has que esta barra flote por todo el sistema". The bar stays visible while scrolling, on every page.
- **S15** — Delivery destinations. User (screenshot of the final-CTA route stops, arrows on the ring markers): "en vez de puntos por casas, clubes, escuelas, algo visual chevere". Replace the ring stops with visual destinations.
- **S8** — Order. User: "partamos por ahi antes del modo oscuro". S5-S7 land before S2-S3.

## Tasks

- [x] T1 [S1] Widen shared `.section` container (max-w-7xl, 2xl 88rem, lg:px-12) + tests/unit/layout-width.test.ts. Route: inline. Commit: 60f1799.
- [x] R1 [S5,S6] Heavier type: load Fraunces 600-900 / Poppins 400-800, shared display utilities for h1/h2, migrate section headings, stronger body weight/color. Route: inline. Commit: 60f1799.
- [x] R2 [S5,S7] Penguin: giant hero stage, larger penguins in steps/trust/FAQ/business, penguin in final CTA (existing asset, no new section). Route: inline. Commit: 60f1799.
- [x] R3 [S5] Rhythm and impact: section spacing, chunkier buttons, hero composition aligned to widened grid. Route: inline. Commit: 60f1799.
- [x] R5 [S9] Flavour showcase: wider coverflow, arrows flanking the stage. Route: inline. Commit: 60f1799.
- [x] R6 [S10] How to order: full-width steps, larger penguins, better step animation. Route: inline. Commit: 60f1799.
- [x] R7 [S11] Final CTA: penguin running a delivery route across the band. Route: inline. Commit: 60f1799.
- [x] R11 [S14] Sticky floating site header on /, /negocios/, 404. Route: inline. Commit: 60f1799.
- [x] R12 [S15] Kawaii destination sprites in the penguin's style (scripts/generate-destinations.py → public/destinations/*.png), asleep/awake states. Route: inline. Commit: 60f1799.
- [x] R10 [S13] Business bridge as full-bleed orange band with three business penguins and a solid CTA. Route: inline. Commit: 60f1799.
- [x] R9 [S12] /negocios redesign pass. Route: inline. Commit: 60f1799.
- [x] R8 [S9-S11] Verify desktop+mobile, reduced motion, tests. Route: inline. Commit: n/a.
- [x] R4 [S5-S7] Verify: unit tests, detector, desktop+mobile screenshots of / and /negocios/. Route: inline. Commit: n/a.
- T2 [S2,S4] Theme tokens: move brand colors to CSS variables with light and dark values; contrast tests for dark pairs. Route: inline. Commit: pending (next session).
- T3 [S2] Migrate hard-coded colors in global.css and components to tokens; visual pass both themes. Route: inline. Commit: pending (next session).
- T4 [S3,S4] Theme init script (no flash) + sol/luna toggle in header (desktop + mobile nav), persisted in localStorage; unit tests. Route: inline. Commit: pending (next session).
- T5 [S1-S4] Final verification: tests, detector, screenshots both themes desktop/mobile. Route: inline. Commit: n/a.

## Log

- L1 (2026-10-14): "/tmp/pi-clipboard-041c2ddb-4106-4597-8267-d02334b1a72a.png quiero un ajuste en los espacios de la lading, hay eso en todos lados, ademas quisiera un modo claro y oscuro"
- L2: Default-theme question answered: "Seguir al sistema + botón (recomendado)".
- L4 (2026-10-14): "ya que estas viendo espacios me gustaria un rediseño manteniendo la esencia pero siendo mas wow en general, la pagina aun no vende en los visual, no agregues ni quites secciones, lo que hay que hacer es mejorar lo visual, la letra la veo muy fina, el pinguino que es wow, aperece muy poco, partamos por ahi antes del modo oscuro"
- L5: Unused 64px sprite sheets (baking/delivery/faq/phone/trust) are an older blockier style; redesign uses only the hero chef sheet and the 256px transparent stills.
- L3: Pending from previous pass, still uncommitted: Trust orangeOnDark + test, hero eyebrow tracking, negocios canonical trailing slash. User asked to see locally before committing.
- L6: Round-1 redesign verified: 116/116 unit tests (tests/unit/visual-weight.test.ts RED 7/7 then GREEN), desktop+mobile screenshots of / and /negocios/. Detector warnings are pre-existing brand choices (Fraunces, business-card top stripe, hero pixel grid as pixel-art canvas), not acted on. R3 scope: chunkier .btn, hero stage aligned to widened grid; mobile hero order unchanged (penguin stage appears below the CTAs). Nothing committed; user reviews locally first.
- L7 (2026-10-14): "mejorar esta seccion y las felchas en los lados [flavour showcase screenshot] aca hay espacios vacios hay que mejorar la animacion y agrandar los pinguinos [how-to-order screenshot] aca hay espacio, si puedes anima el pinguino corriendo y entregando alrededor algo creativo [final CTA screenshot]"
- L8: User reported "se le corta la cabeza" (final CTA runner clipped at band top). Fixed by drawing the route in real pixels with headroom = runner height; chip moved below the stop so it never covers the penguin. Verified 1880/1440/390.
- L9 (2026-10-14): "ahora corrige la de negocio" → choice "La página /negocios".
- L10: R9 verified: 119/119 unit tests (3 new RED→GREEN), /negocios desktop+mobile screenshots, no console errors or horizontal overflow.
- L11 (2026-10-14): "antes del modo oscuro mejora la seccion para llevar a la parte de negocios, esta oculta literalmente". RED 2/3 then GREEN 122/122. Contrast computed: ink/orange 7.68, magentaDeep/orange 4.39 (heading only, large text), tag 10.33, CTA 9.42.
- L12: R10 verified at 1440 and 390 (mobile grid overflow 376px found and fixed: grid-cols-[minmax(0,1fr)] + smaller phone penguins).
- L13 (2026-10-14): "has que esta barra flote por todo el sistema. [header screenshot] en vez de puntos por casas, clubes, escuelas, algo visual chevere [route stops screenshot]". Commit question still unanswered; nothing committed.
- L14 (2026-10-14): "esa casa esta terrible, que tenga el mismo estilo del pinguino o saca cosas ya creadas busca por la web". Web packs found were RPG-style and clash with the penguin; redrew as generated kawaii sprites. Verified 1440 + 390; mobile chip overlap/clip fixed. 130/130 tests.
- L15 (2026-10-14): "mejora las caras de los edificios". Faces redrawn in penguin style: oval eyes with double sparkle, oval blush, open smile when awake; asleep = curved closed eyes, soft blush, "o" mouth and "zz" above the building. 130/130 tests.
- L16 (2026-10-14): "listo por ahora paramos y commitea todo, el seguimiento del pulido y modo oscuro lo hacemos en otra sesion". Committed on polish/landing, not pushed: d444cd7 fix(seo) negocios canonical; 60f1799 feat(landing) redesign. Unit suite 130/130 incl. production build.

## Handoff (next session)

- Open: T2-T5 dark mode (S2-S4). Tailwind @config compiles horno colors to literal hex, so the palette must move to CSS custom properties first; tests/unit/brand-contrast.test.ts reads hex from tailwind.config.mjs and needs dark pairs.
- Not run: Playwright e2e (project browsers missing; use executablePath /usr/bin/google-chrome-stable or `npx playwright install`). Specs touching changed areas: visual-refresh (order pinned timeline, nav), negocios (segment rows, nav links), hero-penguin, tap-targets.
- Not done: native RDD review (user stopped the session), push, PR.
- Data fixes outside this repo: catalog typos ("Cheesecake de limon", "Cheescake de maracuya", "chranchy") live in horno-product-admin.
