import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatPrice,
  withRetry,
  ApiError,
  buildProductsUrl,
  getProducts,
  loadFallback,
} from "../../src/lib/api";

function mockJsonResponse(
  body: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {},
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("getProducts", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("resolves with typed camelCase items from a 2-item envelope", async () => {
    const envelope = {
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Brownie Artesanal",
          description: "Brownie de chocolate semi-amargo con nueces.",
          price: 850,
          currency: "USD",
          imageUrl: "/producto-torta-mariposas.jpg",
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          name: "Cheesecake de Maracuyá",
          description: "Cheesecake cremoso con base de galleta y maracuyá natural.",
          price: 1200,
          currency: "USD",
          imageUrl: "/producto-mini-donas.jpg",
        },
      ],
      page: 1,
      limit: 100,
      total: 2,
      totalPages: 1,
    };
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse(envelope)) as unknown as typeof fetch;

    const products = await getProducts();

    expect(products).toEqual(envelope.items);
  });

  it("rejects with ApiError after 3 attempts when the API returns 500 on every attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        mockJsonResponse(
          { error: "boom" },
          { ok: false, status: 500, statusText: "Internal Server Error" },
        ),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getProducts()).rejects.toThrow(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("warns and returns only page-1 items when totalPages exceeds 1 (no auto-pagination)", async () => {
    const envelope = {
      items: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "Torta de Mariposas",
          description: "Torta decorada.",
          price: 2800,
          currency: "USD",
          imageUrl: "/producto-torta-mariposas.jpg",
        },
      ],
      page: 1,
      limit: 100,
      total: 250,
      totalPages: 3,
    };
    global.fetch = vi.fn().mockResolvedValue(mockJsonResponse(envelope)) as unknown as typeof fetch;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const products = await getProducts();

    expect(products).toEqual(envelope.items);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("buildProductsUrl", () => {
  it("builds host-root + /api/public/products?page=1&limit=100", () => {
    expect(buildProductsUrl("https://catalog.example.com")).toBe(
      "https://catalog.example.com/api/public/products?page=1&limit=100",
    );
  });

  it("normalizes a trailing slash on the base URL (no double slash)", () => {
    expect(buildProductsUrl("https://catalog.example.com/")).toBe(
      "https://catalog.example.com/api/public/products?page=1&limit=100",
    );
  });
});

describe("formatPrice (cents-based)", () => {
  it("formats whole thousands of cents as dollars (150000 cents -> $1,500.00)", () => {
    expect(formatPrice(150000)).toBe("$1.500,00");
  });
  it("formats sub-hundred cents as dollars (850 cents -> $8.50)", () => {
    expect(formatPrice(850)).toBe("$8,50");
  });
  it("handles zero", () => {
    expect(formatPrice(0)).toContain("$0,00");
  });
  it("handles rounding and large values without a 100x error", () => {
    expect(formatPrice(999)).toContain(",");
    const large = formatPrice(99999999);
    expect(large).toContain("999.999,99");
  });
});

describe("loadFallback", () => {
  it("returns Product[] structurally compatible with getProducts() output (no org key)", () => {
    const products = loadFallback();

    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      price: expect.any(Number),
      currency: expect.any(String),
      imageUrl: expect.any(String),
    });
    expect(products[0]).not.toHaveProperty("org");
    expect((products as unknown as { org?: unknown }).org).toBeUndefined();
  });
});

describe("withRetry", () => {
  it("throws ApiError after all retries exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 10 })).rejects.toThrow(ApiError);
    expect(fn).toHaveBeenCalledTimes(3);
  });
  it("returns on second attempt", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce("ok");
    const result = await withRetry(fn, { attempts: 3, baseDelayMs: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
  it("returns on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("instant");
    expect(await withRetry(fn, { attempts: 3, baseDelayMs: 10 })).toBe("instant");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
