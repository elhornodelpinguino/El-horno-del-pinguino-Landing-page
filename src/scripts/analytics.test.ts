import { describe, expect, it } from "vitest";

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
} from "./analytics.js";

describe("analytics configuration", () => {
  it("accepts the supported provider with an HTTP(S) endpoint", () => {
    expect(
      validateAnalyticsConfig({
        provider: ANALYTICS_PROVIDERS.GOATCOUNTER,
        endpoint: "https://stats.example.test/count",
      }),
    ).toEqual({
      provider: "goatcounter",
      endpoint: "https://stats.example.test/count",
    });
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
