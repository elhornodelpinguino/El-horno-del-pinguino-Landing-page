export const SITE = {
  name: "El Horno del Pingüino",
  tagline: "Postres artesanales con buena presentación, sabor consistente y coordinación cercana.",
  description:
    "Postres artesanales en Loja para empresas, colegios, cafeterías y ocasiones especiales. Coordinación clara por WhatsApp.",
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
