import { SITE, instagramLink, tiktokLink } from "~/lib/config";

const canonicalOrigin = "https://elhornodelpinguino.com";

export interface LocalBusinessOptions {
  description: string;
}

/**
 * Base LocalBusiness (Bakery) schema for El Horno del Pingüino.
 * Shared by / and /negocios so Google merges both pages into one
 * consistent local entity (same @id), reinforcing local relevance
 * for Loja and disambiguating from the ice-cream brand "Pingüino".
 */
export function localBusinessSchema({ description }: LocalBusinessOptions): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${canonicalOrigin}/#business`,
    name: SITE.name,
    url: `${canonicalOrigin}/`,
    logo: `${canonicalOrigin}/logo.png`,
    image: `${canonicalOrigin}/og-image.png`,
    description,
    telephone: `+${SITE.whatsapp}`,
    priceRange: "$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Loja",
      addressCountry: "EC",
    },
    areaServed: { "@type": "City", name: "Loja" },
    sameAs: [instagramLink(), tiktokLink()],
  };
}
