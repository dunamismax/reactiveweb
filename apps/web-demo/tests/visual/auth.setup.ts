import { expect, test as setup } from "@playwright/test";
import { AUTH_STATE_PATH, requireVisualEnv } from "./constants";
import { gotoStableRoute } from "./helpers";

const ADMIN_EMAIL = process.env.VITE_DEMO_ADMIN_EMAIL ?? "admin@reactiveweb.dev";
const ADMIN_PASSWORD = requireVisualEnv("AUTH_DEMO_PASSWORD");

setup("authenticate admin session", async ({ page }) => {
  await gotoStableRoute(page, "/auth");

  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/auth\?status=signed-in/);

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
