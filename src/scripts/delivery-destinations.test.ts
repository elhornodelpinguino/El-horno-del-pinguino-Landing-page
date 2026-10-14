import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect } from "vitest";

import { DESTINATIONS, buildingMarkup, fractionNear } from "./delivery-destinations.js";

const publicDir = path.resolve(__dirname, "../../public");

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): [number, number] {
  const bytes = readFileSync(file);
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

describe("delivery destinations", () => {
  it("names the four places the penguin delivers to", () => {
    expect(DESTINATIONS.map((d) => d.slug)).toEqual(["casa", "club", "escuela", "oficina"]);
    expect(DESTINATIONS.map((d) => d.chip)).toEqual([
      "¡Entregado en casa!",
      "¡Entregado en el club!",
      "¡Entregado en la escuela!",
      "¡Entregado en la oficina!",
    ]);
  });

  it("ships an asleep and an awake 96px sprite per building", () => {
    for (const destination of DESTINATIONS) {
      expect(destination.src).toBe(`/destinations/${destination.slug}.png`);
      expect(destination.litSrc).toBe(`/destinations/${destination.slug}-lit.png`);

      const asleep = path.join(publicDir, destination.src);
      const awake = path.join(publicDir, destination.litSrc);
      expect(pngSize(asleep), destination.slug).toEqual([96, 96]);
      expect(pngSize(awake), destination.slug).toEqual([96, 96]);
      expect(readFileSync(asleep).equals(readFileSync(awake)), destination.slug).toBe(false);
    }
  });

  it("renders both states as decorative pixel-art images", () => {
    const markup = buildingMarkup(DESTINATIONS[0]);

    expect(markup.match(/<img /g)).toHaveLength(2);
    expect(markup).toMatch(/class="dest-building dest-asleep" src="\/destinations\/casa\.png" alt=""/);
    expect(markup).toMatch(/class="dest-building dest-awake" src="\/destinations\/casa-lit\.png" alt=""/);
    expect(markup).toMatch(/width="96" height="96"/);
  });

  it("finds where along a path a point lies", () => {
    // A straight 100px line from (0, 50) to (100, 50).
    const line = {
      getTotalLength: () => 100,
      getPointAtLength: (at: number) => ({ x: at, y: 50 }),
    };

    expect(fractionNear(line, { x: 25, y: 50 })).toBeCloseTo(0.25, 2);
    expect(fractionNear(line, { x: 75, y: 0 })).toBeCloseTo(0.75, 2);
  });
});
