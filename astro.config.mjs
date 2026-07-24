import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://el-horno-del-pinguino-landing-page.pages.dev",
  output: "static",
  integrations: [tailwind(), sitemap()],
});
