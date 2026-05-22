/**
 * FAQ accordion with arrow-key navigation between <summary> elements.
 * Uses native <details>/<summary> elements.
 * Adds smooth max-height animation and rotating chevron indicator.
 */
(function () {
  if (typeof window === "undefined") return;

  const ROOT_SELECTOR = "[data-faq-root]";

  /** @returns {HTMLDetailsElement[]} */
  function getAllDetails() {
    const root = document.querySelector(ROOT_SELECTOR);
    if (!root) return [];
    return Array.from(root.querySelectorAll("details"));
  }

  /** @returns {HTMLElement[]} */
  function getAllSummaries() {
    const root = document.querySelector(ROOT_SELECTOR);
    if (!root) return [];
    return Array.from(root.querySelectorAll("summary"));
  }

  /** Smooth open/close via max-height animation */
  function animateDetails(details, open) {
    const content = details.querySelector(".faq-content");
    if (!content) return;

    if (open) {
      details.setAttribute("open", "");
      // Wait for the browser to render the open state
      requestAnimationFrame(() => {
        content.style.maxHeight = content.scrollHeight + "px";
      });
    } else {
      content.style.maxHeight = "0px";
      content.addEventListener(
        "transitionend",
        () => {
          if (!details.hasAttribute("open")) {
            details.removeAttribute("open");
          }
        },
        { once: true }
      );
    }
  }

  /** Toggle a specific details element */
  function toggleDetails(details) {
    const isNowOpen = !details.hasAttribute("open");

    // Exclusive open — close all others
    getAllDetails().forEach((other) => {
      if (other !== details && other.hasAttribute("open")) {
        animateDetails(other, false);
      }
    });

    if (isNowOpen) {
      animateDetails(details, true);
    } else {
      animateDetails(details, false);
    }
  }

  function init() {
    const summaries = getAllSummaries();
    if (summaries.length === 0) return;

    summaries.forEach((summary) => {
      const details = summary.closest("details");
      if (!details) return;

      // Override default toggle — use our smooth version
      summary.addEventListener("click", (e) => {
        e.preventDefault();
        toggleDetails(details);
      });

      // Enter/Space activate
      summary.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDetails(details);
        }
      });
    });

    // Arrow Up/Down navigation between summaries
    document.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      const summaries = getAllSummaries();
      if (summaries.length === 0) return;

      const currentIdx = summaries.indexOf(
        /** @type {HTMLElement} */ (document.activeElement)
      );
      if (currentIdx === -1) return;

      e.preventDefault();

      let nextIdx;
      if (e.key === "ArrowDown") {
        nextIdx = (currentIdx + 1) % summaries.length;
      } else {
        nextIdx = (currentIdx - 1 + summaries.length) % summaries.length;
      }

      summaries[nextIdx].focus();
    });

    // Initialize all closed — set max-height to 0
    getAllDetails().forEach((details) => {
      const content = details.querySelector(".faq-content");
      if (content && !details.hasAttribute("open")) {
        content.style.maxHeight = "0px";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
