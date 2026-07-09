import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const shell = document.querySelector(".hero-shell");
if (shell) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const nav = shell.querySelector("nav");
  const eyebrow = shell.querySelector("[data-hero-anim='eyebrow']");
  const heading = shell.querySelector("[data-hero-anim='heading']");
  const copy = shell.querySelector("[data-hero-anim='copy']");
  const actions = shell.querySelector("[data-hero-anim='actions']");
  const badges = shell.querySelectorAll("[data-hero-anim='badge']");
  const card = shell.querySelector(".hero-card");
  const tickets = shell.querySelectorAll(".order-ticket");

  const entranceTargets = [nav, eyebrow, heading, copy, actions, card, ...badges, ...tickets].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } });

    tl.from(nav, { y: -16, opacity: 0 })
      .from(eyebrow, { y: 14, opacity: 0, duration: 0.5 }, "-=0.35")
      .from(heading, { y: 28, opacity: 0 }, "-=0.3")
      .from(copy, { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
      .from(actions, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.3")
      .from(badges, { y: 12, opacity: 0, duration: 0.45, stagger: 0.1 }, "-=0.25")
      .from(
        card,
        { scale: 0.9, opacity: 0, duration: 0.8, ease: "back.out(1.4)" },
        "-=0.5"
      )
      .from(
        tickets,
        { y: 20, opacity: 0, duration: 0.5, stagger: 0.15, ease: "back.out(1.7)" },
        "-=0.35"
      );

    if (card) {
      ScrollTrigger.create({
        trigger: shell,
        start: "top top",
        end: "bottom top",
        scrub: true,
        animation: gsap.to(card, { yPercent: 12, ease: "none" }),
      });
    }
  }
}
