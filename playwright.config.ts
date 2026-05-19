import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  retries: 2,
  use: { baseURL: "http://localhost:4321" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: { command: "npm run preview", port: 4321, reuseExistingServer: !process.env.CI },
});
