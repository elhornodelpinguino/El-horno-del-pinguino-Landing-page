/**
 * Scroll-triggered reveal animations
 * Uses IntersectionObserver to add `.is-visible` class when elements enter viewport.
 * Respects `prefers-reduced-motion`.
 * Stagger support via `--i` custom property on `.animate-item` elements.
 */
(function () {
  if (typeof window === "undefined") return;

  // Respect reduced motion — skip entirely
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.matches) {
    // Show all animated elements immediately
    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      el.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = /** @type {HTMLElement} */ (entry.target);

        // If inside a group, compute stagger index
        if (el.classList.contains("animate-item")) {
          const parent = el.closest(".animate-group");
          if (parent) {
            const siblings = Array.from(parent.querySelectorAll(".animate-item"));
            const idx = siblings.indexOf(el);
            el.style.setProperty("--i", String(Math.min(idx, 5)));
          }
        }

        el.classList.add("is-visible");
        observer.unobserve(el);
      });
    },
    { threshold: 0.2 }
  );

  // Observe on DOMContentLoaded and after Astro page transitions
  function observe() {
    document.querySelectorAll(".animate-on-scroll:not(.is-visible)").forEach((el) => {
      observer.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe);
  } else {
    observe();
  }
})();
