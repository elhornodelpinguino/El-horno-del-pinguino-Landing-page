import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".order-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const eyebrow = section.querySelector("[data-order-anim='eyebrow']");
  const heading = section.querySelector("[data-order-anim='heading']");
  const steps = section.querySelectorAll("[data-order-anim='step']");
  const cta = section.querySelector("[data-order-anim='cta']");
  const bubble1 = section.querySelector("[data-order-anim='bubble1']");
  const bubble2 = section.querySelector("[data-order-anim='bubble2']");

  const entranceTargets = [eyebrow, heading, ...steps, cta].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } });

    if (eyebrow) tl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });
    if (heading) tl.from(heading, { y: 24, opacity: 0 }, "-=0.35");
    if (steps.length) tl.from(steps, { y: 36, opacity: 0, duration: 0.7, stagger: 0.18 }, "-=0.3");
    if (cta) tl.from(cta, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.25");

    if (bubble1) {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        animation: gsap.to(bubble1, { yPercent: -12, ease: "none" }),
      });
    }
    if (bubble2) {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        animation: gsap.to(bubble2, { yPercent: 10, ease: "none" }),
      });
    }
  }
}
