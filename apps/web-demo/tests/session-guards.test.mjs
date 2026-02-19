import { beforeEach, describe, expect, it, vi } from "vitest";

const { authServer, db } = vi.hoisted(() => ({
  authServer: {
    authHandler: vi.fn(),
    forwardSignIn: vi.fn(),
    forwardSignOut: vi.fn(),
    getAuthSession: vi.fn(),
  },
  db: {
    createDemoUser: vi.fn(),
    ensureDemoWorkspaceSeed: vi.fn(async () => null),
    fillMissingDemoUserPasswordHashes: vi.fn(async () => 0),
    getDemoUserById: vi.fn(),
    getDemoUserCount: vi.fn(async () => 0),
    getDemoUserByUsername: vi.fn(),
    insertDemoAuditLog: vi.fn(async () => null),
    listDemoUsers: vi.fn(async () => []),
    listRecentDemoActivity: vi.fn(async () => []),
    markDemoUserSeen: vi.fn(),
    updateDemoUserPassword: vi.fn(),
    updateDemoUserRole: vi.fn(),
    updateDemoUserStatus: vi.fn(),
  },
}));

const mockDemoServerEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
  AUTH_SECRET: "replace-with-16+-char-secret",
  AUTH_DEMO_PASSWORD: "demo-pass-123",
  VITE_DEMO_OWNER_USERNAME: "owner",
};

vi.mock("~/lib/auth.server", () => authServer);
vi.mock("../app/lib/auth.server", () => authServer);
vi.mock("../app/lib/auth.server.ts", () => authServer);
vi.mock("@reactiveweb/db", () => db);
vi.mock("~/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));
vi.mock("../app/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));
vi.mock("../app/lib/env.server.ts", () => ({ demoServerEnv: mockDemoServerEnv }));

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
      username: "revoked-user",
      role: "viewer",
      active: false,
      mustChangePassword: false,
    });

    try {
      await demoState.requireAuthSession(new Request("http://localhost/users"));
      throw new Error("Expected redirect response");
    } catch (error) {
      expect(error).toMatchObject({ status: 302 });
      expect(error.headers.get("location")).toBe("/auth?error=session-revoked");
    }
  });

  it("redirects users with mustChangePassword to /settings", async () => {
    authServer.getAuthSession.mockResolvedValue({ user: { id: "u-1" } });
    db.getDemoUserById.mockResolvedValue({
      id: "u-1",
      name: "Owner User",
      username: "owner",
      role: "owner",
      active: true,
      mustChangePassword: true,
    });

    try {
      await demoState.requireAuthSession(new Request("http://localhost/users"));
      throw new Error("Expected redirect response");
    } catch (error) {
      expect(error).toMatchObject({ status: 302 });
      expect(error.headers.get("location")).toBe("/settings?required=password-change");
    }
  });

  it("allows settings route when password rotation is required", async () => {
    authServer.getAuthSession.mockResolvedValue({ user: { id: "u-1" } });
    db.getDemoUserById.mockResolvedValue({
      id: "u-1",
      name: "Owner User",
      username: "owner",
      role: "owner",
      active: true,
      mustChangePassword: true,
    });

    const session = await demoState.requireAuthSession(new Request("http://localhost/settings"));
    expect(session).toEqual({
      user: {
        id: "u-1",
        name: "Owner User",
        username: "owner",
        role: "owner",
        mustChangePassword: true,
      },
    });
  });

  it("returns typed active session payload", async () => {
    authServer.getAuthSession.mockResolvedValue({ user: { id: "u-1" } });
    db.getDemoUserById.mockResolvedValue({
      id: "u-1",
      name: "Owner User",
      username: "owner",
      role: "owner",
      active: true,
      mustChangePassword: false,
    });

    const session = await demoState.requireAuthSession(new Request("http://localhost/users"));
    expect(session).toEqual({
      user: {
        id: "u-1",
        name: "Owner User",
        username: "owner",
        role: "owner",
        mustChangePassword: false,
      },
    });
  });
});
