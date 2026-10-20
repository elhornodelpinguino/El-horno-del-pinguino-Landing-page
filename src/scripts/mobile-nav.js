/**
 * Mobile navigation hamburger toggle
 * Toggles `data-menu-open` attribute on the nav element.
 * Implements focus trap, Escape to close, and dynamic aria attributes.
 * Runs only at viewport < 768px.
 */

/**
 * Single place that knows what "open" and "closed" mean for the panel.
 * The closed panel is only transparent (opacity 0), so without `inert` its
 * links stay focusable and readable by assistive tech while invisible.
 * @param {{ inert: boolean, setAttribute(name: string, value: string): void }} nav
 * @param {{ setAttribute(name: string, value: string): void }} btn
 * @param {boolean} open
 */
export function applyMenuState(nav, btn, open) {
  nav.inert = !open;
  nav.setAttribute("data-menu-open", String(open));
  btn.setAttribute("aria-expanded", String(open));
  btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}

(function () {
  if (typeof window === "undefined") return;

  const HAMBURGER_SELECTOR = "[data-hamburger]";
  const NAV_SELECTOR = "[data-mobile-nav]";

  /** @returns {HTMLElement | null} */
  function getButton() {
    return document.querySelector(HAMBURGER_SELECTOR);
  }

  /** @returns {HTMLElement | null} */
  function getNav() {
    return document.querySelector(NAV_SELECTOR);
  }

  /** @returns {HTMLElement[]} */
  function getFocusable(el) {
    if (!el) return [];
    return Array.from(
      el.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function isOpen() {
    const nav = getNav();
    return nav ? nav.getAttribute("data-menu-open") === "true" : false;
  }

  function open() {
    const btn = getButton();
    const nav = getNav();
    if (!btn || !nav) return;

    applyMenuState(nav, btn, true);
  }

  function close({ restoreFocus = true } = {}) {
    const btn = getButton();
    const nav = getNav();
    if (!btn || !nav) return;

    applyMenuState(nav, btn, false);
    if (restoreFocus) btn.focus();
  }

  function toggle() {
    if (isOpen()) {
      close();
    } else {
      open();
    }
  }

  /** Focus trap handler */
  function onKeydown(e) {
    if (!isOpen()) return;

    // Escape closes
    if (e.key === "Escape") {
      close();
      return;
    }

    // Tab — trap focus inside the nav
    if (e.key === "Tab") {
      const nav = getNav();
      if (!nav) return;
      const focusable = getFocusable(nav);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function init() {
    const btn = getButton();
    const nav = getNav();
    if (!btn || !nav) return;

    // Initial state
    applyMenuState(nav, btn, false);

    // Toggle on click / Enter / Space
    btn.addEventListener("click", toggle);
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });

    // Close menu after choosing an in-page destination.
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => close({ restoreFocus: false }));
    });

    // Global keyboard trap
    document.addEventListener("keydown", onKeydown);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
