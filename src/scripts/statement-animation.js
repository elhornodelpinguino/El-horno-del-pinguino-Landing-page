import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Wraps each word of a line in an inline-block span so the timeline can
 * stagger the reveal per word. Runs only when motion is allowed, so
 * reduced-motion visitors keep the untouched server-rendered text.
 */
function splitWords(line) {
  const words = (line.textContent ?? "").trim().split(/\s+/);
  line.textContent = "";
  return words.map((word, i) => {
    const span = document.createElement("span");
    span.className = "statement-word";
    span.textContent = word;
    line.appendChild(span);
    if (i < words.length - 1) line.appendChild(document.createTextNode(" "));
    return span;
  });
}

const section = document.querySelector(".statement-section");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const eyebrow = section.querySelector("[data-statement-anim='eyebrow']");
  const lines = section.querySelectorAll("[data-statement-anim='line']");
  const squares = section.querySelectorAll("[data-statement-anim='square']");
  const tags = section.querySelectorAll("[data-statement-anim='tag']");

  const entranceTargets = [eyebrow, ...lines, ...squares, ...tags].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 78%" },
    });

    const wordsPerLine = [...lines].map((line) => splitWords(line));

    if (eyebrow) tl.from(eyebrow, { y: 14, opacity: 0, duration: 0.5 });

    wordsPerLine.forEach((words, i) => {
      tl.from(
        words,
        { y: 26, opacity: 0, duration: 0.6, stagger: 0.08 },
        i === 0 ? "-=0.25" : "-=0.35"
      );
    });

    if (squares.length) {
      tl.from(
        squares,
        { scale: 0, duration: 0.4, stagger: 0.06, ease: "back.out(2.2)" },
        "-=0.2"
      );
    }

    if (tags.length) {
      tl.from(tags, { y: 16, opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.15");
    }

    // Scrub-linked color sweep on the second line ("Presentación que
    // vende."): words tint cream -> orange as the band crosses the
    // viewport. Color only, so it composes with the entrance tween
    // (y/opacity) without conflict.
    const secondLineWords = wordsPerLine[1];
    if (secondLineWords?.length) {
      gsap.fromTo(
        secondLineWords,
        { color: "#fbebde" },
        {
          color: "#f49d50",
          stagger: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 30%",
            scrub: true,
          },
        }
      );
    }
  }
}
