import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector("#contacto");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const columns = section.querySelectorAll("[data-contact-anim='column']");
  const bar = section.querySelector("[data-contact-anim='bar']");

  const entranceTargets = [...columns, bar].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top bottom" },
    });

    if (columns.length) tl.from(columns, { y: 24, opacity: 0, duration: 0.6, stagger: 0.12 });
    if (bar) tl.from(bar, { y: 14, opacity: 0, duration: 0.5 }, "-=0.3");
  }
}
