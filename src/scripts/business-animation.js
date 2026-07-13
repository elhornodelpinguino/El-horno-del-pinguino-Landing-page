import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".business-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const heading = section.querySelector("[data-business-anim='heading']");
  const copy = section.querySelector("[data-business-anim='copy']");
  const cards = section.querySelectorAll("[data-business-anim='card']");

  const entranceTargets = [heading, copy, ...cards].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (heading) tl.from(heading, { y: 24, opacity: 0 });
    if (copy) tl.from(copy, { y: 18, opacity: 0, duration: 0.6 }, "-=0.4");

    if (cards.length) {
      // Outer cards cascade in with a slight rotation; the inverted middle
      // card lands last with more energy.
      const middle = cards[1];
      const outer = [...cards].filter((card) => card !== middle);

      tl.from(
        outer,
        { y: 34, rotation: -2, opacity: 0, duration: 0.7, stagger: 0.15, ease: "back.out(1.4)" },
        "-=0.3"
      );

      if (middle) {
        tl.from(
          middle,
          { y: 48, rotation: 3, scale: 0.92, opacity: 0, duration: 0.8, ease: "back.out(1.9)" },
          "-=0.35"
        );
      }
    }
  }
}
