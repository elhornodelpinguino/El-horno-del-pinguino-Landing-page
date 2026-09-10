import { test, expect, type Page } from "@playwright/test";
interface PixelRequest { url: string; referer: string | null }
async function stubPixelEndpoint(page: Page): Promise<PixelRequest[]> {
  const requests: PixelRequest[] = [];
  await page.route("**/count?*", async (route) => {
    requests.push({ url: route.request().url(), referer: await route.request().headerValue("referer") });
    await route.fulfill({ status: 204, body: "" });
  });
  return requests;
}
test.describe("commercial analytics", () => {
  test("emits one allowlisted page-view pixel without a referrer", async ({ page }) => {
    const requests = await stubPixelEndpoint(page);
    await page.goto("/?utm_source=private#fragment");
    await expect.poll(() => requests).toHaveLength(1);
    const pixel = new URL(requests[0].url);
    expect(pixel.pathname).toBe("/count"); expect([...pixel.searchParams.keys()]).toEqual(["p"]);
    expect(pixel.searchParams.get("p")).toBe("/"); expect(requests[0].referer).toBeNull();
  });
  test("identifies the measured B2B page and keeps the payload minimal", async ({ page }) => {
    const requests = await stubPixelEndpoint(page);
    await page.goto("/negocios");
    await expect.poll(() => requests).toHaveLength(1);
    const pixel = new URL(requests[0].url);
    expect(pixel.searchParams.get("p")).toBe("/negocios"); expect([...pixel.searchParams.keys()]).toEqual(["p"]); expect(pixel.search).not.toMatch(/[?&](q|r|s|t|title|screen|referrer)=/);
  });
  test("distinguishes consumer and business WhatsApp conversions", async ({ page }) => {
    const requests = await stubPixelEndpoint(page);
    await page.goto("/");
    const consumerLink = page.locator('a[href*="wa.me"]').first();
    const businessLink = page.getByRole("link", { name: /pide cotización directo por WhatsApp/i });
    await consumerLink.dispatchEvent("click");
    await businessLink.dispatchEvent("click");
    await expect.poll(() => requests).toHaveLength(3);
    const conversionPixels = requests.slice(1).map(({ url }) => new URL(url));
    expect(conversionPixels.map((pixel) => pixel.searchParams.get("p"))).toEqual([
      "whatsapp-conversion--home--consumer",
      "whatsapp-conversion--home--business-intro",
    ]);
    for (const pixel of conversionPixels) {
      expect([...pixel.searchParams.keys()]).toEqual(["p", "e"]);
      expect(pixel.searchParams.get("e")).toBe("1");
    }
  });
  test("keeps the outbound WhatsApp destination when the pixel fails", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/count?*", (route) => route.abort());
    // Stub the real WhatsApp destination so the popup navigation resolves
    // deterministically without depending on outbound network/DNS in CI.
    await page.context().route(/^https:\/\/(wa\.me|api\.whatsapp\.com)\//, (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>stub</title>" }),
    );
    await page.goto("/negocios");
    const link = page.getByRole("link", { name: "Escribir por WhatsApp" });
    const href = await link.getAttribute("href");
    const popupPromise = page.waitForEvent("popup");
    await link.click();
    const popup = await popupPromise;
    await popup.waitForURL(/^https:\/\/(wa\.me|api\.whatsapp\.com\/send)/);
    expect(href).toMatch(/^https:\/\/wa\.me\/593994808252\?text=/); expect(popup.url()).toMatch(/^https:\/\/(wa\.me|api\.whatsapp\.com\/send)/);
    expect(errors).toEqual([]);
  });
  test("keeps the delegated listener to one conversion for one activation", async ({ page }) => {
    const requests = await stubPixelEndpoint(page);
    await page.goto("/");
    const businessLink = page.getByRole("link", { name: /pide cotización directo por WhatsApp/i });
    await businessLink.dispatchEvent("click");
    await expect.poll(() => requests).toHaveLength(2);
    expect(requests.filter(({ url }) => new URL(url).searchParams.has("e"))).toHaveLength(1);
  });
});
