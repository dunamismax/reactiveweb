import { describe, expect, it } from "vitest";

import { assertCanCreateUser, assertCanMutateUser } from "../server/utils/authorization";

describe("authorization", () => {
  it("allows owners to create admin users", () => {
    expect(() => assertCanCreateUser({ id: "owner-1", role: "owner" }, "admin")).not.toThrow();
  });

  it("blocks admins from creating owner or admin users", () => {
    expect(() => assertCanCreateUser({ id: "admin-1", role: "admin" }, "owner")).toThrow(
      /cannot create owner\/admin users/i,
    );
    expect(() => assertCanCreateUser({ id: "admin-1", role: "admin" }, "admin")).toThrow(
      /cannot create owner\/admin users/i,
    );
  });

  it("blocks non-admin roles from creating users", () => {
    expect(() => assertCanCreateUser({ id: "viewer-1", role: "viewer" }, "viewer")).toThrow(
      /only owner\/admin accounts can create users/i,
    );
  });

  it("prevents users from mutating their own role or status", () => {
    expect(() =>
      assertCanMutateUser(
        { id: "user-1", role: "owner" },
        { id: "user-1", role: "viewer" },
        "cycleRole",
      ),
    ).toThrow(/cannot change your own role/i);

    expect(() =>
      assertCanMutateUser(
        { id: "user-1", role: "owner" },
        { id: "user-1", role: "viewer" },
        "toggleStatus",
      ),
    ).toThrow(/cannot change your own status/i);
  });

  it("blocks admins from mutating owner or admin accounts", () => {
    expect(() =>
      assertCanMutateUser(
        { id: "admin-1", role: "admin" },
        { id: "owner-1", role: "owner" },
        "resetPassword",
      ),
    ).toThrow(/cannot modify owner\/admin users/i);

    expect(() =>
      assertCanMutateUser(
        { id: "admin-1", role: "admin" },
        { id: "admin-2", role: "admin" },
        "toggleStatus",
      ),
    ).toThrow(/cannot modify owner\/admin users/i);
  });
});
