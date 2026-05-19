export const SITE = {
  name: "Horno del Pingüino",
  tagline: "Postres artesanales con buena presentación, sabor consistente y atención cercana.",
  description:
    "Creamos postres artesanales hechos para sorprender. Calidad, creatividad y cercanía en cada pedido.",
  whatsapp:
    (import.meta.env.PUBLIC_WHATSAPP_NUMBER as string | undefined) ??
    "593994808252",
  instagram:
    (import.meta.env.PUBLIC_INSTAGRAM_HANDLE as string | undefined) ??
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
