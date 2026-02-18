import { describe, expect, it } from "bun:test";

import { assertCanCreateUser, assertCanMutateUser } from "../app/lib/authorization.server";
import { hashBootstrapPassword, hashPassword, verifyPassword } from "../app/lib/password.server";

describe("password model", () => {
  it("verifies salted user hashes", () => {
    const hash = hashPassword("demo-pass-123");
    expect(verifyPassword("demo-pass-123", hash)).toBe(true);
    expect(verifyPassword("wrong-pass", hash)).toBe(false);
  });

  it("keeps bootstrap hash deterministic", () => {
    expect(hashBootstrapPassword("demo-pass-123")).toBe(hashBootstrapPassword("demo-pass-123"));
  });
});

describe("authorization policy", () => {
  it("allows owner to create owner", () => {
    expect(() => assertCanCreateUser({ id: "o-1", role: "owner" }, "owner")).not.toThrow();
  });

  it("blocks admin from creating admin", () => {
    expect(() => assertCanCreateUser({ id: "a-1", role: "admin" }, "admin")).toThrow();
  });

  it("blocks self-mutation", () => {
    expect(() =>
      assertCanMutateUser({ id: "u-1", role: "owner" }, { id: "u-1", role: "owner" }, "cycleRole"),
    ).toThrow();
  });
});
