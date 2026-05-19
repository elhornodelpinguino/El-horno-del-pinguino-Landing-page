import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  site: "https://hornodelpinguino.vercel.app",
  output: "server",
  adapter: vercel({
    runtime: "nodejs20.x"
  }),
  integrations: [tailwind()],
});
