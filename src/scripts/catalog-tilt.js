import { gsap } from "gsap";

const MAX_TILT = 4;
const HOVER_LIFT = -4;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointerQuery = window.matchMedia("(pointer: fine)");

// Subtle 3D tilt on product cards — desktop pointer only. When active,
// GSAP owns the whole card transform (tilt + hover lift); the `.js-tilt`
// class removes the CSS transform transition/hover so the two systems
// never fight over the same property.
if (!motionQuery.matches && pointerQuery.matches) {
  document.querySelectorAll(".product-card").forEach((card) => {
    card.classList.add("js-tilt");
    gsap.set(card, { transformPerspective: 800 });

    const rotXTo = gsap.quickTo(card, "rotationX", { duration: 0.4, ease: "power2.out" });
    const rotYTo = gsap.quickTo(card, "rotationY", { duration: 0.4, ease: "power2.out" });
    const liftTo = gsap.quickTo(card, "y", { duration: 0.3, ease: "power2.out" });

    card.addEventListener("pointerenter", () => liftTo(HOVER_LIFT));

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      rotXTo(-ny * MAX_TILT * 2);
      rotYTo(nx * MAX_TILT * 2);
    });

    card.addEventListener("pointerleave", () => {
      rotXTo(0);
      rotYTo(0);
      liftTo(0);
    });
  });
}
