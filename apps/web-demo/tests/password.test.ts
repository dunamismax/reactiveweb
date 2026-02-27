import { describe, expect, it } from "vitest";

import { hashBootstrapPassword, hashPassword, verifyPassword } from "../server/utils/password";

describe("password", () => {
  it("hashes and verifies random password hashes", () => {
    const hash = hashPassword("abc12345");
    expect(verifyPassword("abc12345", hash)).toBe(true);
    expect(verifyPassword("wrong-value", hash)).toBe(false);
  });

  it("uses deterministic bootstrap hash", () => {
    const first = hashBootstrapPassword("seed-secret-01");
    const second = hashBootstrapPassword("seed-secret-01");
    expect(first).toBe(second);
  });
});
