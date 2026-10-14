// Marks the header link of the section the visitor is reading.
//
// A section becomes current once its top crosses a reading line about a third
// down the viewport, and stays current until the next one crosses it. The last
// section (the footer) is too short to ever reach that line, so the bottom of
// the page forces it.

/**
 * @param {{ id: string, top: number }[]} sections in page order, `top` relative to the viewport
 * @param {number} line reading line, in px from the viewport top
 * @param {boolean} atBottom whether the page is scrolled to its end
 * @returns {string | null} id of the current section, or null above the first one
 */
export function activeSection(sections, line, atBottom) {
  if (sections.length === 0) return null;
  if (atBottom) return sections[sections.length - 1].id;
  let current = null;
  for (const section of sections) {
    if (section.top <= line) current = section.id;
  }
  return current;
}

export function initScrollspy(root = document) {
  const links = [...root.querySelectorAll("[data-nav-section]")];
  const ids = [...new Set(links.map((link) => link.dataset.navSection))];
  const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
  if (targets.length === 0) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    const line = window.innerHeight * 0.35;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const current = activeSection(
      targets.map((el) => ({ id: el.id, top: el.getBoundingClientRect().top })),
      line,
      atBottom,
    );
    for (const link of links) {
      if (link.dataset.navSection === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}
