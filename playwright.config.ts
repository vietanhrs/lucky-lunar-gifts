import { defineConfig } from "@playwright/test";

// In sandboxes without network access to the Playwright CDN, point at a
// pre-installed Chromium via PW_EXECUTABLE_PATH. In CI, `playwright install`
// provides the browser and this stays unset.
const executablePath = process.env.PW_EXECUTABLE_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // Bind to IPv4 explicitly: the Vite config listens on "::" (IPv6), which
    // some sandboxes/CI don't support.
    command: "bun run dev --host 127.0.0.1",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
