import { gsap } from "gsap";

const shell = document.querySelector(".negocios-hero");
if (shell) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const eyebrow = shell.querySelector("[data-negocios-anim='eyebrow']");
  const heading = shell.querySelector("[data-negocios-anim='heading']");
  const rule = shell.querySelector("[data-negocios-anim='rule']");
  const lead = shell.querySelector("[data-negocios-anim='lead']");
  const proof = shell.querySelector("[data-negocios-anim='proof']");
  const cta = shell.querySelector("[data-negocios-anim='cta']");

  const entranceTargets = [eyebrow, heading, rule, lead, proof, cta].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.65 } });

    tl.from(eyebrow, { y: 12, opacity: 0, duration: 0.5 })
      .from(heading, { y: 24, opacity: 0 }, "-=0.3")
      .from(rule, { scaleX: 0, transformOrigin: "left center" }, "-=0.35")
      .from(lead, { y: 16, opacity: 0, duration: 0.6 }, "-=0.35")
      .from(proof, { y: 14, opacity: 0, duration: 0.55 }, "-=0.35")
      .from(cta, { y: 12, opacity: 0, duration: 0.5 }, "-=0.3");
  }
}
