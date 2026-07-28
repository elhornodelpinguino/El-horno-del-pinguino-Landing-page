import { describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_PROVIDERS,
  validateAnalyticsConfig,
} from "../lib/config";
import {
  buildConversionEvent,
  buildPageViewEvent,
  buildPixelUrl,
  createEventDeduper,
  createPixelDispatcher,
  normalizeRoute,
  attachWhatsappListener,
  initializeAnalytics,
  resolveWhatsappContext,
} from "./analytics.js";

describe("analytics configuration", () => {
  it("accepts the supported provider with a hosted GoatCounter pixel endpoint", () => {
    expect(
      validateAnalyticsConfig({
        provider: ANALYTICS_PROVIDERS.GOATCOUNTER,
        endpoint: "https://shop.goatcounter.com/count",
      }),
    ).toEqual({
      provider: "goatcounter",
      endpoint: "https://shop.goatcounter.com/count",
    });
  });

  it("rejects local, same-origin, and non-pixel production endpoints", () => {
    for (const endpoint of ["http://localhost:4321/count", "https://shop.example.test/count", "https://shop.goatcounter.com/not-count"])
      expect(validateAnalyticsConfig({ provider: ANALYTICS_PROVIDERS.GOATCOUNTER, endpoint })).toBeNull();
  });

  it("returns inert configuration for missing or unsupported values", () => {
    expect(validateAnalyticsConfig({ provider: undefined, endpoint: undefined })).toBeNull();
    expect(
      validateAnalyticsConfig({ provider: "unknown", endpoint: "https://stats.example.test/count" }),
    ).toBeNull();
    expect(
      validateAnalyticsConfig({ provider: "goatcounter", endpoint: "javascript:alert(1)" }),
    ).toBeNull();
  });
});

describe("analytics event contract", () => {
  it("normalizes only the allowlisted routes and discards URL details", () => {
    expect(normalizeRoute("/?utm_source=secret#fragment")).toBe("/");
    expect(normalizeRoute("/negocios?customer=secret#fragment")).toBe("/negocios");
    expect(normalizeRoute("/negocios/?customer=secret#fragment")).toBe("/negocios");
    expect(normalizeRoute("/admin?token=secret")).toBeNull();
  });

  it("builds a page-view event from a normalized route", () => {
    expect(buildPageViewEvent("/negocios?utm_campaign=secret")).toEqual({
      type: "page_view",
      route: "/negocios",
    });
  });

  it("rejects page views for routes outside the allowlist", () => {
    expect(buildPageViewEvent("/catalogo?utm_source=secret")).toBeNull();
  });

  it("builds a conversion event with only its route and allowlisted context", () => {
    expect(buildConversionEvent("/negocios", "business-closing")).toEqual({
      type: "conversion",
      route: "/negocios",
      context: "business-closing",
    });
    expect(buildConversionEvent("/", "business-closing")).toBeNull();
    expect(buildConversionEvent("/", "consumer")).toEqual({
      type: "conversion",
      route: "/",
      context: "consumer",
    });
  });

  it("serializes page views with exactly the route pixel key", () => {
    const url = buildPixelUrl(
      "https://stats.example.test/count?query=remove-me",
      buildPageViewEvent("/?title=secret#fragment"),
    );

    expect(url).toBe("https://stats.example.test/count?p=%2F");
    if (url === null) throw new Error("Expected a page-view pixel URL");
    expect([...new URL(url).searchParams.keys()]).toEqual(["p"]);
    expect(url).not.toMatch(/[?&](q|r|s|t|title|referrer|screen)=/);
  });

  it("serializes conversions with only p and e pixel keys", () => {
    const event = buildConversionEvent("/negocios", "business-intro");
    const url = buildPixelUrl("https://stats.example.test/count", event);

    expect(url).toBe(
      "https://stats.example.test/count?p=whatsapp-conversion--negocios--business-intro&e=1",
    );
    if (url === null) throw new Error("Expected a conversion pixel URL");
    expect([...new URL(url).searchParams.keys()]).toEqual(["p", "e"]);
  });

  it("returns no URL when the endpoint or event is unavailable", () => {
    expect(buildPixelUrl("not-a-url", buildPageViewEvent("/"))).toBeNull();
    expect(buildPixelUrl("https://stats.example.test/count", null)).toBeNull();
  });

  it("rejects hand-built events that would escape the allowlisted payload", () => {
    expect(
      buildPixelUrl("https://stats.example.test/count", {
        type: "page_view",
        route: "/private?token=secret",
      }),
    ).toBeNull();
    expect(
      buildPixelUrl("https://stats.example.test/count", {
        type: "conversion",
        route: "/?secret",
        context: "consumer",
      }),
    ).toBeNull();
  });
});

describe("analytics deduplication", () => {
  it("accepts a first event key and rejects repeated initialization or activation", () => {
    const deduper = createEventDeduper();

    expect(deduper.accept("page-view:/")).toBe(true);
    expect(deduper.accept("page-view:/")).toBe(false);
    expect(deduper.accept("conversion:business-intro:activation-1")).toBe(true);
    expect(deduper.accept("conversion:business-intro:activation-1")).toBe(false);
    expect(deduper.accept("page-view:/negocios")).toBe(true);
  });
});

