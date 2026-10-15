import { request, getApiBaseUrl } from "~/lib/api";
import { applySiteSettings, type SiteOverrides } from "~/lib/config";
import { FAQ_FALLBACK, type FaqItem } from "~/data/faq-fallback";

export type { FaqItem };

export interface BannerItem {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
}

export interface PublicContent {
  faqs: FaqItem[];
  banners: BannerItem[];
}

export interface SiteContent {
  site: SiteOverrides;
  content: PublicContent;
}

interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
}

const REQUEST_TIMEOUT_MS = 10_000;
const EMPTY_CONTENT: PublicContent = { faqs: [], banners: [] };

const WHATSAPP_DIGITS = /^\d{8,15}$/;
const HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const MAX_LOCATION = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function whatsapp(value: unknown): string | undefined {
  const raw = text(value)?.replace(/^\+/, "");
  return raw !== undefined && WHATSAPP_DIGITS.test(raw) ? raw : undefined;
}

function handle(value: unknown): string | undefined {
  const raw = text(value);
  return raw !== null && HANDLE.test(raw) ? raw : undefined;
}

function location(value: unknown): string | undefined {
  const raw = text(value);
  // eslint-disable-next-line no-control-regex
  return raw !== null && raw.length <= MAX_LOCATION && !/[\u0000-\u001f]/.test(raw) ? raw : undefined;
}

/** Field-by-field validation: an invalid field is dropped, never the whole payload. */
export function parseSiteSettings(raw: unknown): SiteOverrides {
  if (!isRecord(raw)) return {};
  const out: SiteOverrides = {};
  const wa = whatsapp(raw.whatsappNumber);
  const ig = handle(raw.instagramHandle);
  const tt = handle(raw.tiktokHandle);
  const loc = location(raw.location);
  if (wa !== undefined) out.whatsapp = wa;
  if (ig !== undefined) out.instagram = ig;
  if (tt !== undefined) out.tiktok = tt;
  if (loc !== undefined) out.location = loc;
  return out;
}

/** Plain data only: templates render these through Astro's escaping `{}`. */
export function parsePublicContent(raw: unknown): PublicContent {
  if (!isRecord(raw)) return { ...EMPTY_CONTENT };

  const faqs: FaqItem[] = [];
  for (const item of Array.isArray(raw.faqs) ? raw.faqs : []) {
    if (!isRecord(item)) continue;
    const question = text(item.question);
    const answer = text(item.answer);
    if (question === null || answer === null) continue;
    faqs.push({ id: String(item.id ?? faqs.length), question, answer });
  }

  const banners: BannerItem[] = [];
  for (const item of Array.isArray(raw.banners) ? raw.banners : []) {
    if (!isRecord(item)) continue;
    const title = text(item.title);
    const body = text(item.body);
    if (title === null || body === null) continue;
    banners.push({ id: String(item.id ?? banners.length), title, body, ctaLabel: text(item.ctaLabel) });
  }

  return { faqs, banners };
}

/** Admin FAQs when there are any, otherwise today's hard-coded list. */
export function resolveFaqs(faqs: FaqItem[]): FaqItem[] {
  return faqs.length > 0 ? faqs : FAQ_FALLBACK;
}

export function buildSiteUrl(base: string): string {
  return `${base.replace(/\/$/, "")}/api/public/site`;
}

export function buildContentUrl(base: string): string {
  return `${base.replace(/\/$/, "")}/api/public/content`;
}

const SITE_FIELDS: Array<[apiField: string, field: keyof SiteOverrides]> = [
  ["whatsappNumber", "whatsapp"],
  ["instagramHandle", "instagram"],
  ["tiktokHandle", "tiktok"],
  ["location", "location"],
];

async function fetchRecord(url: string, retry?: RetryOptions): Promise<Record<string, unknown>> {
  const body = await request<unknown>(url, { retry, timeoutMs: REQUEST_TIMEOUT_MS });
  if (!isRecord(body)) throw new Error("Malformed response: expected a JSON object");
  return body;
}

function warnFallback(endpoint: string, err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err);
  console.warn(`[site-content] /api/public/${endpoint} unavailable — using fallback values (${detail})`);
}

/**
 * Reads both endpoints independently. NEVER rejects: each failed endpoint
 * degrades to its fallback (no overrides / no content) and logs a warning.
 */
export async function fetchSiteContent(base: string, retry?: RetryOptions): Promise<SiteContent> {
  const [siteResult, contentResult] = await Promise.allSettled([
    fetchRecord(buildSiteUrl(base), retry),
    fetchRecord(buildContentUrl(base), retry),
  ]);

  let site: SiteOverrides = {};
  if (siteResult.status === "fulfilled") {
    site = parseSiteSettings(siteResult.value);
    for (const [apiField, field] of SITE_FIELDS) {
      if (site[field] === undefined) {
        console.warn(`[site-content] /api/public/site: "${apiField}" missing or invalid — using default`);
      }
    }
  } else {
    warnFallback("site", siteResult.reason);
  }

  let content: PublicContent = { ...EMPTY_CONTENT };
  if (contentResult.status === "fulfilled") {
    content = parsePublicContent(contentResult.value);
  } else {
    warnFallback("content", contentResult.reason);
  }

  return { site, content };
}

let pending: Promise<SiteContent> | undefined;

/**
 * Build-time entry point for pages: one fetch per build (memoized), applies
 * the validated site settings to SITE. Call it in page frontmatter, before
 * any component reads SITE.
 */
export function loadSiteContent(): Promise<SiteContent> {
  pending ??= fetchSiteContent(getApiBaseUrl()).then((result) => {
    applySiteSettings(result.site);
    return result;
  });
  return pending;
}
