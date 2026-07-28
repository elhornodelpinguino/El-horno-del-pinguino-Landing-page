import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const systemChromium = "/usr/bin/chromium-browser";

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: 2,
  use: { baseURL: "http://localhost:4321" },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: existsSync(systemChromium)
          ? {
              executablePath: systemChromium,
              args: ["--no-sandbox", "--disable-setuid-sandbox"],
            }
          : undefined,
      },
    },
  ],
  webServer: {
    // Static build: `ENABLE_E2E_FIXTURES` must be present at BUILD time
    // (getStaticPaths reads it), so the build step runs here, not just
    // preview. `npm run preview` then serves the resulting `dist/` output.
    command: "npm run build && npm run preview",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    // Explicit opt-in so `src/pages/e2e-fixtures/*` routes are emitted by
    // the static build only for this test-driven build — never in the
    // production deploy, which never sets this var (see
    // docs/deploy-cloudflare.md).
    env: {
      ...process.env,
      ENABLE_E2E_FIXTURES: "true",
       PUBLIC_ANALYTICS_PROVIDER: "goatcounter",
       PUBLIC_ANALYTICS_ENDPOINT: "https://e2e.goatcounter.com/count",
    },
  },
});
