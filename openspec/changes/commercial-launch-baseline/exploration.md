## Exploration: commercial-launch-baseline

### Current State

#### Production Deployment
- **URL**: `https://el-horno-del-pinguino-landing-page.pages.dev` — Astro 4 static site deployed on **Cloudflare Pages Free**.
- **Hosting config**: `astro.config.mjs` sets `site` to the Pages URL. No custom domain is configured. No Cloudflare Web Analytics or other observability is active.
- **CI/CD**: GitHub Actions (`ci.yml`) runs audit, Vitest unit tests, build, Playwright E2E on every push/PR to `main`. Daily rebuild cron (`rebuild.yml`) via a Cloudflare deploy hook (secret `CF_DEPLOY_HOOK_URL`) and manual workflow dispatch.
- **Backend**: Product catalog fetched from `https://horno-product-admin.onrender.com` (Render free tier) at build time. A prebuild script (`warm-backend.mjs`) polls the backend health endpoint to wake it from idle sleep. Fallback data in `src/data/fallback.json` when the backend is unreachable — the build never fails.

#### Pages
Exactly two production pages, both rendering on demand via the same `BaseLayout`:
| Path | Purpose | Title Template |
|------|---------|---------------|
| `/` | Consumer landing | `El Horno del Pingüino — Minitortas y minidonas artesanales en Loja` |
| `/negocios/` | B2B business page | `Pedidos para negocios en Loja — El Horno del Pingüino` |

#### Canonical / OG / Schema / Sitemap / Robots
| Element | Status | Current Value |
|---------|--------|---------------|
| **Canonical** | Set per-page | `/` → `https://el-horno-del-pinguino-landing-page.pages.dev`, `/negocios/` → `https://el-horno-del-pinguino-landing-page.pages.dev/negocios` |
| **OG tags** | Present in `BaseLayout.astro` | `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image=/og-image.png` resolved against `Astro.site` |
| **Twitter card** | Present | `summary_large_image` with title and image |
| **Schema JSON-LD** | Both pages | `Organization` with name, URL, logo, description, address (Loja, EC). `/` adds up to 3 conditional `Offer` entries from live products. |
| **Sitemap** | Working | `@astrojs/sitemap` integration. Generates `/sitemap-index.xml` → `/sitemap-0.xml` with both URLs. |
| **Robots.txt** | Static file in `public/` | Allows all, disallows `/e2e-fixtures/`, sitemap points to `*.pages.dev`. |
| **Hreflang** | Absent | Single locale (`es`), no alternative language declarations. |
| **Noindex** | Absent | Both pages are indexable. |

All canonical/OG/sitemap/schema URLs are **hardcoded to the `*.pages.dev` domain** — every reference must change atomically when a custom domain is introduced.

#### WhatsApp / Contact Paths
| Path | Location | Behavior |
|------|----------|----------|
| Sticky WhatsApp | `StickyWhatsApp.astro` | Mobile-only fixed bottom bar. Defaults to consumer message; `audience="business"` prop swaps to B2B message. |
| Contact footer | `Contact.astro` | Full footer with WhatsApp (phone + link), Instagram, TikTok, and physical address. |
| B2B CTA (intro) | `negocios.astro` header | Prefilled: `"Ya conversamos. Quiero contarte qué necesito para mi negocio."` |
| B2B CTA (closing) | `negocios.astro` closing | Prefilled: `"Ya nos conocimos. Te cuento qué necesito para armar la propuesta."` |
| Flavour CTA | `FlavourShowcase.astro` | Per-flavour: `"Quiero consultar el sabor {flavour}."` |
| Segment CTAs | `BusinessSegmentRow.astro` | Per-segment (cafeterías/colegios/clubes/empresas) |
| **Number** | `config.ts` | Default `593994808252` (Ecuador), overridable via `PUBLIC_WHATSAPP_NUMBER` |
| **No email** | Absent | No email or phone-call contact paths exist — WhatsApp-only. |

**Verified deployed**: All WhatsApp links use `wa.me/[number]?text=[encoded-message]` format. The number resolves correctly to a WhatsApp account.

#### Analytics / Tracking
**NONE.** Zero analytics scripts, zero event instrumentation, zero third-party tracking of any kind. The codebase has no references to Google Analytics, Cloudflare Web Analytics, Meta Pixel, or any other observability tool.

#### Domain Migration Touchpoints
Every reference to `el-horno-del-pinguino-landing-page.pages.dev` in the codebase:

1. `astro.config.mjs:6` — `site:` property (used by sitemap generator and `Astro.site`)
2. `src/pages/index.astro:40` — schema `url` field
3. `src/pages/index.astro:41` — schema `logo` field (also `ogImage` resolves via `Astro.site`)
4. `src/pages/index.astro:56` — explicit `canonicalUrl` prop
5. `src/pages/negocios.astro:21` — explicit `canonicalUrl` prop
6. `src/pages/negocios.astro:27` — schema `logo` field
7. `src/pages/negocios.astro:28` — schema `url` field
8. `public/robots.txt:5` — sitemap URL

No external references (Search Console, Google Business Profile, social media bios, business cards) can be verified from the repository — these are owner-only data points.

#### Performance / Indexability Signals
**Strengths**:
- WebP images with responsive `srcset`/`sizes` across all image components (both desktop and mobile variants)
- `loading="lazy"` on non-critical images; `loading="eager"` on hero/logo
- GSAP scroll animations respect `prefers-reduced-motion: reduce`
- Security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) via Cloudflare
- Static site with no server-side rendering latency
- Explicit `width`/`height` attributes on most images to prevent CLS

