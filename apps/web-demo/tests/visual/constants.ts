export const VISUAL_INVITE_TOKEN = "pw-visual-invite-token";
export const VISUAL_INVITE_EMAIL = "playwright.visual@reactiveweb.dev";
export const VISUAL_INVITE_ROLE = "viewer";

export const VISUAL_TEST_BASE_URL = "http://127.0.0.1:4173";
export const AUTH_STATE_PATH = "tests/visual/.auth/user.json";

export function requireVisualEnv(name: "AUTH_DEMO_PASSWORD") {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} must be set for visual regression tests.`);
  }

  return value;
}
