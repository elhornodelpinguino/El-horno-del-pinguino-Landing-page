export interface BusinessImage {
  src: string;
  srcset: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
}

export interface BusinessGalleryItem extends BusinessImage {
  caption: string;
}

export interface BusinessProductBlock extends BusinessImage {
  title: "Cheesecake" | "Minidonas";
  copy: string;
}

export interface BusinessStepEvidence extends BusinessImage {
  step: 1 | 2 | 3 | 4;
  label: string;
}

const landscapeSizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw";
const productSizes = "(min-width: 768px) 50vw, 100vw";

export const BUSINESS_GALLERY = [
  {
    caption: "Pedidos por volumen",
    src: "/b2b-gallery-volume.webp",
    srcset: "/b2b-gallery-volume-sm.webp 720w, /b2b-gallery-volume.webp 1200w",
    sizes: landscapeSizes,
    alt: "Varias cajas abiertas con minidonas decoradas en filas.",
    width: 1200,
    height: 900,
  },
  {
    caption: "Presentación individual",
    src: "/b2b-gallery-individual.webp",
    srcset: "/b2b-gallery-individual-sm.webp 720w, /b2b-gallery-individual.webp 1200w",
    sizes: landscapeSizes,
    alt: "Una mano sostiene una caja pequeña de minidonas frente a más cajas.",
    width: 1200,
    height: 900,
  },
  {
    caption: "Detalles personalizados",
    src: "/b2b-gallery-custom.webp",
    srcset: "/b2b-gallery-custom-sm.webp 720w, /b2b-gallery-custom.webp 1200w",
    sizes: landscapeSizes,
    alt: "Vaso transparente con una minidona azul decorada y un topper de personaje.",
    width: 1200,
    height: 900,
  },
  {
    caption: "Listos para entregar",
    src: "/b2b-gallery-ready.webp",
    srcset: "/b2b-gallery-ready-sm.webp 720w, /b2b-gallery-ready.webp 1200w",
    sizes: landscapeSizes,
    alt: "Vasos transparentes con minidonas decoradas dispuestos en varias filas.",
    width: 1200,
    height: 900,
  },
] as const satisfies readonly BusinessGalleryItem[];

export const BUSINESS_PRODUCTS = [
  {
    title: "Cheesecake",
    copy: "Cheesecake en una presentación individual para tu pedido.",
    src: "/b2b-product-cheesecake.webp",
    srcset: "/b2b-product-cheesecake-sm.webp 720w, /b2b-product-cheesecake.webp 1200w",
    sizes: productSizes,
    alt: "Cheesecake individual con frutos rojos en un envase transparente.",
    width: 1200,
    height: 900,
  },
  {
    title: "Minidonas",
    copy: "Glaseadas, decoradas y listas para presentar en distintos formatos.",
    src: "/b2b-product-minidonas.webp",
    srcset: "/b2b-product-minidonas-sm.webp 720w, /b2b-product-minidonas.webp 1200w",
    sizes: productSizes,
    alt: "Cajas abiertas con minidonas glaseadas y decoradas.",
    width: 1200,
    height: 900,
  },
] as const satisfies readonly BusinessProductBlock[];

export const BUSINESS_STEP_EVIDENCE = [
  {
    step: 1,
    label: "Opciones para definir",
    src: "/b2b-gallery-volume.webp",
    srcset: "/b2b-gallery-volume-sm.webp 720w, /b2b-gallery-volume.webp 1200w",
    sizes: "(min-width: 1024px) 18vw, (min-width: 640px) 42vw, 100vw",
    alt: "Cajas abiertas con minidonas decoradas en distintos colores y diseños.",
    width: 1200,
    height: 900,
  },
  {
    step: 2,
    label: "Lote organizado",
    src: "/b2b-gallery-ready.webp",
    srcset: "/b2b-gallery-ready-sm.webp 720w, /b2b-gallery-ready.webp 1200w",
    sizes: "(min-width: 1024px) 18vw, (min-width: 640px) 42vw, 100vw",
    alt: "Vasos transparentes con minidonas decoradas dispuestos en filas.",
    width: 1200,
    height: 900,
  },
  {
    step: 3,
    label: "Lotes preparados",
    src: "/b2b-step-batch.webp",
    srcset: "/b2b-step-batch-sm.webp 720w, /b2b-step-batch.webp 1200w",
    sizes: "(min-width: 1024px) 18vw, (min-width: 640px) 42vw, 100vw",
    alt: "Vasos transparentes con minidonas decoradas reunidos sobre una mesa.",
    width: 1200,
    height: 900,
  },
  {
    step: 4,
    label: "Presentación lista para coordinar",
    src: "/b2b-gallery-individual.webp",
    srcset: "/b2b-gallery-individual-sm.webp 720w, /b2b-gallery-individual.webp 1200w",
    sizes: "(min-width: 1024px) 18vw, (min-width: 640px) 42vw, 100vw",
    alt: "Caja abierta con minidonas decoradas sostenida frente a más cajas.",
    width: 1200,
    height: 900,
  },
] as const satisfies readonly BusinessStepEvidence[];
