import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ORDER_CHOICES, buildOrderMessage } from "./order-sentence.js";

// --- DOM wiring -----------------------------------------------------------

/** Sizes a native select to its chosen option, not its widest one. */
function fitSelect(select, probe) {
  probe.textContent = select.options[select.selectedIndex]?.text ?? "";
  select.style.width = `${Math.ceil(probe.getBoundingClientRect().width) + 1}px`;
}

function initOrderClose(section) {
  const form = section.querySelector("[data-order-form]");
  const link = section.querySelector("[data-order-link]");
  const penguin = section.querySelector("[data-order-penguin]");
  const photoImg = section.querySelector("[data-order-photo-img]");
  if (!form || !link) return;

  const siteName = form.dataset.siteName ?? "";
  const phone = link.dataset.phone ?? "";
  const selects = [...form.querySelectorAll("select[data-blank]")];

  // One hidden probe per select, sharing its font, to measure the chosen text.
  const probes = new Map(
    selects.map((select) => {
      const probe = document.createElement("span");
      probe.className = "order-blank-probe";
      probe.setAttribute("aria-hidden", "true");
      select.after(probe);
      return [select, probe];
    }),
  );

  const current = () => Object.fromEntries(selects.map((select) => [select.dataset.blank, select.value]));

  const sync = () => {
    const message = buildOrderMessage(siteName, current());
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    for (const select of selects) fitSelect(select, probes.get(select));
  };

  // Keep the photo in step with "what": fade, swap once the new image has
  // decoded, fade back. Only real photography from ORDER_CHOICES is used.
  const showPhoto = (value) => {
    const photo = ORDER_CHOICES.what.find((option) => option.value === value)?.photo;
    if (!photoImg || !photo || photoImg.getAttribute("src") === photo.src) return;
    const next = new Image();
    next.src = photo.src;
    photoImg.classList.add("is-swapping");
    next.decode().catch(() => {}).finally(() => {
      photoImg.src = photo.src;
      photoImg.alt = photo.alt;
      photoImg.width = photo.width;
      photoImg.height = photo.height;
      photoImg.style.objectPosition = photo.position;
      photoImg.classList.remove("is-swapping");
    });
  };

  let nodTimer = 0;
  form.addEventListener("change", (event) => {
    sync();
    const select = event.target;
    if (select.dataset.blank === "what") showPhoto(select.value);
    select.classList.remove("is-swapped");
    void select.offsetWidth;
    select.classList.add("is-swapped");
    if (penguin) {
      penguin.classList.remove("is-noting");
      void penguin.offsetWidth;
      penguin.classList.add("is-noting");
      clearTimeout(nodTimer);
      nodTimer = window.setTimeout(() => penguin.classList.remove("is-noting"), 1400);
    }
  });

  // Fonts change the measured width once they load.
  sync();
  document.fonts?.ready.then(sync);
  window.addEventListener("resize", sync);

  // Entrance: the heading lands, then the three blanks fill in one by one, as
  // if the penguin were writing them down. Everything is visible by default;
  // GSAP animates from offset states only when motion is allowed.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);
  const heading = section.querySelector("[data-finalcta-anim='heading']");
  const sentence = section.querySelector("[data-order-sentence]");
  const actions = section.querySelector("[data-finalcta-anim='actions']");
  const photo = section.querySelector("[data-order-photo]");

  const tl = gsap.timeline({
    defaults: { ease: "expo.out", duration: 0.9 },
    scrollTrigger: { trigger: section, start: "top 75%", once: true },
  });
  if (photo) tl.from(photo, { clipPath: "inset(0 0 0 100%)", duration: 1.2, ease: "expo.inOut" }, 0);
  if (heading) tl.from(heading, { y: 40, opacity: 0 }, 0.15);
  if (sentence) tl.from(sentence, { y: 24, opacity: 0 }, 0.3);
  tl.from(selects, { opacity: 0, filter: "blur(6px)", y: 8, stagger: 0.28, duration: 0.6 }, 0.6);
  if (penguin) tl.from(penguin, { y: 60, rotate: -8, opacity: 0, ease: "back.out(1.6)" }, 0.5);
  if (actions) tl.from(actions, { y: 20, opacity: 0 }, 1.3);
}

// Guarded so unit tests can import the pure helpers without a DOM.
if (typeof document !== "undefined") {
  const section = document.querySelector("[data-order-close]");
  if (section) initOrderClose(section);
}
