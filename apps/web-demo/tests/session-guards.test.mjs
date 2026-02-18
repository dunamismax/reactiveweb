import { beforeEach, describe, expect, it, mock } from "bun:test";

const authServer = {
  authHandler: mock(),
  forwardSignIn: mock(),
  forwardSignOut: mock(),
  getAuthSession: mock(),
};

const db = {
  createDemoUser: mock(),
  ensureDemoWorkspaceSeed: mock(async () => null),
  fillMissingDemoUserPasswordHashes: mock(async () => 0),
  getDemoUserByEmail: mock(),
  getDemoUserById: mock(),
  getDemoUserCount: mock(async () => 0),
  insertDemoAuditLog: mock(async () => null),
  listDemoUsers: mock(async () => []),
  listRecentDemoActivity: mock(async () => []),
  markDemoUserSeen: mock(),
  updateDemoUserRole: mock(),
  updateDemoUserStatus: mock(),
};

mock.module("~/lib/auth.server", () => authServer);
mock.module("@reactiveweb/db", () => db);
mock.module("~/lib/env.server", () => ({
  demoServerEnv: {
    AUTH_DEMO_PASSWORD: "demo-pass-123",
    VITE_DEMO_ADMIN_EMAIL: "admin@reactiveweb.dev",
  },
}));

const demoState = await import("../app/lib/demo-state.server");

describe("requireAuthSession", () => {
  beforeEach(() => {
    authServer.getAuthSession.mockReset();
    db.getDemoUserById.mockReset();
  });

  it("redirects to /auth when no session exists", async () => {
    authServer.getAuthSession.mockResolvedValue(null);

    try {
      await demoState.requireAuthSession(new Request("http://localhost/users"));
      throw new Error("Expected redirect response");
    } catch (error) {
      expect(error).toMatchObject({ status: 302 });
      expect(error.headers.get("location")).toBe("/auth");
    }
  });

  it("throws typed unauthorized when session user no longer exists", async () => {
    authServer.getAuthSession.mockResolvedValue({ user: { id: "u-1" } });
    db.getDemoUserById.mockResolvedValue(null);

    const run = demoState.requireAuthSession(new Request("http://localhost/users"));
    await expect(run).rejects.toMatchObject({ status: 401 });
  });

  it("redirects revoked users to auth error status", async () => {
    authServer.getAuthSession.mockResolvedValue({ user: { id: "u-1" } });
    db.getDemoUserById.mockResolvedValue({
      id: "u-1",
      name: "Revoked User",
      role: "viewer",
      active: false,
    });

    try {
      await demoState.requireAuthSession(new Request("http://localhost/users"));
      throw new Error("Expected redirect response");
    } catch (error) {
      expect(error).toMatchObject({ status: 302 });
      expect(error.headers.get("location")).toBe("/auth?error=session-revoked");
    }
  });

  it("returns typed active session payload", async () => {
    authServer.getAuthSession.mockResolvedValue({ user: { id: "u-1" } });
    db.getDemoUserById.mockResolvedValue({
      id: "u-1",
      name: "Owner User",
      role: "owner",
      active: true,
    });

    const session = await demoState.requireAuthSession(new Request("http://localhost/users"));
    expect(session).toEqual({
      user: {
        id: "u-1",
        name: "Owner User",
        role: "owner",
      },
    });
  });
});
