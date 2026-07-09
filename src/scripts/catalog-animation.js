import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".catalog-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const eyebrow = section.querySelector("[data-catalog-anim='eyebrow']");
  const heading = section.querySelector("[data-catalog-anim='heading']");
  const copy = section.querySelector("[data-catalog-anim='copy']");
  const tags = section.querySelectorAll("[data-catalog-anim='tag']");
  const cards = section.querySelectorAll("[data-catalog-anim='card']");
  const empty = section.querySelector("[data-catalog-anim='empty']");
  const orbLeft = section.querySelector(".catalog-orb-left");
  const orbRight = section.querySelector(".catalog-orb-right");

  const entranceTargets = [eyebrow, heading, copy, ...tags, ...cards, empty].filter(Boolean);

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
    if (tags.length) tl.from(tags, { y: 12, opacity: 0, duration: 0.45, stagger: 0.08 }, "-=0.3");

    if (cards.length) {
      tl.from(cards, { y: 28, opacity: 0, duration: 0.65, stagger: 0.12 }, "-=0.25");
    } else if (empty) {
      tl.from(empty, { y: 28, opacity: 0, duration: 0.65 }, "-=0.25");
    }

    if (orbLeft) {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        animation: gsap.to(orbLeft, { yPercent: -10, ease: "none" }),
      });
    }
    if (orbRight) {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        animation: gsap.to(orbRight, { yPercent: 8, ease: "none" }),
      });
    }
  }
}
