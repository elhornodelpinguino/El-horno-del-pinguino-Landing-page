import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { DESTINATIONS, buildingMarkup, fractionNear } from "./delivery-destinations.js";

gsap.registerPlugin(ScrollTrigger);

const LAP_SECONDS = { loop: 16, line: 9 };

// The track is drawn in real pixels from the band's current size, so the
// runner always has headroom: its feet sit on the line and the top segment
// stays low enough that the whole penguin fits inside the band.
//
// Destinations always sit on straight stretches (never a corner), so each
// building stands upright on the line. They are returned as points; where
// they fall along the path is measured afterwards with `fractionNear`, so a
// building and its delivery moment can never drift apart.
function trackFor(kind, width, height, runnerHeight) {
  if (kind === "line") {
    // High enough that the "¡Entregado!" chip under each building clears the
    // band's bottom edge.
    const y = height - 76;
    return {
      d: `M${width - 48} ${y} H48 H${width - 48}`,
      stops: [0.2, 0.5, 0.8].map((at) => ({ x: width * at, y })),
    };
  }
  const inset = 64;
  const radius = 90;
  const top = Math.round(runnerHeight * 0.82 + 28);
  const bottom = height - 48;
  const left = inset;
  const right = width - inset;
  const mid = width / 2;
  const d = [
    `M${mid} ${bottom}`,
    `H${left + radius}`,
    `Q${left} ${bottom} ${left} ${bottom - radius}`,
    `V${top + radius}`,
    `Q${left} ${top} ${left + radius} ${top}`,
    `H${right - radius}`,
    `Q${right} ${top} ${right} ${top + radius}`,
    `V${bottom - radius}`,
    `Q${right} ${bottom} ${right - radius} ${bottom}`,
    "Z",
  ].join(" ");
  return {
    d,
    stops: [
      { x: width * 0.25, y: bottom },
      { x: width * 0.3, y: top },
      { x: width * 0.7, y: top },
      { x: width * 0.75, y: bottom },
    ],
  };
}

const section = document.querySelector(".final-cta");
if (section) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const penguin = section.querySelector("[data-finalcta-anim='penguin']");
  const label = section.querySelector("[data-finalcta-anim='label']");
  const heading = section.querySelector("[data-finalcta-anim='heading']");
  const copy = section.querySelector("[data-finalcta-anim='copy']");
  const actions = section.querySelector("[data-finalcta-anim='actions']");

  const entranceTargets = [penguin, label, heading, copy, actions].filter(Boolean);

  if (motionQuery.matches) {
    gsap.set(entranceTargets, { clearProps: "all" });
  } else {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.7 },
      scrollTrigger: { trigger: section, start: "top 85%" },
    });

    if (penguin) tl.from(penguin, { y: 48, scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(1.8)" });
    if (label) tl.from(label, { y: 12, opacity: 0, duration: 0.45 }, "-=0.35");
    if (heading) tl.from(heading, { y: 24, opacity: 0 }, "-=0.3");
    if (copy) tl.from(copy, { y: 18, opacity: 0, duration: 0.6 }, "-=0.4");
    if (actions) tl.from(actions, { y: 16, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, "-=0.3");

    startDeliveryRoute(section);
  }
}

function startDeliveryRoute(root) {
  const route = root.querySelector("[data-delivery-route]");
  const runner = root.querySelector("[data-delivery-runner]");
  const body = root.querySelector("[data-delivery-runner-body]");
  if (!route || !runner || !body) return;

  const wideQuery = window.matchMedia("(min-width: 900px)");
  let lap = null;
  let markers = [];

  const build = () => {
    lap?.kill();
    markers.forEach((marker) => marker.remove());
    markers = [];

    const kind = wideQuery.matches ? "loop" : "line";
    const svg = route.querySelector("[data-route-svg]");
    const path = route.querySelector("[data-route-path]");
    if (!svg || !path) return;

    const width = route.clientWidth;
    const height = route.clientHeight;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const track = trackFor(kind, width, height, runner.offsetHeight);
    path.setAttribute("d", track.d);

    const length = path.getTotalLength();

    // Order the stops by when the runner reaches them, then hand out the
    // destinations in that order: casa, club, escuela, oficina.
    const stops = track.stops
      .map((point) => ({ point, fraction: fractionNear(path, point) }))
      .sort((a, b) => a.fraction - b.fraction)
      .map((stop, index) => ({ ...stop, destination: DESTINATIONS[index % DESTINATIONS.length] }));

    markers = stops.map(({ point, destination }) => {
      const marker = document.createElement("span");
      marker.className = `delivery-stop delivery-stop--${destination.slug}`;
      marker.style.left = `${point.x}px`;
      marker.style.top = `${point.y}px`;
      marker.innerHTML = buildingMarkup(destination);
      const chip = document.createElement("span");
      chip.className = "delivery-stop-chip";
      chip.textContent = destination.chip;
      marker.append(chip);
      route.append(marker);
      return marker;
    });

    let lastX = null;
    const place = (progress) => {
      const { x, y } = path.getPointAtLength(progress * length);
      if (lastX !== null && Math.abs(x - lastX) > 0.5) {
        // The art faces right; mirror it whenever the runner heads left.
        gsap.set(body, { scaleX: x < lastX ? -1 : 1 });
      }
      lastX = x;
      gsap.set(runner, { x: x - runner.offsetWidth / 2, y: y - runner.offsetHeight * 0.82 });
    };

    const state = { progress: 0 };
    lap = gsap.timeline({ repeat: -1, paused: true });
    lap.to(state, {
      progress: 1,
      duration: LAP_SECONDS[kind],
      ease: "none",
      onUpdate: () => place(state.progress),
    }, 0);

    stops.forEach(({ fraction }, index) => {
      lap.add(() => deliver(markers[index]), fraction * LAP_SECONDS[kind]);
    });

    place(0);
    if (ScrollTrigger.isInViewport(root)) lap.play();
  };

  // A delivery: the building hops, its windows light up, and the chip names
  // the place. Lights stay on for the rest of the lap and reset with it.
  const deliver = (marker) => {
    if (!marker) return;
    const building = marker.querySelectorAll(".dest-building");
    const chip = marker.querySelector(".delivery-stop-chip");
    if (marker === markers[0]) markers.forEach((m) => m.classList.remove("is-lit"));
    marker.classList.add("is-lit");
    gsap
      .timeline()
      .fromTo(building, { y: 0 }, { keyframes: [{ y: -10, duration: 0.15, ease: "power2.out" }, { y: 0, duration: 0.35, ease: "bounce.out" }] })
      .to(chip, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2.2)" }, 0)
      .to(chip, { opacity: 0, y: 10, duration: 0.3, ease: "power2.in" }, 1.1);
  };

  root.classList.add("is-delivering");
  build();

  // Only run while the band is on screen; an off-screen loop is wasted CPU.
  ScrollTrigger.create({
    trigger: root,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? lap?.play() : lap?.pause()),
  });

  wideQuery.addEventListener("change", build);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
}
