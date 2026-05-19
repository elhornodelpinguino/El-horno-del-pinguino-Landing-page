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
  id: number;
  external_id: string;
  org_id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  on_demand: boolean;
  perecedero: boolean;
  photo_url: string;
  is_active: boolean;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
  "https://product-admin-backend-vfyy.onrender.com/api";
const ORG_ID =
  import.meta.env.PUBLIC_ORG_EXTERNAL_ID ?? "horno-del-pinguino-92f9";

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

async function request<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  return withRetry(async () => {
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `API ${res.status} ${res.statusText} en ${path} :: ${body.slice(0, 200)}`,
      );
    }
    return (await res.json()) as T;
  });
}

import fallbackRaw from "../data/fallback.json";

interface FallbackData {
  org: Organization;
  products: Product[];
}

export function loadFallback(): FallbackData {
  console.warn("Using fallback data — backend unreachable");
  return fallbackRaw as FallbackData;
}

export async function getOrganization(): Promise<Organization | null> {
  const data = await request<OrganizationsResponse>("/public/organizations");
  return data.organizations.find((o) => o.external_id === ORG_ID) ?? null;
}

export async function getProducts(): Promise<Product[]> {
  const data = await request<ProductsResponse>(
    `/public/organizations/${ORG_ID}/products`,
  );
  return data.products.filter((p) => p.is_active);
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}
