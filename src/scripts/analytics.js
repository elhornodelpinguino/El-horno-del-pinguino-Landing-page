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

const HANDLED_CLICK = Symbol("analytics-click-handled");
const INITIALIZED_DOCUMENTS = new WeakSet();

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

  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return isMeasuredRoute(normalizedPath) ? normalizedPath : null;
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

export function resolveWhatsappContext(pathname, link) {
  const route = normalizeRoute(pathname);
  if (route === null) return null;

  const explicitContext =
    link && typeof link.getAttribute === "function"
      ? link.getAttribute("data-whatsapp-context")
      : null;

  if (isWhatsappContext(explicitContext) && buildConversionEvent(route, explicitContext) !== null) {
    return explicitContext;
  }

  return route === "/" ? "consumer" : null;
}

/**
 * @param {Object} [options]
 * @param {Document} [options.documentRef]
 * @param {string} [options.pathname]
 * @param {(event: {type: string, route: string, context: string}) => void} [options.dispatch]
 */
export function attachWhatsappListener({
  documentRef = globalThis.document,
  pathname = globalThis.location?.pathname,
  dispatch,
} = {}) {
  const route = normalizeRoute(pathname);
  if (
    route === null ||
    !documentRef ||
    typeof documentRef.addEventListener !== "function" ||
    typeof dispatch !== "function"
  ) {
    return () => undefined;
  }

  const onClick = (event) => {
    if (!event || typeof event !== "object" || event[HANDLED_CLICK]) return;
    event[HANDLED_CLICK] = true;

    const target = event.target;
    const link = target && typeof target.closest === "function"
      ? target.closest('a[href*="wa.me"]')
      : null;
    if (!link) return;

    const context = resolveWhatsappContext(route, link);
    const conversion = buildConversionEvent(route, context);
    if (conversion !== null) dispatch(conversion);
  };

  documentRef.addEventListener("click", onClick);
  return () => documentRef.removeEventListener?.("click", onClick);
}

/**
 * @param {Object} [options]
 * @param {string} [options.endpoint]
 * @param {Document} [options.documentRef]
 * @param {Location} [options.locationRef]
 * @param {() => PixelImage} [options.imageFactory]
 */
export function initializeAnalytics({
  endpoint,
  documentRef = globalThis.document,
  locationRef = globalThis.location,
  imageFactory,
} = {}) {
  const route = normalizeRoute(locationRef?.pathname ?? locationRef?.href);
  if (route === null || !documentRef || INITIALIZED_DOCUMENTS.has(documentRef)) return null;

  INITIALIZED_DOCUMENTS.add(documentRef);
  const dispatcher = createPixelDispatcher({ endpoint, imageFactory });
  const deduper = createEventDeduper();
  const pageView = buildPageViewEvent(route);

  if (pageView !== null && deduper.accept(`page-view:${route}`)) {
    dispatcher.dispatch(pageView);
  }

  const cleanup = attachWhatsappListener({
    documentRef,
    pathname: route,
    dispatch: dispatcher.dispatch,
  });

  return { cleanup, dispatcher };
}
