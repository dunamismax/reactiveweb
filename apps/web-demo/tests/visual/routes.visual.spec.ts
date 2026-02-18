import { test } from "@playwright/test";
import { VISUAL_INVITE_TOKEN } from "./constants";
import { expectRouteScreenshot, gotoStableRoute } from "./helpers";

test.describe("web-demo visual routes", () => {
  test("dashboard route", async ({ page }) => {
    await gotoStableRoute(page, "/dashboard");
    await expectRouteScreenshot(page, "dashboard.png", {
      mask: [page.getByRole("heading", { level: 2 })],
    });
  });

  test("users route", async ({ page }) => {
    await gotoStableRoute(page, "/users");

    await expectRouteScreenshot(page, "users.png", {
      mask: [
        page.locator("table tbody tr td:nth-child(5)"),
        page.locator("table tbody tr td:nth-child(6)"),
      ],
    });
  });

  test("activity route", async ({ page }) => {
    await gotoStableRoute(page, "/activity?q=__visual_no_results__");
    await expectRouteScreenshot(page, "activity.png");
  });

  test("settings route", async ({ page }) => {
    await gotoStableRoute(page, "/settings");

    await expectRouteScreenshot(page, "settings.png", {
      mask: [
        page.locator("dt", { hasText: "Last Seen" }).locator("xpath=following-sibling::dd[1]"),
      ],
    });
  });

  test("invite token route", async ({ page }) => {
    await gotoStableRoute(page, `/invite/${VISUAL_INVITE_TOKEN}`);
    await expectRouteScreenshot(page, "invite-token.png");
  });
});
