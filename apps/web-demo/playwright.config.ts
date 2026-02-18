import { defineConfig, devices } from "@playwright/test";
import { AUTH_STATE_PATH, VISUAL_TEST_BASE_URL } from "./tests/visual/constants";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/visual",
  outputDir: "./test-results/playwright",
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: 1,
  reporter: isCi ? [["line"], ["html", { open: "never" }]] : [["list"]],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    baseURL: VISUAL_TEST_BASE_URL,
    colorScheme: "dark",
    locale: "en-US",
    timezoneId: "UTC",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: AUTH_STATE_PATH,
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: {
    command:
      "corepack pnpm --filter @reactiveweb/web-demo exec react-router dev --host 127.0.0.1 --port 4173",
    url: `${VISUAL_TEST_BASE_URL}/auth`,
    cwd: "../..",
    reuseExistingServer: !isCi,
    timeout: 120_000,
    env: {
      ...process.env,
      TZ: "UTC",
      NODE_ENV: process.env.NODE_ENV ?? "test",
    },
  },
});
