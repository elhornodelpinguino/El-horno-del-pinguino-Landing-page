import { existsSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import { ORDER_CHOICES, buildOrderMessage, choiceLabel } from "./order-sentence.js";

describe("buildOrderMessage", () => {
  it("writes the sentence the visitor composed, in the site's tú voice", () => {
    expect(buildOrderMessage("El Horno del Pingüino", { what: "minitortas", who: "4", when: "asap" })).toBe(
      "¡Hola, El Horno del Pingüino! Se me antojó: quiero minitortas para 4, lo antes posible. ¿Qué sabores tienen y cuánto sería?",
    );
  });

  it("covers every option of every blank", () => {
    for (const what of ORDER_CHOICES.what) {
      for (const who of ORDER_CHOICES.who) {
        for (const when of ORDER_CHOICES.when) {
          const message = buildOrderMessage("X", { what: what.value, who: who.value, when: when.value });
          expect(message).toContain(what.message);
          expect(message).toContain(who.message);
          expect(message).toContain(when.message);
        }
      }
    }
  });

  it("falls back to the first option for unknown values instead of writing 'undefined'", () => {
    const message = buildOrderMessage("X", { what: "pizza", who: "", when: undefined });
    expect(message).not.toContain("undefined");
    expect(message).toBe(buildOrderMessage("X", {}));
    expect(message).toContain(ORDER_CHOICES.what[0].message);
  });
});

describe("order photos", () => {
  it("gives every 'what' choice a real photo from public/ with alt text", () => {
    for (const option of ORDER_CHOICES.what) {
      expect(option.photo, option.value).toBeDefined();
      expect(existsSync(path.resolve(__dirname, "../../public", option.photo.src.slice(1))), option.photo.src).toBe(true);
      expect(option.photo.alt.length).toBeGreaterThan(10);
    }
  });

  it("shows donuts when the visitor asks for minidonas", () => {
    const donuts = ORDER_CHOICES.what.find((option) => option.value === "minidonas");
    expect(donuts?.photo.src).toBe("/b2b-gallery-individual.webp");
  });
});

describe("choiceLabel", () => {
  it("returns the visible label of a choice", () => {
    expect(choiceLabel("who", "1")).toBe("solo para mí");
    expect(choiceLabel("when", "weekend")).toBe("para el fin de semana");
  });
});
