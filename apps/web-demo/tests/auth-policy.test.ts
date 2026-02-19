import { describe, expect, it } from "vitest";
import { normalizeUsername } from "../app/lib/auth-policy";
import {
  createUserInputSchema,
  passwordSchema,
  settingsActionSchema,
  signUpInputSchema,
  userDetailActionSchema,
  usernameSchema,
} from "../app/lib/models";

describe("auth username policy", () => {
  it("normalizes usernames by trimming and lowering case", () => {
    expect(normalizeUsername("  OwNeR.01  ")).toBe("owner.01");
    expect(usernameSchema.parse("  OwNeR.01  ")).toBe("owner.01");
  });

  it("rejects unsupported username characters", () => {
    const parsed = usernameSchema.safeParse("owner space");
    expect(parsed.success).toBe(false);
  });
});

describe("auth password policy", () => {
  it("requires both letters and numbers", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("alpha1234").success).toBe(true);
  });

  it("enforces shared confirmation checks across schemas", () => {
    expect(
      signUpInputSchema.safeParse({
        username: "viewer01",
        name: "Viewer 01",
        password: "alpha1234",
        confirmPassword: "alpha1235",
      }).success,
    ).toBe(false);

    expect(
      createUserInputSchema.safeParse({
        username: "viewer02",
        name: "Viewer 02",
        role: "viewer",
        password: "alpha1234",
        confirmPassword: "alpha1235",
      }).success,
    ).toBe(false);

    expect(
      settingsActionSchema.safeParse({
        intent: "changePassword",
        currentPassword: "alpha1234",
        newPassword: "beta1234",
        confirmPassword: "beta1235",
      }).success,
    ).toBe(false);

    expect(
      userDetailActionSchema.safeParse({
        intent: "resetPassword",
        userId: "1ef12c9c-8c12-4e5d-b4df-13b4a6c9d59f",
        newPassword: "gamma1234",
        confirmPassword: "gamma1235",
      }).success,
    ).toBe(false);
  });
});
