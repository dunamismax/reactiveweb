import { describe, expect, it } from "vitest";

import { sanitizeCallbackPath } from "../app/lib/auth-config";

describe("sanitizeCallbackPath", () => {
  it("allows in-app callback paths", () => {
    expect(sanitizeCallbackPath("/auth?status=signed-in", "/auth")).toBe("/auth?status=signed-in");
  });

  it("rejects absolute callback URLs", () => {
    expect(sanitizeCallbackPath("https://evil.example.com/pwn", "/auth")).toBe("/auth");
  });

  it("rejects invalid callback payloads", () => {
    expect(sanitizeCallbackPath(null, "/auth")).toBe("/auth");
    expect(sanitizeCallbackPath("javascript:alert(1)", "/auth")).toBe("/auth");
  });
});
