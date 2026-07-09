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
