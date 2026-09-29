import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3000", browserName: "chromium" },
  webServer: {
    command: "npm run dev --workspace=@tradelab/web -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
