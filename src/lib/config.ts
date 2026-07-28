export const SITE = {
  name: "El Horno del Pingüino",
  tagline: "Minitortas y minidonas hechas a mano en Loja.",
  description:
    "Minitortas y minidonas artesanales en Loja: frutos rojos, maracuyá y Oreo. Horneadas por encargo y pedidas por WhatsApp.",
  whatsapp:
    (import.meta.env.PUBLIC_WHATSAPP_NUMBER as string | undefined) ??
    "593994808252",
  instagram:
    (import.meta.env.PUBLIC_INSTAGRAM_HANDLE as string | undefined) ??
    "elhornodelpinguino",
  tiktok:
    (import.meta.env.PUBLIC_TIKTOK_HANDLE as string | undefined) ??
    "elhornodelpinguino",
  location: "Loja, Ecuador",
};

export const ANALYTICS_PROVIDERS = {
  GOATCOUNTER: "goatcounter",
} as const;

export type AnalyticsProvider = (typeof ANALYTICS_PROVIDERS)[keyof typeof ANALYTICS_PROVIDERS];

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  endpoint: string;
}

interface AnalyticsConfigInput {
  provider: unknown;
  endpoint: unknown;
}

function isHttpEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".goatcounter.com") &&
      url.hostname !== "goatcounter.com" &&
      url.pathname === "/count" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch {
    return false;
  }
}

export function validateAnalyticsConfig(input: AnalyticsConfigInput): AnalyticsConfig | null {
  if (input.provider !== ANALYTICS_PROVIDERS.GOATCOUNTER || !isHttpEndpoint(input.endpoint)) {
    return null;
  }

  return {
    provider: ANALYTICS_PROVIDERS.GOATCOUNTER,
    endpoint: input.endpoint,
  };
}

export const ANALYTICS_CONFIG = validateAnalyticsConfig({
  provider: import.meta.env.PUBLIC_ANALYTICS_PROVIDER as string | undefined,
  endpoint: import.meta.env.PUBLIC_ANALYTICS_ENDPOINT as string | undefined,
});

export function whatsappLink(message: string): string {
  const base = `https://wa.me/${SITE.whatsapp}`;
  const text = encodeURIComponent(message);
  return `${base}?text=${text}`;
}

export function instagramLink(): string {
  return `https://www.instagram.com/${SITE.instagram}/`;
}

export function tiktokLink(): string {
  return `https://www.tiktok.com/@${SITE.tiktok}`;
}
