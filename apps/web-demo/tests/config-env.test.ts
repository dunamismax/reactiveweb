import { parseDemoEnv, parseDemoServerEnv } from "@reactiveweb/config";
import { describe, expect, it } from "vitest";

describe("config env parsing", () => {
  it("normalizes Nuxt public env values into client config", () => {
    const env = parseDemoEnv({
      NODE_ENV: "development",
      NUXT_PUBLIC_APP_NAME: "Demo Surface",
      NUXT_PUBLIC_ENABLE_AUTH_DEMO: "true",
      NUXT_PUBLIC_DEMO_OWNER_USERNAME: "Owner-User",
    });

    expect(env.APP_NAME).toBe("Demo Surface");
    expect(env.ENABLE_AUTH_DEMO).toBe(true);
    expect(env.OWNER_USERNAME).toBe("owner-user");
  });

  it("prefers explicit server owner usernames and keeps legacy aliases as fallback", () => {
    const explicit = parseDemoServerEnv({
      NODE_ENV: "development",
      DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
      AUTH_SECRET: "reactiveweb-secret-1234",
      AUTH_DEMO_PASSWORD: "abc12345",
      DEMO_OWNER_USERNAME: "PrimaryOwner",
      NUXT_PUBLIC_DEMO_OWNER_USERNAME: "NuxtOwner",
      VITE_DEMO_OWNER_USERNAME: "LegacyOwner",
    });

    expect(explicit.OWNER_USERNAME).toBe("primaryowner");

    const legacy = parseDemoServerEnv({
      NODE_ENV: "development",
      DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
      AUTH_SECRET: "reactiveweb-secret-1234",
      AUTH_DEMO_PASSWORD: "abc12345",
      VITE_DEMO_OWNER_USERNAME: "LegacyOwner",
    });

    expect(legacy.OWNER_USERNAME).toBe("legacyowner");
  });
});
