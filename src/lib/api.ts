export interface Organization {
  id: number;
  external_id: string;
  name: string;
  legal_name: string;
  email: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  logo_url: string;
  address: string | null;
  telephone: string;
  org_type: string;
  is_active: boolean;
  extra_data: Record<string, string>;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
}

export interface CatalogResponse {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsResponse {
  products: Product[];
  count: number;
  page: number;
  page_size: number;
}

interface OrganizationsResponse {
  organizations: Organization[];
  count: number;
}

const BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ??
  "https://product-admin-backend-vfyy.onrender.com";
const ORG_ID =
  import.meta.env.PUBLIC_ORG_EXTERNAL_ID ?? "horno-del-pinguino-92f9";

/**
 * Builds the fully-qualified public products endpoint URL from a host-root
 * base, normalizing any trailing slash so the join never double-slashes.
 */
export function buildProductsUrl(base: string): string {
  return `${base.replace(/\/$/, "")}/api/public/products?page=1&limit=100`;
}

export class ApiError extends Error {
  retries: number;
  cause: unknown;

  constructor(message: string, retries: number, cause: unknown) {
    super(message);
    this.name = "ApiError";
    this.retries = retries;
    this.cause = cause;
  }
}

interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = { attempts: 3, baseDelayMs: 500 },
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < opts.attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < opts.attempts - 1) {
        await new Promise((r) => setTimeout(r, opts.baseDelayMs * 2 ** i));
      }
    }
  }
  throw new ApiError(
    `Request failed after ${opts.attempts} retries`,
    opts.attempts,
    lastError,
  );
}

async function request<T>(url: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  return withRetry(async () => {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `API ${res.status} ${res.statusText} en ${url} :: ${body.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  });
}

import fallbackRaw from "../data/fallback.json";

interface FallbackData {
  items: Product[];
}

export function loadFallback(): Product[] {
  console.warn("Using fallback data — backend unreachable");
  return (fallbackRaw as FallbackData).items;
}

export async function getOrganization(): Promise<Organization | null> {
  const data = await request<OrganizationsResponse>(
    `${BASE_URL.replace(/\/$/, "")}/public/organizations`,
  );
  return data.organizations.find((o) => o.external_id === ORG_ID) ?? null;
}

export async function getProducts(): Promise<Product[]> {
  const data = await request<CatalogResponse>(buildProductsUrl(BASE_URL));
  if (data.totalPages > 1) {
    console.warn(
      `Catalog truncated: showing page ${data.page} of ${data.totalPages} (limit ${data.limit}, total ${data.total}). Auto-pagination is not implemented.`,
    );
  }
  return data.items;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Normaliza nombres de producto que vienen con typo del backend.
 * El backend tiene "Chesscake" en vez de "Cheesecake".
 */
export function displayProductName(raw: string): string {
  return raw.replace(/Chesscake/gi, "Cheesecake");
}
