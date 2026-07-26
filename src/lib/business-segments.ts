import { whatsappLink } from "~/lib/config";

export type SegmentSlug = "cafeterias" | "colegios" | "clubes" | "empresas";

export interface SegmentMedia {
  src: string; // path under public/, already deployed
  srcset: string;
  sizes: string;
  alt: string; // names the product; never claims a B2B context the photo lacks
  width: number; // explicit dimensions prevent CLS on mobile data
  height: number;
}

export interface BusinessSegment {
  slug: SegmentSlug;
  title: string;
  lead: string;
  bullets: string[];
  ctaLabel: string;
  whatsappMessage: string;
  media: SegmentMedia;
}

// Pitch order keeps clubes third so the visual rhythm changes before empresas.
export const BUSINESS_SEGMENTS = [
  {
    slug: "cafeterias",
    title: "Cafeterías",
    lead: "Porciones listas para tu vitrina, con presentación pareja pedido tras pedido.",
    bullets: [
      "Porción individual pensada para vitrina o exhibidor frío.",
      "Empaque que resiste el traslado y luce bien en el mostrador.",
      "Reposición coordinada según tu rotación semanal.",
    ],
    ctaLabel: "Coordinar por WhatsApp",
    whatsappMessage:
      "Hola, ya conversamos sobre pedidos para tu cafetería. Quiero coordinar los detalles.",
    media: {
      src: "/b2b-segment-cafeteria.webp",
      srcset: "/b2b-segment-cafeteria-sm.webp 720w, /b2b-segment-cafeteria.webp 1200w",
      sizes: "(min-width: 768px) 28vw, 100vw",
      alt: "Caja abierta con minidonas decoradas y una bebida al costado.",
      width: 1200,
      height: 900,
    },
  },
  {
    slug: "colegios",
    title: "Colegios",
    lead: "Porción individual pensada para bar escolar o eventos del colegio.",
    bullets: [
      "Formato individual fácil de repartir y contar.",
      "Coordinamos la entrega antes del recreo o del evento.",
      "Empaque simple, sin residuos difíciles de manejar en el colegio.",
    ],
    ctaLabel: "Coordinar por WhatsApp",
    whatsappMessage:
      "Hola, ya conversamos sobre pedidos para tu colegio. Quiero coordinar los detalles.",
    media: {
      src: "/b2b-segment-school.webp",
      srcset: "/b2b-segment-school-sm.webp 720w, /b2b-segment-school.webp 1200w",
      sizes: "(min-width: 768px) 28vw, 100vw",
      alt: "Varios vasos transparentes con minidonas decoradas en exhibición.",
      width: 1200,
      height: 900,
    },
  },
  {
    slug: "clubes",
    title: "Clubes",
    lead: "Para torneos, socios y eventos deportivos, con entrega coordinada el día del evento.",
    bullets: [
      "Cantidades pensadas para el día del torneo o la reunión de socios.",
      "Entrega coordinada directo en la sede o la cancha.",
      "Coordinamos las fechas con anticipación para no fallar el día clave.",
    ],
    ctaLabel: "Coordinar por WhatsApp",
    whatsappMessage:
      "Hola, ya conversamos sobre pedidos para tu club. Quiero coordinar los detalles.",
    media: {
      src: "/b2b-segment-club.webp",
      srcset: "/b2b-segment-club-sm.webp 720w, /b2b-segment-club.webp 1200w",
      sizes: "(min-width: 768px) 28vw, 100vw",
      alt: "Varias cajas abiertas con minidonas decoradas en tonos amarillos y negros.",
      width: 1200,
      height: 900,
    },
  },
  {
    slug: "empresas",
    title: "Empresas",
    lead: "Para tu equipo, un cliente importante o un evento corporativo, con presentación cuidada.",
    bullets: [
      "Presentación cuidada para regalar o servir en la oficina.",
      "Coordinamos la entrega directo en tu oficina o punto de reunión.",
      "Pedido recurrente si tu equipo lo pide seguido.",
    ],
    ctaLabel: "Coordinar por WhatsApp",
    whatsappMessage:
      "Hola, ya conversamos sobre pedidos para tu empresa. Quiero coordinar los detalles.",
    media: {
      src: "/b2b-segment-business.webp",
      srcset: "/b2b-segment-business-sm.webp 720w, /b2b-segment-business.webp 1200w",
      sizes: "(min-width: 768px) 28vw, 100vw",
      alt: "Minidonas decoradas en azul y blanco dentro de una caja.",
      width: 1200,
      height: 900,
    },
  },
] as const satisfies readonly BusinessSegment[];

export function segmentWhatsappLink(segment: BusinessSegment): string {
  return whatsappLink(segment.whatsappMessage);
}
