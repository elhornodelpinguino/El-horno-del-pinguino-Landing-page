import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Motion for /negocios.
 *
 * Two tiers, deliberately:
 *  - The hero runs one entrance timeline on load. Above-the-fold content is
 *    never wrapped in a ScrollTrigger (project convention).
 *  - Everything below the fold reveals on scroll, staggered per section, so
 *    the page has a rhythm as the reader moves through it rather than a
 *    single animated header followed by a static document.
 *
 * Every tween is a `.from()`, so the DOM's natural state IS the visible state.
 * If GSAP fails to load or a trigger never fires, content stays readable
 * instead of stranding at opacity 0 — this page gets shown on mobile data
 * while the owner stands next to the reader.
 */
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const reduced = motionQuery.matches;

/** Every element a scroll reveal has hidden, so the safety net can find them. */
const revealed = [];

/** Reveal a group of elements when their section scrolls into view. */
function revealOnScroll(trigger, targets, options = {}) {
  const items = targets.filter(Boolean);
  if (!items.length) return;

  if (reduced) {
    gsap.set(items, { clearProps: "all" });
    return;
  }

  try {
    gsap.from(items, {
      y: options.y ?? 24,
      opacity: 0,
      duration: options.duration ?? 0.7,
      ease: "power3.out",
      stagger: options.stagger ?? 0.12,
      scrollTrigger: {
        trigger,
        start: options.start ?? "top 80%",
        once: true,
      },
      ...(options.extra ?? {}),
    });
    revealed.push(...items);
  } catch {
    // A scroll reveal that cannot be built must not take the content with it.
    gsap.set(items, { clearProps: "all" });
  }
}

/**
 * Safety net. A `.from()` tween keeps the DOM's natural state as the end
 * state, so a total GSAP failure leaves the page readable. But once GSAP HAS
 * loaded, ScrollTrigger immediately hides these elements and only a firing
 * trigger brings them back — so a trigger that never fires (bad refresh, a
 * layout shift from a late-loading image, a browser quirk) would strand
 * content invisible. This page gets shown on mobile data while the owner
 * stands next to the reader; unreadable is a worse failure than unanimated.
 */
function releaseStrandedReveals() {
  for (let i = revealed.length - 1; i >= 0; i -= 1) {
    const el = revealed[i];
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    // Only elements that are ON SCREEN and still invisible are stranded.
    // Anything still below the fold is correctly hidden, waiting its turn.
    if (inView && parseFloat(window.getComputedStyle(el).opacity) < 0.05) {
      gsap.set(el, { clearProps: "all" });
      revealed.splice(i, 1);
    }
  }
}

if (!reduced) {
  let sweepQueued = false;
  const queueSweep = () => {
    if (sweepQueued) return;
    sweepQueued = true;
    window.setTimeout(() => {
      sweepQueued = false;
      releaseStrandedReveals();
    }, 1200);
  };

  window.addEventListener("load", () => {
    // Re-measure once images have settled — a late image resizing the page is
    // the most likely reason a trigger would miss its start position.
    if (typeof ScrollTrigger.refresh === "function") ScrollTrigger.refresh();
    queueSweep();
  });
  window.addEventListener("scroll", queueSweep, { passive: true });
}

/* ---- Hero: one entrance timeline on load ---- */
const shell = document.querySelector(".negocios-hero");
if (shell) {
  const eyebrow = shell.querySelector("[data-negocios-anim='eyebrow']");
  const heading = shell.querySelector("[data-negocios-anim='heading']");
  const rule = shell.querySelector("[data-negocios-anim='rule']");
  const lead = shell.querySelector("[data-negocios-anim='lead']");
  const cta = shell.querySelector("[data-negocios-anim='cta']");

  const entranceTargets = [eyebrow, heading, rule, lead, cta].filter(Boolean);

  if (reduced) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.65 } });

    tl.from(eyebrow, { y: 12, opacity: 0, duration: 0.5 })
      .from(heading, { y: 28, opacity: 0, duration: 0.8 }, "-=0.3")
      .from(rule, { scaleX: 0, transformOrigin: "center center" }, "-=0.45")
      .from(lead, { y: 16, opacity: 0, duration: 0.6 }, "-=0.35")
      .from(cta, { y: 14, opacity: 0, scale: 0.96, duration: 0.55 }, "-=0.3");
  }
}

/* ---- Proof band: the numerals rise and settle, the labels follow ---- */
const statBand = document.querySelector("[data-stat='proof']");
if (statBand) {
  revealOnScroll(statBand, Array.from(statBand.querySelectorAll("[data-negocios-anim='stat']")), {
    y: 32,
    duration: 0.8,
    stagger: 0.14,
    start: "top 85%",
  });
}

/* ---- How we work: the four steps arrive in their real order ---- */
const steps = Array.from(document.querySelectorAll("[data-negocios-anim='step']"));
if (steps.length) {
  revealOnScroll(steps[0].closest("section"), steps, { y: 20, stagger: 0.1 });
}

/* ---- Ledger: each segment row reveals as it is reached ---- */
const rows = Array.from(document.querySelectorAll("[data-negocios-segment]"));
rows.forEach((row) => {
  revealOnScroll(row, [row], { y: 22, duration: 0.65, stagger: 0, start: "top 88%" });
});

/* ---- Product list on the deep band ---- */
const productList = document.querySelector(".negocios-product-list");
if (productList) {
  revealOnScroll(
    productList,
    [...productList.querySelectorAll(".negocios-product-item"), productList.querySelector(".negocios-flavours")],
    { y: 18, stagger: 0.1 },
  );
}

/* ---- Closing CTA ---- */
const closing = document.querySelector(".negocios-closing");
if (closing) {
  revealOnScroll(closing, Array.from(closing.querySelectorAll("[data-negocios-anim='closing']")), {
    y: 20,
    stagger: 0.12,
  });
}
