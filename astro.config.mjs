import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://el-horno-del-pinguino-landing-page.onrender.com",
  output: "server",
  adapter: node({
    mode: "standalone"
  }),
  integrations: [tailwind()],
});
