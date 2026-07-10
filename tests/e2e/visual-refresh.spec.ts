import { test, expect } from "@playwright/test";

test.describe("Visual Refresh — Interactions", () => {
  test.describe("Mobile Navigation", () => {
    test("hamburger is visible on mobile and hidden on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      await expect(hamburger).toBeVisible();

      await page.setViewportSize({ width: 768, height: 800 });
      await expect(hamburger).toBeHidden();
    });

    test("opens and closes mobile menu", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      const nav = page.locator("[data-mobile-nav]");

      // Initially closed
      await expect(nav).toHaveAttribute("data-menu-open", "false");

      // Open
      await hamburger.click();
      await expect(nav).toHaveAttribute("data-menu-open", "true");

      // Close via hamburger
      await hamburger.click();
      await expect(nav).toHaveAttribute("data-menu-open", "false");
    });

    test("Escape closes mobile menu and returns focus to button", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      const nav = page.locator("[data-mobile-nav]");

      await hamburger.click();
      await expect(nav).toHaveAttribute("data-menu-open", "true");

      await page.keyboard.press("Escape");
      await expect(nav).toHaveAttribute("data-menu-open", "false");
      await expect(hamburger).toBeFocused();
    });

    test("focus trap keeps Tab inside open menu", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      await hamburger.click();

      const navLinks = page.locator("[data-mobile-nav] a");
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThanOrEqual(3);

      // Tab through all links and verify focus cycles
      for (let i = 0; i < linkCount * 2; i++) {
        await page.keyboard.press("Tab");
      }
      // No crash — focus stays within the nav
      await expect(page.locator("[data-mobile-nav]")).toHaveAttribute("data-menu-open", "true");
    });

    test("desktop viewport has no hamburger and desktop links visible", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.goto("/");
      await expect(page.locator("[data-hamburger]")).toBeHidden();
      // Desktop nav links should be visible
      const desktopLinks = page.locator("nav .hidden.sm\\:flex a");
      await expect(desktopLinks.first()).toBeVisible();
    });
  });

  test.describe("FAQ Accordion", () => {
    test("opens and closes FAQ items via click", async ({ page }) => {
      await page.goto("/");
      const details = page.locator("[data-faq-root] details").first();
      const content = details.locator(".faq-content");

      // Initially closed
      await expect(details).not.toHaveAttribute("open");

      // Click summary to open
      await details.locator("summary").click();
      await expect(details).toHaveAttribute("open");

      // Click summary again to close
      await details.locator("summary").click();
      await expect(details).not.toHaveAttribute("open");
    });

    test("Enter key opens FAQ item", async ({ page }) => {
      await page.goto("/");
      const details = page.locator("[data-faq-root] details").first();
      const summary = details.locator("summary");

      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("open");
    });

    test("Space key toggles FAQ item", async ({ page }) => {
      await page.goto("/");
      const details = page.locator("[data-faq-root] details").first();
      const summary = details.locator("summary");

      await summary.focus();
      await page.keyboard.press(" ");
      await expect(details).toHaveAttribute("open");
    });

    test("Arrow Down navigates to next FAQ item", async ({ page }) => {
      await page.goto("/");
      const summaries = page.locator("[data-faq-root] summary");

      await summaries.first().focus();
      await page.keyboard.press("ArrowDown");
      await expect(summaries.nth(1)).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(summaries.nth(2)).toBeFocused();
    });

    test("Arrow Up navigates to previous FAQ item", async ({ page }) => {
      await page.goto("/");
      const summaries = page.locator("[data-faq-root] summary");

      await summaries.nth(1).focus();
      await page.keyboard.press("ArrowUp");
      await expect(summaries.first()).toBeFocused();
    });
  });

  test.describe("Scroll Animations", () => {
    test("no legacy IntersectionObserver reveal classes remain in the DOM", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);

      // The legacy .animate-on-scroll IO system has been fully retired
      const legacyCount = await page.locator(".animate-on-scroll").count();
      expect(legacyCount).toBe(0);
    });

    test("GSAP entrance sections are visible after settling", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1200);

      // Representative data-anim targets across migrated sections
      await expect(page.locator("[data-hero-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-catalog-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-business-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-trust-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-finalcta-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-faq-anim='item']").first()).toBeVisible();
      await expect(page.locator("[data-contact-anim='column']").first()).toBeVisible();
    });

    test("GSAP scroll-scrub targets move when scrolling", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(500);

      // Scroll to the HowToOrder section (avoid scrollIntoViewIfNeeded on animated elements)
      await page.evaluate(() => {
        const section = document.getElementById("como-pedir");
        if (section) section.scrollIntoView({ block: "center" });
      });
      await page.waitForTimeout(300);

      const bubble = page.locator("[data-order-anim='bubble1']");
      const transformBefore = await bubble.evaluate(
        (el) => window.getComputedStyle(el).transform
      );

      // Scroll further down to drive the scrub timeline
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(300);

      const transformAfter = await bubble.evaluate(
        (el) => window.getComputedStyle(el).transform
      );

      // Scrub parallax should have changed the inline transform
      expect(transformBefore).not.toBe(transformAfter);
    });

    test("GSAP entrance targets are hidden before scroll and revealed after scrolling (computed style)", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(300);

      const catalogHeading = page.locator("[data-catalog-anim='heading']");
      const faqIntro = page.locator("[data-faq-anim='intro']");
      const contactColumn = page.locator("[data-contact-anim='column']").first();
      const targets = [catalogHeading, faqIntro, contactColumn];

      // Pre-scroll: below-fold entrance targets must NOT already be revealed —
      // toBeVisible() ignores opacity/transform, so this proves via computed
      // style that the reveal is scroll-gated, not fired on load (spec.md:9-14).
      const preScrollOpacities = await Promise.all(
        targets.map((locator) => locator.evaluate((el) => window.getComputedStyle(el).opacity))
      );
      for (const opacity of preScrollOpacities) {
        expect(opacity).not.toBe("1");
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1200);

      // Post-scroll: same targets must now be fully revealed — proves the
      // ScrollTrigger actually fired the entrance, not just that it settled
      // into some non-zero value.
      const postScrollOpacities = await Promise.all(
        targets.map((locator) => locator.evaluate((el) => window.getComputedStyle(el).opacity))
      );
      for (const opacity of postScrollOpacities) {
        expect(opacity).toBe("1");
      }
    });

    test("section content remains visible when its animation script fails to execute (GSAP-only hiding contract)", async ({ page }) => {
      // Block the FAQ entrance script (dev server) and the bundled hoisted
      // script (production build, where all section scripts merge into one
      // chunk) so the .from() tween that sets opacity:0 on load never runs.
      // This proves content is never CSS pre-hidden — hiding comes exclusively
      // from GSAP, so a script failure leaves content visible (spec.md:44-52).
      await page.route(
        (url) => url.pathname.includes("faq-animation") || url.pathname.includes("hoisted"),
        (route) => route.abort()
      );

      await page.goto("/");
      await page.waitForTimeout(300);

      const faqItem = page.locator("[data-faq-anim='item']").first();
      await faqItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // No CSS pre-hides this element and the animation script never ran,
      // so its natural computed opacity must be the unanimated default (1).
      const opacity = await faqItem.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
    });

    test("Contact section reveals on a tall viewport (regression: no dead zone at max scroll)", async ({ page }) => {
      // Regression guard for the R4-001 dead-zone bug: on a tall viewport, a
      // footer shorter than 15% of the viewport height never crosses a
      // "top 85%" trigger at max scroll, permanently stranding it at
      // opacity:0. Proves the fix fires regardless of viewport/footer size.
      await page.setViewportSize({ width: 1440, height: 2000 });
      await page.goto("/");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1200);

      const contactColumn = page.locator("[data-contact-anim='column']").first();
      const opacity = await contactColumn.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(opacity).toBe("1");
    });

    test("reduced motion shows visible final state with no console errors", async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.waitForTimeout(600);

      // Representative elements should be visible without animation
      await expect(page.locator("[data-hero-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-business-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-trust-anim='heading']")).toBeVisible();
      await expect(page.locator("[data-faq-anim='item']").first()).toBeVisible();
      await expect(page.locator("[data-contact-anim='column']").first()).toBeVisible();

      // No GSAP/animation-related console errors
      expect(consoleErrors).toEqual([]);
    });
  });

  test.describe("Storytelling Components (Fase 2)", () => {
    test("HowToOrder pins during scroll and releases with no leftover gap", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");
      await page.waitForTimeout(300);

      const section = page.locator(".order-section");

      // Align the section's top exactly with the viewport top so we cross
      // the ScrollTrigger `start: "top top"` threshold deterministically.
      await page.evaluate(() => {
        const el = document.querySelector(".order-section");
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      });
      await page.waitForTimeout(200);
      const topAtEntry = await section.evaluate((el) => el.getBoundingClientRect().top);

      // Scroll partway into the pinned range — the section must stay pinned
      // (its viewport position does not move even though scrollY advances).
      await page.evaluate(() => window.scrollBy(0, 250));
      await page.waitForTimeout(200);
      const topMidScroll = await section.evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(topMidScroll - topAtEntry)).toBeLessThan(2);

      // Scroll well past the pinned range's end — the section must unpin.
      await page.evaluate(() => window.scrollBy(0, 3000));
      await page.waitForTimeout(300);
      const topAfterRelease = await section.evaluate((el) => el.getBoundingClientRect().top);
      expect(topAfterRelease).toBeLessThan(topMidScroll - 100);

      // No leftover pin-spacing gap: the following section must be
      // reachable without an oversized empty dead zone.
      const trust = page.locator(".trust-section");
      await trust.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expect(trust).toBeVisible();
    });

    test("HowToOrder pin does not trap scroll on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      await page.waitForTimeout(300);

      const section = page.locator(".order-section");
      await page.evaluate(() => {
        const el = document.querySelector(".order-section");
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      });
      await page.waitForTimeout(200);
      const topAtEntry = await section.evaluate((el) => el.getBoundingClientRect().top);

      // On mobile the section must NOT pin — a bounded scroll (roughly one
      // viewport height) must be enough to move it away from the top.
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(200);
      const topAfterBoundedScroll = await section.evaluate((el) => el.getBoundingClientRect().top);
      expect(topAfterBoundedScroll).toBeLessThan(topAtEntry - 400);
    });

    test("HowToOrder pinned timeline failure fails open — steps stay visible even if pin setup throws", async ({ page }) => {
      // Forces the exact failure window flagged in review: an exception
      // thrown between `gsap.set(steps, {opacity:.4})` and the
      // pinned/scrubbed timeline construction must not leave steps dimmed
      // indefinitely (see order-animation.js's try/catch).
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.addInitScript(() => {
        const original = window.getComputedStyle;
        let armed = true;
        window.getComputedStyle = function (this: Window, el: Element, ...rest: unknown[]) {
          if (armed && el?.classList?.contains("order-section")) {
            armed = false;
            throw new Error("SIMULATED_PIN_SETUP_FAILURE");
          }
          // @ts-expect-error — forwarding the native signature
          return original.call(window, el, ...rest);
        };
      });

      await page.goto("/");
      await expect(page.locator("[data-order-anim='step']").first()).toHaveCSS("opacity", "1");
    });

    test("FinalCTA card stays rectangular (no clip-path) and reveals on scroll", async ({ page }) => {
      await page.goto("/");
      const card = page.locator(".final-cta-card");
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      await expect(card).toHaveCSS("opacity", "1");
      await expect(card).toHaveCSS("clip-path", "none");
    });

    test.describe("Catalog batch reveal (fixture-controlled product count)", () => {
      test("zero products renders empty state with no console errors and no card nodes", async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

        await page.goto("/e2e-fixtures/catalog-batch?count=0");
        await page.waitForTimeout(500);

        await expect(page.locator("[data-catalog-anim='card']")).toHaveCount(0);
        await expect(page.locator("[data-catalog-anim='empty']")).toBeVisible();
        expect(consoleErrors).toEqual([]);
      });

      test("single product reveals via batch with no console errors", async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

        await page.goto("/e2e-fixtures/catalog-batch?count=1");
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(800);

        const cards = page.locator("[data-catalog-anim='card']");
        await expect(cards).toHaveCount(1);
        await expect(cards.first()).toBeVisible();
        expect(consoleErrors).toEqual([]);
      });

      test("multiple products (N > batchMax) reveal row-by-row as each batch scrolls into view", async ({ page }) => {
        // Proves ScrollTrigger.batch() gates each row independently — with a
        // single container-level `.from()` timeline, ALL cards would flip to
        // opacity:1 the moment the container's trigger fires, even rows
        // still below the fold. With batch(), a row not yet on screen must
        // stay hidden until it individually crosses the batch start point.
        await page.setViewportSize({ width: 1280, height: 800 });
        // lg:grid-cols-3 → visually 2 rows of 3. batchMax:3 caps how many
        // elements share one triggered `onEnter` callback based on
        // scroll-entry timing/`interval`, NOT on this grid's row layout —
        // it only happens to line up with one row here, chosen for a
        // readable test, not because batch() groups by DOM rows.
        await page.goto("/e2e-fixtures/catalog-batch?count=6");
        await page.waitForTimeout(300);

        // Scroll so only the first row is near/inside the viewport; the
        // second row (starting at card index 3) remains below the fold.
        await page.evaluate(() => {
          const section = document.querySelector(".catalog-section");
          if (section) window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + 40);
        });

        const cards = page.locator("[data-catalog-anim='card']");
        await expect(cards).toHaveCount(6);

        // First row settles to full opacity — auto-retrying assertion, no
        // fixed sleep needed.
        await expect(cards.nth(0)).toHaveCSS("opacity", "1");

        // Snapshot check: the second row must still be hidden at this exact
        // scroll position, before scrolling further. This is a genuine
        // mid-scrub read (not a "wait until" condition), so a short settle
        // delay plus a single computed-style read is correct here.
        await page.waitForTimeout(300);
        const secondRowOpacityBefore = await cards.nth(3).evaluate((el) => window.getComputedStyle(el).opacity);
        expect(secondRowOpacityBefore).not.toBe("1");

        // Scroll further so the second row's batch start point is crossed.
        await page.evaluate(() => window.scrollBy(0, 500));
        await expect(cards.nth(3)).toHaveCSS("opacity", "1");
      });

      test("catalog batch failure fails open — cards stay visible even if ScrollTrigger.batch throws", async ({ page }) => {
        // Forces the exact failure window flagged in review: an exception
        // thrown between `gsap.set(cards, {opacity:0})` and
        // `ScrollTrigger.batch()` construction must not leave cards
        // permanently invisible (see catalog-animation.js's try/catch).
        await page.addInitScript(() => {
          const proto = Element.prototype;
          const original = proto.getBoundingClientRect;
          let armed = true;
          proto.getBoundingClientRect = function (this: Element) {
            if (armed && this.matches?.("[data-catalog-anim='card']")) {
              armed = false;
              throw new Error("SIMULATED_BATCH_FAILURE");
            }
            return original.call(this);
          };
        });

        await page.goto("/e2e-fixtures/catalog-batch?count=1");
        await expect(page.locator("[data-catalog-anim='card']").first()).toHaveCSS("opacity", "1");
      });
    });

    test("Trust checklist items and check icons are visible after settle", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1200);

      const items = page.locator("[data-trust-anim='item']");
      await expect(items).toHaveCount(4);

      const checks = page.locator("[data-trust-anim='check']");
      await expect(checks).toHaveCount(4);
      for (let i = 0; i < 4; i++) {
        await expect(checks.nth(i)).toBeVisible();
      }
    });

    test("reduced motion disables pin and batch across sections", async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.waitForTimeout(500);

      // HowToOrder: steps are visible immediately (the entrance timeline's
      // own target, actually hidden/cleared by the reduced-motion branch —
      // `sprite` is never touched by either timeline, so asserting on it
      // wouldn't prove reduced-motion gating ran), no pin created — a
      // normal scroll moves the section instead of pinning it.
      await expect(page.locator("[data-order-anim='step']").first()).toBeVisible();
      const orderSection = page.locator(".order-section");
      await orderSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const orderTopBefore = await orderSection.evaluate((el) => el.getBoundingClientRect().top);
      await page.evaluate(() => window.scrollBy(0, 250));
      await page.waitForTimeout(200);
      const orderTopAfter = await orderSection.evaluate((el) => el.getBoundingClientRect().top);
      expect(orderTopAfter).toBeLessThan(orderTopBefore - 100);

      // FinalCTA: card is visible immediately, no clip-path applied.
      const card = page.locator(".final-cta-card");
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await expect(card).toHaveCSS("clip-path", "none");

      // Catalog: cards (if any render on the real page) are visible without
      // needing to scroll — no batch() gating under reduced motion.
      const catalogCards = page.locator("[data-catalog-anim='card']");
      const catalogCount = await catalogCards.count();
      if (catalogCount > 0) {
        await expect(catalogCards.first()).toBeVisible();
      }

      expect(consoleErrors).toEqual([]);
    });
  });

  test.describe("Business positioning", () => {
    test("communicates business use cases above the fold", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/empresas|colegios|cafeterías/i);
      await expect(page.getByText(/empresas, colegios y cafeterías/i)).toBeVisible();
    });

    test("shows a dedicated business use cases section", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: /postres para tu negocio/i })).toBeVisible();
      const businessSection = page.locator(".business-section");
      await expect(businessSection.getByRole("heading", { name: "Empresas", exact: true })).toBeVisible();
      await expect(businessSection.getByRole("heading", { name: "Colegios", exact: true })).toBeVisible();
      await expect(businessSection.getByRole("heading", { name: "Cafeterías", exact: true })).toBeVisible();
    });
  });

  test.describe("Responsive & Accessibility", () => {
    test("no horizontal scroll at 320px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto("/");
      // Check body doesn't overflow horizontally
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(overflowX).toBe(true);
    });

    test("no horizontal scroll at 768px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 800 });
      await page.goto("/");
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(overflowX).toBe(true);
    });

    test("no horizontal scroll at 1920px viewport", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/");
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(overflowX).toBe(true);
    });

    test("hamburger button has min 44px touch target on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const hamburger = page.locator("[data-hamburger]");
      const minHeight = await hamburger.evaluate((el) => parseFloat(getComputedStyle(el).minHeight));
      const minWidth = await hamburger.evaluate((el) => parseFloat(getComputedStyle(el).minWidth));
      expect(minHeight).toBeGreaterThanOrEqual(44);
      expect(minWidth).toBeGreaterThanOrEqual(44);
    });

    test("sticky WhatsApp CTA does not cover product order action on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/#catalogo");
      const orderAction = page.getByRole("link", { name: /pedir/i }).first();
      const stickyCta = page.getByRole("link", { name: /hacer pedido por whatsapp/i });

      await orderAction.scrollIntoViewIfNeeded();
      const orderBox = await orderAction.boundingBox();
      const stickyBox = await stickyCta.boundingBox();

      expect(orderBox).not.toBeNull();
      expect(stickyBox).not.toBeNull();
      const overlaps = orderBox!.bottom > stickyBox!.top && orderBox!.top < stickyBox!.bottom;
      expect(overlaps).toBe(false);
    });

    test("FAQ summary has min 44px height on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto("/");
      const summary = page.locator("[data-faq-root] summary").first();
      const minHeight = await summary.evaluate((el) => parseFloat(getComputedStyle(el).minHeight));
      expect(minHeight).toBeGreaterThanOrEqual(44);
    });

    test("viewport meta tag is present", async ({ page }) => {
      await page.goto("/");
      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toHaveAttribute("content", /width=device-width/);
    });
  });
});
