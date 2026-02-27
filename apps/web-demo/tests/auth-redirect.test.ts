import { describe, expect, it } from "vitest";

import { getSafeAuthRedirectTarget } from "../utils/auth-redirect";

describe("auth redirect target", () => {
  it("accepts relative in-app destinations", () => {
    expect(getSafeAuthRedirectTarget("/users?page=2#activity")).toBe("/users?page=2#activity");
  });

  it("falls back for external or malformed targets", () => {
    expect(getSafeAuthRedirectTarget("https://example.com/pwn")).toBe("/");
    expect(getSafeAuthRedirectTarget("//example.com/pwn")).toBe("/");
    expect(getSafeAuthRedirectTarget("javascript:alert(1)")).toBe("/");
  });

  it("never redirects back into auth routes", () => {
    expect(getSafeAuthRedirectTarget("/auth")).toBe("/");
    expect(getSafeAuthRedirectTarget("/auth?next=/users")).toBe("/");
  });
});
