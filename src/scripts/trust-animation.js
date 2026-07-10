import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".trust-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const eyebrow = section.querySelector("[data-trust-anim='eyebrow']");
  const heading = section.querySelector("[data-trust-anim='heading']");
  const receipt = section.querySelector("[data-trust-anim='receipt']");
  const cards = section.querySelectorAll("[data-trust-anim='card']");
  const items = section.querySelectorAll("[data-trust-anim='item']");
  const checks = section.querySelectorAll("[data-trust-anim='check']");

  const entranceTargets = [eyebrow, heading, receipt, ...cards, ...items, ...checks].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (eyebrow) tl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });
    if (heading) tl.from(heading, { y: 24, opacity: 0 }, "-=0.35");
    if (receipt) tl.from(receipt, { y: 20, opacity: 0, duration: 0.6 }, "-=0.4");
    if (cards.length) tl.from(cards, { y: 24, opacity: 0, duration: 0.55, stagger: 0.1 }, "-=0.3");
    if (items.length) tl.from(items, { x: -12, opacity: 0, stagger: 0.08 }, "-=0.3");
    if (checks.length) {
      tl.from(
        checks,
        { scale: 0, rotate: -45, opacity: 0, stagger: 0.1, ease: "back.out(2)" },
        "-=0.3"
      );
    }
  }
}
