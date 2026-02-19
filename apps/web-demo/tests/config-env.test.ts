import { parseDemoEnv, parseDemoServerEnv } from "@reactiveweb/config";
import { describe, expect, it } from "vitest";

describe("demo env parsing", () => {
  it("maps false-like string values to false", () => {
    expect(parseDemoEnv({ VITE_ENABLE_AUTH_DEMO: "false" }).VITE_ENABLE_AUTH_DEMO).toBe(false);
    expect(parseDemoEnv({ VITE_ENABLE_AUTH_DEMO: "0" }).VITE_ENABLE_AUTH_DEMO).toBe(false);
  });

  it("maps true-like string values to true", () => {
    expect(parseDemoEnv({ VITE_ENABLE_AUTH_DEMO: "true" }).VITE_ENABLE_AUTH_DEMO).toBe(true);
    expect(parseDemoEnv({ VITE_ENABLE_AUTH_DEMO: "1" }).VITE_ENABLE_AUTH_DEMO).toBe(true);
  });

  it("keeps defaults when optional values are missing", () => {
    const parsed = parseDemoEnv({});
    expect(parsed.VITE_ENABLE_AUTH_DEMO).toBe(true);
    expect(parsed.VITE_DEMO_OWNER_USERNAME).toBe("owner");
  });

  it("normalizes owner username to lowercase", () => {
    const parsed = parseDemoEnv({ VITE_DEMO_OWNER_USERNAME: "OwNeR.01" });
    expect(parsed.VITE_DEMO_OWNER_USERNAME).toBe("owner.01");
  });

  it("parses server env with owner username", () => {
    const parsed = parseDemoServerEnv({
      DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
      AUTH_SECRET: "replace-with-16+-char-secret",
      AUTH_DEMO_PASSWORD: "demo-pass-123",
      VITE_DEMO_OWNER_USERNAME: "Owner",
    });

    expect(parsed.VITE_DEMO_OWNER_USERNAME).toBe("owner");
    expect(parsed.AUTH_MAX_FAILED_SIGNIN_ATTEMPTS).toBe(5);
    expect(parsed.AUTH_LOCKOUT_DURATION_MINUTES).toBe(15);
  });

  it("parses lockout knobs from numeric strings", () => {
    const parsed = parseDemoServerEnv({
      DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
      AUTH_SECRET: "replace-with-16+-char-secret",
      AUTH_DEMO_PASSWORD: "demo-pass-123",
      AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: "7",
      AUTH_LOCKOUT_DURATION_MINUTES: "30",
      VITE_DEMO_OWNER_USERNAME: "owner",
    });

    expect(parsed.AUTH_MAX_FAILED_SIGNIN_ATTEMPTS).toBe(7);
    expect(parsed.AUTH_LOCKOUT_DURATION_MINUTES).toBe(30);
  });

  it("rejects invalid owner usernames", () => {
    expect(() => parseDemoEnv({ VITE_DEMO_OWNER_USERNAME: "invalid space" })).toThrow();
  });
});
