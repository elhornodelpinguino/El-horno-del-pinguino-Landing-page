import { describe, expect, it } from "vitest";
import {
  BUSINESS_GALLERY,
  BUSINESS_PRODUCTS,
  BUSINESS_STEP_EVIDENCE,
} from "../../src/lib/business-media";

describe("B2B visual media", () => {
  it("defines a static four-image editorial gallery with honest labels", () => {
    expect(BUSINESS_GALLERY).toHaveLength(4);
    expect(BUSINESS_GALLERY.map((item) => item.caption)).toEqual([
      "Pedidos por volumen",
      "Presentación individual",
      "Detalles personalizados",
      "Listos para entregar",
    ]);

    for (const item of BUSINESS_GALLERY) {
      expect(item.src).toMatch(/^\/b2b-[a-z-]+\.webp$/);
      expect(item.srcset).toContain(" 720w");
      expect(item.srcset).toContain(" 1200w");
      expect(item.alt).not.toMatch(/cliente|empresa|colegio|club|entrega realizada/i);
      expect(item.width).toBeGreaterThan(0);
      expect(item.height).toBeGreaterThan(0);
    }
  });

  it("keeps the product section to the two approved formats", () => {
    expect(BUSINESS_PRODUCTS.map((item) => item.title)).toEqual([
      "Cheesecake",
      "Minidonas",
    ]);

    expect(BUSINESS_PRODUCTS[0]).toMatchObject({
      src: "/b2b-product-cheesecake.webp",
      alt: "Cheesecake individual con frutos rojos en un envase transparente.",
    });
    expect(BUSINESS_PRODUCTS[0].title).not.toMatch(/minitorta/i);

    for (const item of BUSINESS_PRODUCTS) {
      expect(item.src).toMatch(/^\/b2b-[a-z-]+\.webp$/);
      expect(item.alt.trim()).not.toBe("");
      expect(item.copy.trim()).not.toBe("");
    }
  });

  it("defines honest, consistently cropped evidence for all four process steps", () => {
    expect(BUSINESS_STEP_EVIDENCE.map((item) => item.step)).toEqual([1, 2, 3, 4]);
    expect(new Set(BUSINESS_STEP_EVIDENCE.map((item) => item.step)).size).toBe(4);

    for (const item of BUSINESS_STEP_EVIDENCE) {
      expect(item.src).toMatch(/^\/b2b-(gallery|step)-[a-z-]+\.webp$/);
      expect(item.srcset).toContain(" 720w");
      expect(item.srcset).toContain(" 1200w");
      expect(item.width).toBe(1200);
      expect(item.height).toBe(900);
      expect(item.alt).not.toMatch(/conversación|acuerdo|fecha|entrega realizada/i);
      expect(item.label.trim()).not.toBe("");
    }
  });
});
