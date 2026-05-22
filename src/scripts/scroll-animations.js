/**
 * Scroll-triggered reveal animations.
 * Reveals standalone sections and staggered children inside `.animate-group`.
 * Respects `prefers-reduced-motion`.
 */
(function () {
  if (typeof window === "undefined") return;

  const TARGET_SELECTOR = ".animate-on-scroll:not(.is-visible), .animate-item:not(.is-visible)";
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reveal(el) {
    if (el.classList.contains("animate-item")) {
      const parent = el.closest(".animate-group");
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll(".animate-item"));
        const idx = siblings.indexOf(el);
        el.style.setProperty("--i", String(Math.min(idx, 5)));
      }
    }

    el.classList.add("is-visible");

    if (el.classList.contains("animate-on-scroll")) {
      el.querySelectorAll(".animate-item:not(.is-visible)").forEach(reveal);
    }
  }

  if (motionQuery.matches) {
    document.querySelectorAll(TARGET_SELECTOR).forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = /** @type {HTMLElement} */ (entry.target);
        reveal(el);
        observer.unobserve(el);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  function observe() {
    document.querySelectorAll(TARGET_SELECTOR).forEach((el) => {
      observer.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe);
  } else {
    observe();
  }
})();
