const BASE_URL = "https://analytics.invalid";

export const MEASURED_ROUTES = Object.freeze(["/", "/negocios"]);

export const WHATSAPP_CONTEXTS = Object.freeze([
  "consumer",
  "business-intro",
  "business-closing",
]);

const EVENT_TYPES = Object.freeze({
  PAGE_VIEW: "page_view",
  CONVERSION: "conversion",
});

function isMeasuredRoute(value) {
  return MEASURED_ROUTES.includes(value);
}

function isWhatsappContext(value) {
  return WHATSAPP_CONTEXTS.includes(value);
}

export function normalizeRoute(value) {
  if (typeof value !== "string" || value.trim() === "") return null;

  let pathname;
  try {
    pathname = new URL(value, BASE_URL).pathname;
  } catch {
    return null;
  }

  return isMeasuredRoute(pathname) ? pathname : null;
}

export function buildPageViewEvent(pathname) {
  const route = normalizeRoute(pathname);
  return route === null ? null : { type: EVENT_TYPES.PAGE_VIEW, route };
}

export function buildConversionEvent(pathname, context) {
  const route = normalizeRoute(pathname);
  if (route === null || !isWhatsappContext(context)) return null;

  const allowedForRoute =
    route === "/"
      ? context === "consumer" || context === "business-intro"
      : context === "business-intro" || context === "business-closing";

  return allowedForRoute
    ? { type: EVENT_TYPES.CONVERSION, route, context }
    : null;
}

function pixelPathFor(event) {
  if (event?.type === EVENT_TYPES.PAGE_VIEW) {
    const route = normalizeRoute(event.route);
    return route === event.route ? route : null;
  }
  if (event?.type !== EVENT_TYPES.CONVERSION) return null;

  const route = normalizeRoute(event.route);
  if (route !== event.route || buildConversionEvent(event.route, event.context) === null) {
    return null;
  }

  const routeName = route === "/" ? "home" : "negocios";
  return `whatsapp-conversion--${routeName}--${event.context}`;
}

function isValidEndpoint(value) {
  if (typeof value !== "string" || value.trim() === "") return false;

  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "";
  } catch {
    return false;
  }
}

/**
 * @typedef {Object} PixelImage
 * @property {string} referrerPolicy
 * @property {string} src
 * @property {(() => void) | null} onload
 * @property {(() => void) | null} onerror
 */

/**
 * @typedef {Object} PixelDispatcherOptions
 * @property {string} [endpoint]
 * @property {number} [maxPending]
 * @property {() => PixelImage} [imageFactory]
 */

export function buildPixelUrl(endpoint, event) {
  const pixelPath = pixelPathFor(event);
  if (pixelPath === null || !isValidEndpoint(endpoint)) return null;

  try {
    const url = new URL(endpoint);
    url.search = "";
    url.hash = "";
    url.searchParams.set("p", pixelPath);
    if (event.type === EVENT_TYPES.CONVERSION) url.searchParams.set("e", "1");
    return url.href;
  } catch {
    return null;
  }
}

export function createEventDeduper() {
  const seen = new Set();

  return {
    accept(key) {
      if (typeof key !== "string" || key === "" || seen.has(key)) return false;
      seen.add(key);
      return true;
    },
  };
}

/**
 * @param {PixelDispatcherOptions} [options]
 */
export function createPixelDispatcher({
  endpoint,
  maxPending = 10,
  imageFactory = () => new Image(),
} = {}) {
  const pending = new Set();
  const limit = Number.isInteger(maxPending) && maxPending > 0 ? maxPending : 0;

  function dispatch(event) {
    if (pending.size >= limit) return false;

    const pixelUrl = buildPixelUrl(endpoint, event);
    if (pixelUrl === null) return false;

    let image;
    try {
      image = imageFactory();
      pending.add(image);
      const release = () => pending.delete(image);
      image.referrerPolicy = "no-referrer";
      image.onload = release;
      image.onerror = release;
      image.src = pixelUrl;
      return true;
    } catch {
      if (image !== undefined) pending.delete(image);
      return false;
    }
  }

  return {
    dispatch,
    pendingCount: () => pending.size,
  };
}
