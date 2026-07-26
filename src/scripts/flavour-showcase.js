export const normalizeIndex = (index, length) => {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
};

export const getCoverflowPosition = (cardIndex, currentIndex, length) => {
  const relative = normalizeIndex(cardIndex - currentIndex, length);
  return relative === 0 ? "active" : relative === 1 ? "next" : "previous";
};

export const moveIndex = (currentIndex, delta, length) => normalizeIndex(currentIndex + delta, length);

const root = typeof document === "undefined" ? null : document.querySelector("[data-flavour-showcase]");

if (root) {
  const gallery = root.querySelector("#flavour-gallery");
  const cards = [...root.querySelectorAll("[data-flavour-card]")];
  const controls = root.querySelector("[data-flavour-controls]");
  const previous = root.querySelector("[data-flavour-prev]");
  const next = root.querySelector("[data-flavour-next]");
  const status = root.querySelector("[data-flavour-status]");

  if (gallery && cards.length > 0 && controls && previous && next && status) {
    let currentIndex = 0;
    let pointerStart = null;
    let suppressClick = false;

    controls.removeAttribute("hidden");

    const applyPosition = (index, { focus = false } = {}) => {
      currentIndex = normalizeIndex(index, cards.length);

      cards.forEach((card, cardIndex) => {
        const position = getCoverflowPosition(cardIndex, currentIndex, cards.length);
        card.dataset.coverflowPosition = position;
        card.tabIndex = position === "active" ? 0 : -1;

        if (position === "active") {
          card.setAttribute("aria-current", "true");
        } else {
          card.removeAttribute("aria-current");
        }
      });

      const title = cards[currentIndex].querySelector("h3")?.textContent?.trim() ?? "Sabor";
      status.textContent = `Sabor ${currentIndex + 1} de ${cards.length}: ${title}. En el centro.`;
      previous.disabled = cards.length < 2;
      next.disabled = cards.length < 2;
      root.dataset.currentFlavour = String(currentIndex);

      if (focus) cards[currentIndex].focus({ preventScroll: true });
    };

    const move = (delta, options) => applyPosition(moveIndex(currentIndex, delta, cards.length), options);

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    cards.forEach((card, index) => {
      card.addEventListener("click", (event) => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        if (event.target instanceof Element && event.target.closest("a")) return;
        applyPosition(index, { focus: true });
      });

      card.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1, { focus: true });
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1, { focus: true });
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          applyPosition(index, { focus: true });
        }
      });
    });

    gallery.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerStart = { id: event.pointerId, x: event.clientX };
      if (event.pointerType !== "mouse") gallery.setPointerCapture?.(event.pointerId);
    });

    gallery.addEventListener("pointerup", (event) => {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      const distance = event.clientX - pointerStart.x;
      pointerStart = null;

      if (Math.abs(distance) < 48) return;
      suppressClick = true;
      move(distance < 0 ? 1 : -1, { focus: true });
    });

    gallery.addEventListener("pointercancel", () => {
      pointerStart = null;
    });

    cards.forEach((card) => {
      card.addEventListener("dragstart", (event) => event.preventDefault());
    });

    applyPosition(0);
  }
}