**Gaps**:
- No `preload`, `prefetch`, or `fetchpriority` hints
- Font loading from Google Fonts (`Fraunces`, `Poppins`) with no local fallback or `font-display: swap` optimization visible at the build level
- Images are pre-built static files in `public/` — no build-time optimization pipeline (sharp, Astro's built-in image optimization)
- No `Content-Security-Policy` header
- No HTML validation or Lighthouse CI in the pipeline
- Product images (`/producto-torta-mariposas.jpg`, `/producto-mini-donas.jpg`) are JPEGs, not WebP
- No structured breadcrumb or FAQ schema on the home page (FAQ section is purely visual)

#### Owner-Only Dependencies
These items **cannot** be completed without the business owner's credentials, decisions, or data:
1. **Domain name**: Purchase, TLD choice, registrar account, 2FA setup, renewal verification
2. **Cloudflare account**: Domain DNS configuration, custom domain in Pages, access delegation
3. **Google Search Console**: Domain property verification, sitemap submission
4. **Google Business Profile**: Business eligibility, address/hours/service area, verification, photos
5. **Analytics**: Choice of tool, dashboard access, privacy policy alignment
6. **Business operational data**: Real address, hours, production capacity, delivery radius, pricing
7. **Social media accounts**: Instagram/TikTok handles (currently hardcoded defaults exist — verified or not)
8. **WhatsApp number**: The business number (currently a possibly-right default `593994808252`)

### Affected Areas
- `astro.config.mjs` — `site:` property must change when custom domain is active
- `src/layouts/BaseLayout.astro` — OG/twitter/canonical generation logic uses `Astro.site`
- `src/pages/index.astro` — hardcoded canonical, schema URL, and logo URL
- `src/pages/negocios.astro` — hardcoded canonical, schema URL, and logo URL
- `public/robots.txt` — sitemap URL
- `src/lib/config.ts` — contact data (whatsapp, instagram, tiktok) — already env-overridable
- `src/lib/api.ts` — backend API base URL — already env-overridable
- `openspec/project-context.md` — stale data about backend coupling must be updated
- `docs/plan-mensual-lanzamiento.md` — operational plan for the 30-day window
- `docs/deploy-cloudflare.md` — deployment documentation references environment variables

### Approaches

1. **Minimal domain-canonical migration only** — Change `site`, canonicals, robots, and schema to a custom domain once purchased. No analytics, no business data.
   - Pros: Smallest code change, immediately verifiable, no owner dependency beyond domain
   - Cons: Leaves analytics gap open, no measurement baseline starts
   - Effort: Low

2. **Full Week-1 (domain + analytics + baseline)** — Domain migration + Cloudflare Web Analytics installation + WhatsApp event tracking in one proposal. Spans all owner-independent work plus the one measurement change.
   - Pros: Single SDD cycle completes the measurable baseline, analytics starts collecting Day 1
   - Cons: Couples domain migration (owner-dependent) with instrumentation (autonomous) — one blocks the other
   - Effort: Medium

3. **Split: analytics-first, domain-second** — First proposal: Cloudflare Web Analytics + WhatsApp click events (zero owner dependency). Second proposal: domain migration (requires owner decision). Each is independently shippable.
   - Pros: Analytics starts immediately regardless of domain decision; no blocking dependency; each proposal is small and reviewable
   - Cons: Two SDD cycles instead of one
   - Effort: Low (each)

### Recommendation

**Approach 3 — Split: analytics-first, domain-second.**

The single biggest gap that blocks the 30-day plan is **zero measurement**. Without analytics, there is no baseline to compare against at Day 30. This work is 100% autonomous — requires no owner credentials, no business decisions, no domain purchase. It can start and ship immediately.

The first proposal should:
- Install **Cloudflare Web Analytics** (free, zero-config, privacy-friendly, no cookie banner required)
- Add lightweight WhatsApp click tracking (custom events or URL parameters to distinguish consumer vs B2B vs flavour clicks)
- Optionally add a favicon that renders properly on all platforms (current inline SVG works but is non-standard)

The second proposal (domain migration) blocks on the owner choosing and purchasing a domain. That work should be a separate, smaller scope that can be planned once the domain is confirmed.

Cross-cutting: update `openspec/project-context.md` — it references a stale API structure (old Render URL, `PUBLIC_ORG_EXTERNAL_ID`, SSR mode that no longer exists).

### Risks
- **Zero measurement window**: Every day without analytics is a lost Day-30 comparison point. The 30-day plan runs from 27 July — analytics should start within the first week.
- **Stale project context**: `openspec/project-context.md` describes SSR, a different backend URL, and `PUBLIC_ORG_EXTERNAL_ID` — none of which match the current codebase. This will confuse future SDD planning.
- **No current Lighthouse/performance baseline**: Without running Lighthouse now, there is no performance baseline to compare against post-migration.
- **Domain delay risk**: If the owner delays the domain decision past Week 2, the migration window shrinks before the 30-day plan ends.
- **Number verification**: The default WhatsApp number `593994808252` may be the owner's actual number — but this is not verified. If it's wrong, every WhatsApp link in production is broken.

### Ready for Proposal
**Yes.** The analytics-first proposal has no blocking dependencies and can proceed immediately. Recommend the orchestrator tell the user:

> The exploration is complete. The analytics gap is the critical path blocker and requires no owner input — recommend launching an SDD proposal for Cloudflare Web Analytics + WhatsApp click tracking as the first commercial-launch-baseline task. Domain migration should be a separate follow-up proposal that blocks on owner domain decision. A quick update to `openspec/project-context.md` should also be folded into the first proposal because its current state is misleading.
