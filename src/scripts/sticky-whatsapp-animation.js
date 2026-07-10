import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const btn = document.querySelector(".sticky-whatsapp");
if (btn) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (motionQuery.matches) {
    gsap.set(btn, { clearProps: "all" });
  } else {
    const shell = document.querySelector(".hero-shell");

    if (shell) {
      ScrollTrigger.create({
        trigger: shell,
        start: "bottom top",
        toggleActions: "play none none reverse",
        animation: gsap.fromTo(
          btn,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }
        ),
      });
    }
  }
}
