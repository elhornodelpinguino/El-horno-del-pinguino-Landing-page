import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const track = document.querySelector("[data-marquee-track]");
if (track) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (motionQuery.matches) {
    // Static band under reduced motion — the first run stays readable.
    gsap.set(track, { clearProps: "all" });
  } else {
    // The track holds two identical runs, so shifting -50% lands exactly on
    // the start of the duplicate — a seamless infinite wrap.
    const loop = gsap.to(track, {
      xPercent: -50,
      duration: 20,
      ease: "none",
      repeat: -1,
    });

    // Velocity-reactive speed: fast scrolling nudges the loop's timeScale
    // up (capped at 2.5x), then it decays back to normal.
    let speedTween;
    ScrollTrigger.create({
      onUpdate(self) {
        const boost = Math.min(Math.abs(self.getVelocity()) / 1200, 1.5);
        if (boost < 0.05) return;
        speedTween?.kill();
        speedTween = gsap
          .timeline()
          .to(loop, { timeScale: 1 + boost, duration: 0.2, ease: "power1.out" })
          .to(loop, { timeScale: 1, duration: 1, ease: "power1.inOut" }, ">0.1");
      },
    });
  }
}
