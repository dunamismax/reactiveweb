import { expect, type Locator, type Page } from "@playwright/test";

export async function gotoStableRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForLoadState("networkidle");
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition-duration: 0s !important;
        animation-duration: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `,
  });

  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

export async function expectRouteScreenshot(
  page: Page,
  name: string,
  options?: {
    mask?: Locator[];
  },
) {
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    scale: "css",
    mask: options?.mask,
  });
}
