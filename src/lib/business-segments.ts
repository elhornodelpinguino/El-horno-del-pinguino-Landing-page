import { whatsappLink } from "~/lib/config";

export type SegmentSlug = "cafeterias" | "colegios" | "clubes" | "empresas";

export interface SegmentMedia {
  src: string; // path under public/, already deployed
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
  media?: SegmentMedia; // OPTIONAL BY CONTRACT — `clubes` ships without it
}

// Pitch order, `clubes` third so the text-only row sits interior to the ledger.
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
      src: "/chesscake-hero.png",
      alt: "Cheesecake de frutos rojos en porción individual",
      width: 1672,
      height: 941,
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
      src: "/producto-mini-donas.jpg",
      alt: "Minidonas artesanales en porción individual",
      width: 960,
      height: 1280,
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
      src: "/producto-torta-mariposas.jpg",
      alt: "Torta decorada con mariposas artesanales",
      width: 960,
      height: 1280,
    },
  },
] as const satisfies readonly BusinessSegment[];

export function segmentWhatsappLink(segment: BusinessSegment): string {
  return whatsappLink(segment.whatsappMessage);
}
