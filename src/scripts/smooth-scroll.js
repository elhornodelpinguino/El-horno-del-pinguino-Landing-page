import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

// Reduced motion: skip Lenis entirely — native scrolling (and the CSS
// scroll-behavior fallback) stays in charge.
if (!motionQuery.matches) {
  const lenis = new Lenis({
    // Intercept same-page anchor clicks (#catalogo, #contacto,
    // #business-heading, mobile nav) so they glide through Lenis instead
    // of the native jump.
    anchors: true,
  });

  // Keep ScrollTrigger measurements in sync with Lenis' smoothed scroll.
  lenis.on("scroll", ScrollTrigger.update);

  // Drive Lenis from GSAP's ticker (seconds -> ms) and disable lag
  // smoothing so scroll-linked tweens never drift from the scroll position.
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
