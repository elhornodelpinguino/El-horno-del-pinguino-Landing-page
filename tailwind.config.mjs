/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        horno: {
          magenta: "#a81452",
          magentaDeep: "#8a0f43",
          magentaLight: "#c42a6a",
          cream: "#fbebde",
          creamDark: "#f5dcc9",
          orange: "#f49d50",
          orangeLight: "#ffb070",
          ink: "#2d1a1a",
        },
      },
      fontFamily: {
        display: ["'Poppins'", "sans-serif"],
        body: ["'Poppins'", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(168, 20, 82, 0.25)",
        card: "0 8px 24px -8px rgba(168, 20, 82, 0.18)",
      },
      backgroundImage: {
        "horno-gradient":
          "linear-gradient(135deg, #fbebde 0%, #ffffff 55%, #fff5ef 100%)",
      },
    },
  },
  plugins: [],
};
