import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  parseSiteSettings,
  parsePublicContent,
  resolveFaqs,
  buildSiteUrl,
  buildContentUrl,
  fetchSiteContent,
} from "../../src/lib/site-content";
import { FAQ_FALLBACK } from "../../src/data/faq-fallback";
import { SITE, applySiteSettings, whatsappLink, instagramLink, tiktokLink } from "../../src/lib/config";

const NO_RETRY = { attempts: 1, baseDelayMs: 0 };

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: "",
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

const SITE_BODY = {
  whatsappNumber: "593911111111",
  instagramHandle: "cafe.nuevo",
  tiktokHandle: "cafe_nuevo",
  location: "Cuenca, Ecuador",
  logoUrl: null,
};

const CONTENT_BODY = {
  faqs: [{ id: "f1", question: "¿Abren domingos?", answer: "Sí, hasta las 14h." }],
  banners: [{ id: "b1", title: "Promo", body: "20% de descuento", ctaLabel: "Pedir" }],
};

describe("parseSiteSettings", () => {
  it("uses every valid API value", () => {
    expect(parseSiteSettings(SITE_BODY)).toEqual({
      whatsapp: "593911111111",
      instagram: "cafe.nuevo",
      tiktok: "cafe_nuevo",
      location: "Cuenca, Ecuador",
    });
  });

  it("accepts a leading + on the WhatsApp number and normalises to digits", () => {
    expect(parseSiteSettings({ whatsappNumber: "+593911111111" }).whatsapp).toBe("593911111111");
  });

  it("drops each invalid field individually and keeps the valid ones", () => {
    const out = parseSiteSettings({
      whatsappNumber: "12ab", // not digits
      instagramHandle: "@elhorno", // leading @
      tiktokHandle: "valid_handle",
      location: "   ",
    });
    expect(out).toEqual({ tiktok: "valid_handle" });
  });

  it("rejects WhatsApp numbers outside 8-15 digits", () => {
    expect(parseSiteSettings({ whatsappNumber: "1234567" }).whatsapp).toBeUndefined();
    expect(parseSiteSettings({ whatsappNumber: "1234567890123456" }).whatsapp).toBeUndefined();
    expect(parseSiteSettings({ whatsappNumber: "12345678" }).whatsapp).toBe("12345678");
  });

  it("rejects handles with spaces, slashes or URL-breaking characters", () => {
    for (const bad of ["a b", "a/b", "a?x=1", "a<b>", "", "x".repeat(31)]) {
      expect(parseSiteSettings({ instagramHandle: bad }).instagram).toBeUndefined();
    }
  });

  it("ignores non-string values and non-object payloads", () => {
    expect(parseSiteSettings({ whatsappNumber: 593911111111, location: null })).toEqual({});
    expect(parseSiteSettings(null)).toEqual({});
    expect(parseSiteSettings("nope")).toEqual({});
  });
});

describe("parsePublicContent", () => {
  it("returns valid faqs and banners", () => {
    expect(parsePublicContent(CONTENT_BODY)).toEqual({
      faqs: [{ id: "f1", question: "¿Abren domingos?", answer: "Sí, hasta las 14h." }],
      banners: [{ id: "b1", title: "Promo", body: "20% de descuento", ctaLabel: "Pedir" }],
    });
  });

  it("drops malformed entries but keeps the good ones", () => {
    const out = parsePublicContent({
      faqs: [{ id: "1", question: "", answer: "x" }, { id: "2", question: "q", answer: "a" }, 7, null],
      banners: [{ id: "1", title: "t" }, { id: "2", title: "t", body: "b", ctaLabel: "  " }],
    });
    expect(out.faqs).toEqual([{ id: "2", question: "q", answer: "a" }]);
    expect(out.banners).toEqual([{ id: "2", title: "t", body: "b", ctaLabel: null }]);
  });

  it("treats a missing or non-array list as empty", () => {
    expect(parsePublicContent({})).toEqual({ faqs: [], banners: [] });
    expect(parsePublicContent({ faqs: "x", banners: {} })).toEqual({ faqs: [], banners: [] });
  });

  it("keeps hostile text verbatim as data (escaping is the template's job) without trimming it into markup", () => {
    const out = parsePublicContent({
      faqs: [{ id: "1", question: "<script>alert(1)</script>", answer: "<img src=x onerror=alert(1)>" }],
      banners: [],
    });
    expect(out.faqs[0].question).toBe("<script>alert(1)</script>");
  });
});

describe("resolveFaqs", () => {
  it("returns the API list when it has entries", () => {
    const faqs = parsePublicContent(CONTENT_BODY).faqs;
    expect(resolveFaqs(faqs)).toEqual(faqs);
  });

  it("falls back to today's six hard-coded FAQs when the API list is empty", () => {
    expect(resolveFaqs([])).toEqual(FAQ_FALLBACK);
    expect(FAQ_FALLBACK).toHaveLength(6);
    expect(FAQ_FALLBACK[0].question).toBe("¿Cuánto cuesta una minitorta?");
    expect(FAQ_FALLBACK[0].answer).toContain("Desde $0,99 el cheesecake pequeño");
  });
});