describe("analytics dispatch", () => {
  it("caps pending pixels and releases the slot after a request settles", () => {
    const images: Array<{
      referrerPolicy: string;
      src: string;
      onerror: (() => void) | null;
      onload: (() => void) | null;
    }> = [];
    const dispatcher = createPixelDispatcher({
      endpoint: "https://stats.example.test/count",
      maxPending: 1,
      imageFactory: () => {
        const image = { referrerPolicy: "", src: "", onerror: null, onload: null };
        images.push(image);
        return image;
      },
    });

    expect(dispatcher.dispatch(buildPageViewEvent("/"))).toBe(true);
    expect(dispatcher.dispatch(buildPageViewEvent("/negocios"))).toBe(false);
    expect(dispatcher.pendingCount()).toBe(1);
    expect(images[0].referrerPolicy).toBe("no-referrer");
    expect(images[0].src).toBe("https://stats.example.test/count?p=%2F");

    images[0].onload?.();
    expect(dispatcher.pendingCount()).toBe(0);
    expect(dispatcher.dispatch(buildPageViewEvent("/negocios"))).toBe(true);
  });

  it("silently ignores invalid events and blocked image dispatch", () => {
    const dispatcher = createPixelDispatcher({
      endpoint: "https://stats.example.test/count",
      imageFactory: () => {
        throw new Error("blocked");
      },
    });

    expect(dispatcher.dispatch(null)).toBe(false);
    expect(dispatcher.dispatch(buildPageViewEvent("/"))).toBe(false);
    expect(dispatcher.pendingCount()).toBe(0);
  });

  it("releases the pending slot when assigning the pixel source throws", () => {
    const dispatcher = createPixelDispatcher({
      endpoint: "https://stats.example.test/count",
      imageFactory: () => ({
        referrerPolicy: "",
        onerror: null,
        onload: null,
        set src(_value: string) {
          throw new Error("blocked by browser policy");
        },
      }),
    });

    expect(dispatcher.dispatch(buildPageViewEvent("/"))).toBe(false);
    expect(dispatcher.pendingCount()).toBe(0);
  });
});

describe("WhatsApp context resolution", () => {
  it("prefers a valid explicit context and falls back to consumer on home", () => {
    const businessLink = {
      getAttribute: (name: string) => (name === "data-whatsapp-context" ? "business-intro" : null),
    };

    expect(resolveWhatsappContext("/", businessLink)).toBe("business-intro");
    expect(resolveWhatsappContext("/", { getAttribute: () => "invalid" })).toBe("consumer");
    expect(resolveWhatsappContext("/", { getAttribute: () => null })).toBe("consumer");
  });

  it("requires explicit business contexts on the B2B route", () => {
    expect(
      resolveWhatsappContext("/negocios", {
        getAttribute: () => "business-closing",
      }),
    ).toBe("business-closing");
    expect(resolveWhatsappContext("/negocios", { getAttribute: () => null })).toBeNull();
  });
});

describe("delegated WhatsApp listener", () => {
  it("dispatches one conversion per click event without preventing navigation", () => {
    const listeners: Array<(event: { target: unknown; preventDefault: () => void }) => void> = [];
    const documentRef = {
      addEventListener: (_type: string, listener: (event: { target: unknown; preventDefault: () => void }) => void) => {
        listeners.push(listener);
      },
      removeEventListener: () => undefined,
    } as unknown as Document;
    const link = {
      closest: () => link,
      getAttribute: () => "business-intro",
    };
    const dispatched: unknown[] = [];
    const event = {
      target: link,
      preventDefault: () => {
        throw new Error("navigation must remain untouched");
      },
    };

    attachWhatsappListener({
      documentRef,
      pathname: "/",
      dispatch: (analyticsEvent: unknown) => dispatched.push(analyticsEvent),
    });

    listeners[0](event);
    listeners[0](event);

    expect(dispatched).toEqual([
      { type: "conversion", route: "/", context: "business-intro" },
    ]);
  });

  it("allows a later activation while ignoring non-WhatsApp targets", () => {
    const listeners: Array<(event: { target: unknown }) => void> = [];
    const documentRef = {
      addEventListener: (_type: string, listener: (event: { target: unknown }) => void) => {
        listeners.push(listener);
      },
      removeEventListener: () => undefined,
    } as unknown as Document;
    const link = {
      closest: () => link,
      getAttribute: () => null,
    };
    const dispatch = vi.fn();

    attachWhatsappListener({ documentRef, pathname: "/", dispatch });

    listeners[0]({ target: { closest: () => null } });
    listeners[0]({ target: link });
    listeners[0]({ target: link });

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: "conversion",
      route: "/",
      context: "consumer",
    });
  });
});

describe("analytics initialization", () => {
  it("emits one page view and does not duplicate on repeated initialization", () => {
    const listeners: Array<(event: { target: unknown }) => void> = [];
    const documentRef = {
      addEventListener: (_type: string, listener: (event: { target: unknown }) => void) => {
        listeners.push(listener);
      },
      removeEventListener: () => undefined,
      documentElement: {},
    } as unknown as Document;
    const images: Array<{ src: string; referrerPolicy: string; onload: (() => void) | null; onerror: (() => void) | null }> = [];
    const imageFactory = () => {
      const image = { src: "", referrerPolicy: "", onload: null, onerror: null };
      images.push(image);
      return image;
    };

    initializeAnalytics({
      endpoint: "https://stats.example.test/count",
      documentRef,
      locationRef: { pathname: "/negocios" } as unknown as Location,
      imageFactory,
    });
    initializeAnalytics({
      endpoint: "https://stats.example.test/count",
      documentRef,
      locationRef: { pathname: "/negocios" } as unknown as Location,
      imageFactory,
    });

    expect(images).toHaveLength(1);
    expect(images[0].src).toBe("https://stats.example.test/count?p=%2Fnegocios");

    const link = {
      closest: () => link,
      getAttribute: () => "business-intro",
    };
    listeners[0]({ target: link });
    listeners[0]({ target: link });

    expect(images).toHaveLength(3);
  });
});
