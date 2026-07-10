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
    command: "npm run preview",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    // Explicit opt-in so `src/pages/e2e-fixtures/*` routes serve real
    // content only for this test-driven server — never in the production
    // deploy, which never sets this var (see render.yaml).
    env: { ...process.env, ENABLE_E2E_FIXTURES: "true" },
  },
});