describe("URL builders", () => {
  it("join the host root without double slashes", () => {
    expect(buildSiteUrl("https://x.test/")).toBe("https://x.test/api/public/site");
    expect(buildContentUrl("https://x.test")).toBe("https://x.test/api/public/content");
  });
});

describe("fetchSiteContent", () => {
  const originalFetch = global.fetch;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    global.fetch = originalFetch;
    warn.mockRestore();
  });

  function route(map: Record<string, () => Promise<Response>>) {
    global.fetch = vi.fn((url: string) => {
      const key = Object.keys(map).find((k) => String(url).endsWith(k));
      if (!key) return Promise.reject(new Error(`unexpected ${url}`));
      return map[key]();
    }) as unknown as typeof fetch;
  }

  it("uses the API values when both endpoints answer", async () => {
    route({
      "/api/public/site": async () => jsonResponse(SITE_BODY),
      "/api/public/content": async () => jsonResponse(CONTENT_BODY),
    });
    const out = await fetchSiteContent("https://x.test", NO_RETRY);
    expect(out.site.whatsapp).toBe("593911111111");
    expect(out.content.faqs).toHaveLength(1);
    expect(out.content.banners).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it("a failed /site still lets /content through, and warns", async () => {
    route({
      "/api/public/site": async () => jsonResponse({ error: "boom" }, { ok: false, status: 500 }),
      "/api/public/content": async () => jsonResponse(CONTENT_BODY),
    });
    const out = await fetchSiteContent("https://x.test", NO_RETRY);
    expect(out.site).toEqual({});
    expect(out.content.faqs).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/site/i);
  });

  it("a failed /content still lets /site through, and warns", async () => {
    route({
      "/api/public/site": async () => jsonResponse(SITE_BODY),
      "/api/public/content": async () => {
        throw new Error("network down");
      },
    });
    const out = await fetchSiteContent("https://x.test", NO_RETRY);
    expect(out.site.location).toBe("Cuenca, Ecuador");
    expect(out.content).toEqual({ faqs: [], banners: [] });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/content/i);
  });

  it("never rejects when both endpoints fail", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
    const out = await fetchSiteContent("https://x.test", NO_RETRY);
    expect(out).toEqual({ site: {}, content: { faqs: [], banners: [] } });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("treats a malformed (non-object) body as a failure", async () => {
    route({
      "/api/public/site": async () => jsonResponse("<html>gateway</html>"),
      "/api/public/content": async () => jsonResponse(null),
    });
    const out = await fetchSiteContent("https://x.test", NO_RETRY);
    expect(out).toEqual({ site: {}, content: { faqs: [], banners: [] } });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("warns per field when the API returns an invalid value", async () => {
    route({
      "/api/public/site": async () => jsonResponse({ ...SITE_BODY, whatsappNumber: "abc" }),
      "/api/public/content": async () => jsonResponse(CONTENT_BODY),
    });
    const out = await fetchSiteContent("https://x.test", NO_RETRY);
    expect(out.site.whatsapp).toBeUndefined();
    expect(out.site.instagram).toBe("cafe.nuevo");
    expect(warn.mock.calls.some((c) => String(c[0]).includes("whatsappNumber"))).toBe(true);
  });

  it("sends a timeout signal so a hung API cannot hang the build", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    global.fetch = fetchMock as unknown as typeof fetch;
    await fetchSiteContent("https://x.test", NO_RETRY);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe("applySiteSettings → SITE and link builders", () => {
  afterEach(() => applySiteSettings({}));

  it("API values replace the defaults in every link builder", () => {
    applySiteSettings({ whatsapp: "593911111111", instagram: "cafe.nuevo", tiktok: "cafe_nuevo", location: "Cuenca, Ecuador" });
    expect(whatsappLink("hola")).toBe("https://wa.me/593911111111?text=hola");
    expect(instagramLink()).toBe("https://www.instagram.com/cafe.nuevo/");
    expect(tiktokLink()).toBe("https://www.tiktok.com/@cafe_nuevo");
    expect(SITE.location).toBe("Cuenca, Ecuador");
  });

  it("a partial override leaves the other fields at their base value", () => {
    applySiteSettings({ location: "Cuenca, Ecuador" });
    expect(SITE.whatsapp).toBe("593994808252");
    expect(SITE.location).toBe("Cuenca, Ecuador");
  });

  it("is idempotent: applying {} restores the base values", () => {
    applySiteSettings({ whatsapp: "593911111111" });
    applySiteSettings({});
    expect(SITE.whatsapp).toBe("593994808252");
    expect(SITE.location).toBe("Loja, Ecuador");
  });
});
