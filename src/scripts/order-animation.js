import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".order-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopQuery = window.matchMedia("(min-width: 768px)");

  const eyebrow = section.querySelector("[data-order-anim='eyebrow']");
  const heading = section.querySelector("[data-order-anim='heading']");
  const steps = [...section.querySelectorAll("[data-order-anim='step']")];
  const sprites = [...section.querySelectorAll("[data-order-anim='sprite']")];
  const route = section.querySelector("[data-order-anim='route']");
  const stops = [...section.querySelectorAll("[data-order-anim='stop']")];
  const cta = section.querySelector("[data-order-anim='cta']");

  const entranceTargets = [eyebrow, heading, ...steps, ...sprites, route, ...stops, cta].filter(Boolean);

  // The step a card is in when it is not the current one: still readable, just
  // set back. Earlier versions dimmed to 40%, which read as disabled.
  const RESTING = { opacity: 0.7, scale: 0.95, y: 0, borderColor: "rgba(168, 20, 82, 0.08)" };
  const ACTIVE = { opacity: 1, scale: 1.04, y: -14, borderColor: "rgba(168, 20, 82, 0.45)" };

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
    if (route) gsap.set(route, { scaleX: 1 });
  } else if (!desktopQuery.matches) {
    // Mobile/tablet: an entrance stagger with each penguin popping in — a
    // pinned scrub would trap scroll for too long on short viewports.
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (eyebrow) tl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });
    if (heading) tl.from(heading, { y: 24, opacity: 0 }, "-=0.35");
    if (cta) tl.from(cta, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.25");

    steps.forEach((step, index) => {
      gsap
        .timeline({ scrollTrigger: { trigger: step, start: "top 82%" } })
        .from(step, { y: 36, opacity: 0, duration: 0.6, ease: "power3.out" })
        .from(sprites[index], { y: 30, scale: 0.6, opacity: 0, duration: 0.6, ease: "back.out(2)" }, "-=0.3");
    });
  } else {
    // Desktop: entrance for eyebrow/heading/cta, then a pinned, scrubbed,
    // snapped timeline walks the delivery route: the orange line fills toward
    // each stop, that step's card lifts and its penguin hops.
    const introTl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (eyebrow) introTl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });
    if (heading) introTl.from(heading, { y: 24, opacity: 0 }, "-=0.35");
    if (cta) introTl.from(cta, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.25");

    if (steps.length) {
      // Wrapped in try/catch: the steps are set back before the pinned
      // timeline is wired, so a failure there must restore full visibility
      // via `clearProps` instead of leaving every step stuck set back.
      try {
        gsap.set(steps, RESTING);
        if (route) gsap.set(route, { scaleX: 0 });

        const stepTl = gsap.timeline({
          defaults: { duration: 0.3 },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=150%",
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            snap: { snapTo: "labelsDirectional", duration: 0.3, ease: "power2.inOut" },
          },
        });

        steps.forEach((step, index) => {
          const label = `step${index}`;
          stepTl.addLabel(label);

          if (index > 0) stepTl.to(steps[index - 1], RESTING, label);
          stepTl.to(step, { ...ACTIVE, ease: "back.out(1.6)" }, label);

          if (sprites[index]) {
            stepTl.fromTo(
              sprites[index],
              { y: 0, rotate: 0 },
              { keyframes: [{ y: -26, rotate: -4, duration: 0.14 }, { y: 0, rotate: 0, duration: 0.16, ease: "bounce.out" }] },
              label,
            );
          }

          if (route && steps.length > 1) {
            stepTl.to(route, { scaleX: index / (steps.length - 1), ease: "none" }, label);
          }

          if (stops[index]) {
            stepTl.to(stops[index], { backgroundColor: "#f49d50", scale: 1.25, ease: "back.out(3)" }, label);
          }
        });
      } catch {
        gsap.set([...steps, ...sprites, ...stops], { clearProps: "all" });
        if (route) gsap.set(route, { scaleX: 1 });
      }
    }
  }
}
