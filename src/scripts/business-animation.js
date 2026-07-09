import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".business-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const eyebrow = section.querySelector("[data-business-anim='eyebrow']");
  const heading = section.querySelector("[data-business-anim='heading']");
  const copy = section.querySelector("[data-business-anim='copy']");
  const cards = section.querySelectorAll("[data-business-anim='card']");

  const entranceTargets = [eyebrow, heading, copy, ...cards].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (eyebrow) tl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });
    if (heading) tl.from(heading, { y: 24, opacity: 0 }, "-=0.35");
    if (copy) tl.from(copy, { y: 18, opacity: 0, duration: 0.6 }, "-=0.4");
    if (cards.length) tl.from(cards, { y: 32, opacity: 0, duration: 0.7, stagger: 0.15, ease: "back.out(1.4)" }, "-=0.3");
  }
}
