import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector(".trust-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const penguin = section.querySelector("[data-trust-anim='penguin']");
  const stats = section.querySelectorAll("[data-trust-anim='stat']");
  const counters = section.querySelectorAll("[data-trust-count]");

  const entranceTargets = [penguin, ...stats].filter(Boolean);

  if (motionQuery.matches) {
    // Static band — the server-rendered final values stay untouched.
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    if (penguin) tl.from(penguin, { y: 20, opacity: 0, duration: 0.6 });
    if (stats.length) tl.from(stats, { y: 24, opacity: 0, duration: 0.6, stagger: 0.12 }, "-=0.35");

    // Count each number up from 0 to its server-rendered value. `.from()`
    // tweens textContent starting at 0 and snaps to whole numbers, so the
    // markup keeps the real value if this script never runs.
    counters.forEach((counter) => {
      tl.from(
        counter,
        { textContent: 0, duration: 1.4, ease: "power1.out", snap: { textContent: 1 } },
        "<"
      );
    });
  }
}
