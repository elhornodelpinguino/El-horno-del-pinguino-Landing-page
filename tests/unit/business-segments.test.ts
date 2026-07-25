import { describe, it, expect } from "vitest";
import {
  BUSINESS_SEGMENTS,
  segmentWhatsappLink,
  type SegmentSlug,
} from "../../src/lib/business-segments";

// Ecuadorian tuteo only — reject Rioplatense voseo forms (spec: Ecuadorian
// Tuteo Copy Only).
const VOSEO_PATTERN = /contás|querés|tenés|podés|hacé|escribinos|\bvos\b/i;

// No price, currency amount, or numeric unit cost anywhere (spec: No Price
// Figures). Currency can lead as well as trail the amount: matching only the
// trailing form let "Desde USD 25 por unidad" pass a mutation check of the
// rendered page, so both orders are covered.
const PRICE_PATTERN =
  /\$\s?\d|\b\d+([.,]\d+)?\s?(usd|dólares|dolares|ctv\.?|centavos|\$)\b|\b(usd|dólares|dolares)\s?\d/i;

// Each segment's own WhatsApp message must reference that segment by name
// (spec: Per-Segment WhatsApp CTA).
const SEGMENT_NAME_REFERENCE: Record<SegmentSlug, string> = {
  cafeterias: "cafetería",
  colegios: "colegio",
  clubes: "club",
  empresas: "empresa",
};

const PITCH_ORDER: SegmentSlug[] = ["cafeterias", "colegios", "clubes", "empresas"];

function allCopyStrings(): string[] {
  return BUSINESS_SEGMENTS.flatMap((segment) => [
    segment.title,
    segment.lead,
    ...segment.bullets,
    segment.ctaLabel,
    segment.whatsappMessage,
  ]);
}

describe("BUSINESS_SEGMENTS", () => {
  it("contains exactly 4 segments with unique slugs, in pitch order", () => {
    expect(BUSINESS_SEGMENTS).toHaveLength(4);

    const slugs = BUSINESS_SEGMENTS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(4);
    expect(slugs).toEqual(PITCH_ORDER);
  });

  it("has non-empty title/lead and at least 2 bullets for every segment", () => {
    for (const segment of BUSINESS_SEGMENTS) {
      expect(segment.title.trim().length).toBeGreaterThan(0);
      expect(segment.lead.trim().length).toBeGreaterThan(0);
      expect(segment.bullets.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("allows clubes to be valid without a media asset (no placeholder implied)", () => {
    const clubes = BUSINESS_SEGMENTS.find((s) => s.slug === "clubes");
    expect(clubes).toBeDefined();
    expect(clubes?.media).toBeUndefined();
    expect(clubes?.title.trim().length).toBeGreaterThan(0);
    expect(clubes?.bullets.length).toBeGreaterThanOrEqual(2);
  });

  it("gives every other segment a media asset", () => {
    const withMedia = BUSINESS_SEGMENTS.filter((s) => s.slug !== "clubes");
    for (const segment of withMedia) {
      expect(segment.media).toBeDefined();
      expect(segment.media?.src.length).toBeGreaterThan(0);
      expect(segment.media?.alt.length).toBeGreaterThan(0);
    }
  });

  it("produces a valid wa.me link naming the segment for every entry", () => {
    for (const segment of BUSINESS_SEGMENTS) {
      const url = segmentWhatsappLink(segment);
      expect(url).toMatch(/^https:\/\/wa\.me\//);

      const [, encoded] = url.split("?text=");
      const decoded = decodeURIComponent(encoded ?? "");
      expect(decoded).toContain(SEGMENT_NAME_REFERENCE[segment.slug]);
    }
  });

  it("never uses Rioplatense voseo in any copy string", () => {
    for (const copy of allCopyStrings()) {
      expect(copy).not.toMatch(VOSEO_PATTERN);
    }
  });

  it("never mentions a price figure, currency, or numeric unit cost", () => {
    for (const copy of allCopyStrings()) {
      expect(copy).not.toMatch(PRICE_PATTERN);
    }
  });
});
