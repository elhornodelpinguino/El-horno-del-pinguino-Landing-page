/**
 * Counter animation that counts up from 0 to a target value.
 * Triggered by IntersectionObserver at 50% threshold.
 * Uses requestAnimationFrame with ease-out easing.
 * Formats numbers in Ecuadorian Spanish locale (dot separator).
 * Respects prefers-reduced-motion.
 * Never re-animates after `is-animated` class is set.
 *
 * Pure functions exported for unit testing.
 */

/** Ease-out curve: 1 - (1 - t)^3 */
export function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

/** Format number in es-EC locale (dot separator for thousands) */
export function formatCounter(value) {
  return new Intl.NumberFormat("es-EC").format(value);
}

(function () {
  if (typeof window === "undefined") return;

  const COUNTER_SELECTOR = "[data-target]";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const skipAnimation = motionQuery.matches;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = /** @type {HTMLElement} */ (entry.target);
        if (el.classList.contains("is-animated")) return;

        const target = parseInt(el.getAttribute("data-target") ?? "0", 10);
        if (isNaN(target) || target <= 0) return;

        if (skipAnimation) {
          el.textContent = formatCounter(target);
          el.classList.add("is-animated");
          observer.unobserve(el);
          return;
        }

        const duration = 1500;
        const startTime = performance.now();

        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOut(progress);
          const current = Math.round(eased * target);

          el.textContent = formatCounter(current);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            el.textContent = formatCounter(target);
            el.classList.add("is-animated");
            observer.unobserve(el);
          }
        }

        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  function observe() {
    document.querySelectorAll(COUNTER_SELECTOR).forEach((el) => {
      observer.observe(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe);
  } else {
    observe();
  }
})();
