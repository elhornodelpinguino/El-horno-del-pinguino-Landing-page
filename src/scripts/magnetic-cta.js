import { gsap } from "gsap";

const MAX_OFFSET = 6;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointerQuery = window.matchMedia("(pointer: fine)");

// Magnetic pull is desktop-pointer-only sugar — skip on touch and under
// reduced motion so buttons stay perfectly static.
if (!motionQuery.matches && pointerQuery.matches) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    let xTo;
    let yTo;

    el.addEventListener("pointerenter", () => {
      // Recreate the quickTo setters on every enter: the elastic return on
      // leave overwrites (kills) the previous internal tweens.
      xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    });

    el.addEventListener("pointermove", (event) => {
      if (!xTo || !yTo) return;
      const rect = el.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      xTo(nx * MAX_OFFSET * 2);
      yTo(ny * MAX_OFFSET * 2);
    });

    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)", overwrite: true });
    });
  });
}
