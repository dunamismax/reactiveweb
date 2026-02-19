import { parseDemoEnv } from "@reactiveweb/config";
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

  it("keeps the default when VITE_ENABLE_AUTH_DEMO is missing", () => {
    expect(parseDemoEnv({}).VITE_ENABLE_AUTH_DEMO).toBe(true);
  });
});
