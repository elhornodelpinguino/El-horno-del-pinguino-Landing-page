import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".final-cta");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const label = section.querySelector("[data-finalcta-anim='label']");
  const heading = section.querySelector("[data-finalcta-anim='heading']");
  const copy = section.querySelector("[data-finalcta-anim='copy']");
  const actions = section.querySelector("[data-finalcta-anim='actions']");
  const card = section.querySelector("[data-finalcta-anim='card']");
  const cardSteps = section.querySelectorAll(".final-cta-step");
  const orbLeft = section.querySelector(".final-cta-orb-left");
  const orbRight = section.querySelector(".final-cta-orb-right");

  const entranceTargets = [label, heading, copy, actions, card, ...cardSteps].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 85%" },
    });

    if (label) tl.from(label, { y: 12, opacity: 0, duration: 0.45 });
    if (heading) tl.from(heading, { y: 24, opacity: 0 }, "-=0.3");
    if (copy) tl.from(copy, { y: 18, opacity: 0, duration: 0.6 }, "-=0.4");
    if (actions) tl.from(actions, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.3");
    if (card) tl.from(card, { scale: 0.95, opacity: 0, duration: 0.75, ease: "back.out(1.4)" }, "-=0.4");
    if (cardSteps.length) tl.from(cardSteps, { y: 14, opacity: 0, duration: 0.5, stagger: 0.12 }, "-=0.35");

    if (orbLeft) {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        animation: gsap.to(orbLeft, { yPercent: -8, ease: "none" }),
      });
    }
    if (orbRight) {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        animation: gsap.to(orbRight, { yPercent: 6, ease: "none" }),
      });
    }
  }
}
