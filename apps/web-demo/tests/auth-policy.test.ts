import { describe, expect, it } from "vitest";

import {
  AUTH_PASSWORD_POLICY_MESSAGE,
  AUTH_USERNAME_POLICY_MESSAGE,
  getPasswordPolicyError,
  normalizeUsername,
} from "../server/utils/auth-policy";

describe("auth-policy", () => {
  it("normalizes username values", () => {
    expect(normalizeUsername("  Owner.User  ")).toBe("owner.user");
  });

  it("enforces password policy", () => {
    expect(getPasswordPolicyError("password-only")).toBe(AUTH_PASSWORD_POLICY_MESSAGE);
    expect(getPasswordPolicyError("abc12345")).toBeNull();
  });

  it("keeps policy constants stable", () => {
    expect(AUTH_USERNAME_POLICY_MESSAGE.length).toBeGreaterThan(10);
  });
});
