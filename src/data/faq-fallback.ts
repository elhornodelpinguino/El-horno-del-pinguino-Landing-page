// Today's hard-coded FAQs. Rendered when the admin API is unreachable or
// returns zero FAQs, so the section never goes empty.
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_FALLBACK: FaqItem[] = [
  {
    id: "fallback-precio",
    question: "¿Cuánto cuesta una minitorta?",
    answer:
      "Desde $0,99 el cheesecake pequeño. El precio final depende del tamaño, el sabor y la cantidad. Escríbenos por WhatsApp y te enviamos todas las opciones.",
  },
  { id: "fallback-una-sola", question: "¿Puedo pedir una sola?", answer: "Claro, para eso son mini." },
  {
    id: "fallback-anticipacion",
    question: "¿Con cuánta anticipación pido?",
    answer: "Con dos o tres días de anticipación está perfecto. Para pedidos grandes, una semana.",
  },
  {
    id: "fallback-personalizar",
    question: "¿Puedo personalizar el diseño?",
    answer: "Sí. Color, dedicatoria y tamaño los definimos contigo por WhatsApp.",
  },
  {
    id: "fallback-entregas",
    question: "¿Hacen entregas?",
    answer: "Sí, dentro de Loja. Coordinamos punto y hora por WhatsApp.",
  },
  { id: "fallback-pagos", question: "¿Cuáles son los métodos de pago?", answer: "Efectivo o transferencia." },
];
