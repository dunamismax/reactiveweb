import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashPassword } from "../app/lib/password.server";

const { VALID_ACTOR_ID, db, demoState } = vi.hoisted(() => {
  const VALID_ACTOR_ID = "79f0e8e6-4603-4711-bdb8-22af87ce756d";

  return {
    VALID_ACTOR_ID,
    db: {
      getDemoUserById: vi.fn(),
      updateDemoUserName: vi.fn(),
      updateDemoUserPassword: vi.fn(),
    },
    demoState: {
      recordAuditEvent: vi.fn(async () => null),
      requireAuthSession: vi.fn(async () => ({
        user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
      })),
    },
  };
});

vi.mock("@reactiveweb/db", () => db);
vi.mock("~/lib/demo-state.server", () => demoState);

const settingsRoute = await import("../app/routes/settings");
type SettingsActionArgs = Parameters<typeof settingsRoute.action>[0];

function buildPostRequest(pathname: string, fields: Record<string, string>) {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    body: new URLSearchParams(fields),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
}

describe("settings action", () => {
  beforeEach(() => {
    db.getDemoUserById.mockReset();
    db.updateDemoUserName.mockReset();
    db.updateDemoUserPassword.mockReset();
    demoState.recordAuditEvent.mockReset();
    demoState.requireAuthSession.mockReset();

    demoState.requireAuthSession.mockResolvedValue({
      user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
    });
  });

  it("updates display name", async () => {
    db.getDemoUserById.mockResolvedValue({
      id: VALID_ACTOR_ID,
      email: "owner@reactiveweb.dev",
      name: "Owner",
      role: "owner",
      active: true,
      passwordHash: hashPassword("current-pass-123"),
      lastSeenAt: new Date(),
    });
    db.updateDemoUserName.mockResolvedValue({ id: VALID_ACTOR_ID });

    const response = await settingsRoute.action({
      request: buildPostRequest("/settings", {
        intent: "updateProfile",
        name: "Updated Name",
      }),
    } as unknown as SettingsActionArgs);

    expect(response.ok).toBe(true);
    expect("intent" in response).toBe(true);
    if (!("intent" in response)) {
      throw new Error("Expected success response");
    }
    expect(response.intent).toBe("updateProfile");
    expect(db.updateDemoUserName).toHaveBeenCalledTimes(1);
    expect(db.updateDemoUserName.mock.calls[0][0]).toEqual({
      userId: VALID_ACTOR_ID,
      name: "Updated Name",
    });
  });

  it("rejects invalid profile payload", async () => {
    db.getDemoUserById.mockResolvedValue({
      id: VALID_ACTOR_ID,
      email: "owner@reactiveweb.dev",
      name: "Owner",
      role: "owner",
      active: true,
      passwordHash: hashPassword("current-pass-123"),
      lastSeenAt: new Date(),
    });

    const response = await settingsRoute.action({
      request: buildPostRequest("/settings", {
        intent: "updateProfile",
        name: "A",
      }),
    } as unknown as SettingsActionArgs);

    expect(response.ok).toBe(false);
    expect("error" in response).toBe(true);
    if (!("error" in response)) {
      throw new Error("Expected error response");
    }
    expect(response.error.code).toBe("BAD_REQUEST");
  });

  it("rejects password change when current password is wrong", async () => {
    db.getDemoUserById.mockResolvedValue({
      id: VALID_ACTOR_ID,
      email: "owner@reactiveweb.dev",
      name: "Owner",
      role: "owner",
      active: true,
      passwordHash: hashPassword("current-pass-123"),
      lastSeenAt: new Date(),
    });

    const response = await settingsRoute.action({
      request: buildPostRequest("/settings", {
        intent: "changePassword",
        currentPassword: "wrong-pass-123",
        newPassword: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    } as unknown as SettingsActionArgs);

    expect(response.ok).toBe(false);
    expect("error" in response).toBe(true);
    if (!("error" in response)) {
      throw new Error("Expected error response");
    }
    expect(response.error.code).toBe("FORBIDDEN");
  });

  it("updates password when payload is valid", async () => {
    db.getDemoUserById.mockResolvedValue({
      id: VALID_ACTOR_ID,
      email: "owner@reactiveweb.dev",
      name: "Owner",
      role: "owner",
      active: true,
      passwordHash: hashPassword("current-pass-123"),
      lastSeenAt: new Date(),
    });
    db.updateDemoUserPassword.mockResolvedValue({ id: VALID_ACTOR_ID });

    const response = await settingsRoute.action({
      request: buildPostRequest("/settings", {
        intent: "changePassword",
        currentPassword: "current-pass-123",
        newPassword: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    } as unknown as SettingsActionArgs);

    expect(response.ok).toBe(true);
    expect("intent" in response).toBe(true);
    if (!("intent" in response)) {
      throw new Error("Expected success response");
    }
    expect(response.intent).toBe("changePassword");
    expect(db.updateDemoUserPassword).toHaveBeenCalledTimes(1);
    expect(demoState.recordAuditEvent).toHaveBeenCalledTimes(1);
  });
});
