import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".order-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopQuery = window.matchMedia("(min-width: 768px)");

  const eyebrow = section.querySelector("[data-order-anim='eyebrow']");
  const heading = section.querySelector("[data-order-anim='heading']");
  const steps = section.querySelectorAll("[data-order-anim='step']");
  const cta = section.querySelector("[data-order-anim='cta']");

  const entranceTargets = [eyebrow, heading, ...steps, cta].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else if (!desktopQuery.matches) {
    // Mobile/tablet: keep the Fase-1 entrance stagger — a pinned scrub would
    // trap scroll for an unreasonable distance on short viewports.
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (eyebrow) tl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });
    if (heading) tl.from(heading, { y: 24, opacity: 0 }, "-=0.35");
    if (steps.length) tl.from(steps, { y: 36, opacity: 0, duration: 0.7, stagger: 0.18 }, "-=0.3");
    if (cta) tl.from(cta, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.25");
  } else {
    // Desktop: entrance for eyebrow/heading/cta, then a pinned, scrubbed,
    // snapped timeline advances the 3 step cards one at a time.
    const introTl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (eyebrow) introTl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });
    if (heading) introTl.from(heading, { y: 24, opacity: 0 }, "-=0.35");
    if (cta) introTl.from(cta, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.25");

    if (steps.length) {
      // Inactive look — set via GSAP only. Wrapped in try/catch: if
      // anything throws while wiring the pinned/scrubbed timeline below
      // (after the steps are already dimmed to 40% opacity), catch restores
      // full visibility via `clearProps` instead of leaving every step
      // stuck dimmed indefinitely.
      try {
        gsap.set(steps, { opacity: 0.4, scale: 0.96 });

        const stepTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=150%",
            scrub: true,
            pin: true,
            anticipatePin: 1,
            snap: { snapTo: "labelsDirectional", duration: 0.25 },
          },
        });

        stepTl.addLabel("step0").to(steps[0], { opacity: 1, scale: 1, duration: 0.3 }, "step0");

        if (steps[1]) {
          stepTl
            .addLabel("step1")
            .to(steps[0], { opacity: 0.4, scale: 0.96, duration: 0.3 }, "step1")
            .to(steps[1], { opacity: 1, scale: 1, duration: 0.3 }, "step1");
        }

        if (steps[2]) {
          stepTl
            .addLabel("step2")
            .to(steps[1], { opacity: 0.4, scale: 0.96, duration: 0.3 }, "step2")
            .to(steps[2], { opacity: 1, scale: 1, duration: 0.3 }, "step2");
        }
      } catch {
        gsap.set(steps, { clearProps: "all" });
      }
    }
  }
}
