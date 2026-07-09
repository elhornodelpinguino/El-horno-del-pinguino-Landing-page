import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".faq-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const intro = section.querySelector("[data-faq-anim='intro']");
  const items = section.querySelectorAll("[data-faq-anim='item']");

  const entranceTargets = [intro, ...items].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (intro) tl.from(intro, { y: 24, opacity: 0, duration: 0.6 });
    if (items.length) tl.from(items, { y: 20, opacity: 0, duration: 0.55, stagger: 0.1 }, "-=0.3");
  }
}
