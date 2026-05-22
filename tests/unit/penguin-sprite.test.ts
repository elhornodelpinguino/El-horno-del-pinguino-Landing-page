import { describe, it, expect } from "vitest";
import { FRAMES, PALETTE, compositeSprite, FRAME_SIZE, TOTAL_FRAMES } from "../../scripts/generate-penguin-sprite.js";

describe("penguin sprite sheet", () => {
  it("has exactly 4 frames", () => {
    expect(FRAMES).toHaveLength(TOTAL_FRAMES);
  });

  it("each frame is 64 rows of 64 characters", () => {
    for (const frame of FRAMES) {
      expect(frame).toHaveLength(FRAME_SIZE);
      for (const row of frame) {
        expect(row).toHaveLength(FRAME_SIZE);
      }
    }
  });

  it("all pixel codes are in the palette definition", () => {
    const validCodes = new Set(Object.keys(PALETTE));
    validCodes.add("."); // transparent is implicit
    for (const frame of FRAMES) {
      for (const row of frame) {
        for (const pixel of row) {
          expect(validCodes.has(pixel)).toBe(true);
        }
      }
    }
  });

  it("composite sprite is 256×64 RGBA pixels", () => {
    const { data, width, height } = compositeSprite(FRAMES);
    expect(width).toBe(FRAME_SIZE * TOTAL_FRAMES);
    expect(height).toBe(FRAME_SIZE);
    expect(data.byteLength).toBe(width * height * 4); // RGBA
  });

  it("first frame has non-transparent pixels (penguin is drawn)", () => {
    const { data } = compositeSprite(FRAMES);
    const rgba = new Uint8ClampedArray(data);
    // Check at center of first frame (32, 32) — should have visible pixels
    const centerIdx = (32 * 256 + 32) * 4;
    // The center should have magenta (apron) or cream (belly) — non-zero alpha
    expect(rgba[centerIdx + 3]).toBeGreaterThan(0);
  });

  it("frames differ from each other (animation has motion)", () => {
    // Compare frames by checking total pixel differences
    const frameBufs = FRAMES.map((f) => compositeSprite([f]));
    const diff1 = countPixelDiff(frameBufs[0].data, frameBufs[1].data);
    const diff2 = countPixelDiff(frameBufs[1].data, frameBufs[2].data);
    // At least one frame transition should have visible differences (motion)
    expect(diff1 + diff2).toBeGreaterThan(0);
  });
});

/** Counts number of RGBA pixel positions that differ between two buffers */
function countPixelDiff(buf1: ArrayBuffer, buf2: ArrayBuffer): number {
  const a = new Uint8ClampedArray(buf1);
  const b = new Uint8ClampedArray(buf2);
  let diff = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) {
      diff++;
    }
  }
  return diff;
}
