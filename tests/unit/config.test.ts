import { describe, it, expect } from "vitest";
import { whatsappLink } from "../../src/lib/config";

describe("whatsappLink", () => {
  it("encodes a simple text message", () => {
    const url = whatsappLink("Hola! Quiero info.");
    expect(url).toMatch(/^https:\/\/wa\.me\/[\w]+\?text=/);
    expect(url).toContain(encodeURIComponent("Hola! Quiero info."));
  });

  it("encodes special characters", () => {
    const url = whatsappLink("¿Tienen pastel de chocolate? $10");
    expect(url).toContain(encodeURIComponent("¿"));
    expect(url).toContain(encodeURIComponent("$"));
  });

  it("handles empty message gracefully", () => {
    const url = whatsappLink("");
    expect(url).toMatch(/^https:\/\/wa\.me\/[\w]+\?text=$/);
  });
});
