import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "~/lib/json-ld";

// U+2028 / U+2029 are built via fromCharCode so this test file never contains
// the raw line-separator bytes (which break source parsers).
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

describe("serializeJsonLd", () => {
  it("serializes a plain object as valid JSON", () => {
    const out = serializeJsonLd({ "@type": "Organization", name: "Horno del Pingüino" });
    expect(JSON.parse(out)).toEqual({ "@type": "Organization", name: "Horno del Pingüino" });
  });

  it("neutralizes a script break-out in a string value", () => {
    // The classic stored-XSS vector: a product name that closes the JSON-LD
    // script block and opens an executable one. The output must not contain a
    // literal closing script tag.
    const payload = "Torta</" + "script><" + "script>alert(document.cookie)</" + "script>";
    const out = serializeJsonLd({ name: payload });

    expect(out.toLowerCase()).not.toContain("</script");
    expect(out).not.toContain("<");
    // The data survives intact once parsed back — escaping is transparent.
    expect(JSON.parse(out).name).toBe(payload);
  });

  it("escapes every angle bracket, not only the ones before 'script'", () => {
    const out = serializeJsonLd({ description: "Pastel <b>grande</b> & rico" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(JSON.parse(out).description).toBe("Pastel <b>grande</b> & rico");
  });

  it("escapes the U+2028 and U+2029 line separators", () => {
    const out = serializeJsonLd({ note: "line" + LS + "sep" + PS + "here" });
    expect(out).not.toContain(LS);
    expect(out).not.toContain(PS);
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(JSON.parse(out).note).toBe("line" + LS + "sep" + PS + "here");
  });

  it("escapes ampersands so entities can't be reinterpreted", () => {
    const out = serializeJsonLd({ name: "A & W" });
    expect(out).not.toContain("&");
    expect(JSON.parse(out).name).toBe("A & W");
  });

  it("handles nested product offers from the backend", () => {
    const out = serializeJsonLd({
      offers: [{ "@type": "Offer", name: "X</" + "script>", description: "<img src=x>" }],
    });
    expect(out.toLowerCase()).not.toContain("</script");
    expect(out).not.toContain("<");
    const parsed = JSON.parse(out);
    expect(parsed.offers[0].name).toBe("X</" + "script>");
    expect(parsed.offers[0].description).toBe("<img src=x>");
  });
});
