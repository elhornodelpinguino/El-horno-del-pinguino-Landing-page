import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://el-horno-del-pinguino-landing-page.onrender.com",
  output: "static",
  integrations: [tailwind()],
});
