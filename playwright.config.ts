import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 960 } }, testIgnore: /(mobile|aliases)\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /(mobile|accessibility|maintenance)\.spec\.ts/ },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 960 } }, testIgnore: /(mobile|aliases)\.spec\.ts/ },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] }, testMatch: /(mobile|accessibility|maintenance)\.spec\.ts/ },
    // Alias fixture build (npm run build:alias-fixture): test-only aliases, never production.
    { name: "aliases", use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4174" }, testMatch: /aliases\.spec\.ts/ },
    { name: "aliases-webkit", use: { ...devices["Desktop Safari"], baseURL: "http://localhost:4174" }, testMatch: /aliases\.spec\.ts/ },
  ],
  webServer: [
    { command: "npx vite preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env.CI },
    { command: "npx vite preview --port 4174 --strictPort --outDir dist-alias-fixture", port: 4174, reuseExistingServer: !process.env.CI },
  ],
});
