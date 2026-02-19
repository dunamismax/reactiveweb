import { beforeEach, describe, expect, it, vi } from "vitest";

const { VALID_ACTOR_ID, db, demoState, authServer } = vi.hoisted(() => {
  const VALID_ACTOR_ID = "79f0e8e6-4603-4711-bdb8-22af87ce756d";

  return {
    VALID_ACTOR_ID,
    db: {
      createDemoUser: vi.fn(),
      getDemoUserById: vi.fn(),
      getDemoUserByUsername: vi.fn(),
      listDemoUsers: vi.fn(),
      markDemoUserSeen: vi.fn(),
      updateDemoUserPassword: vi.fn(),
      updateDemoUserRole: vi.fn(),
      updateDemoUserStatus: vi.fn(),
    },
    demoState: {
      ensureDemoSeeded: vi.fn(async () => null),
      mapDbUserToDemoUser: (user) => user,
      nextRole: (role) => (role === "viewer" ? "editor" : "viewer"),
      recordAuditEvent: vi.fn(async () => null),
      requireAuthSession: vi.fn(async () => ({
        user: {
          id: VALID_ACTOR_ID,
          name: "Owner",
          username: "owner",
          role: "owner",
          mustChangePassword: false,
        },
      })),
    },
    authServer: {
      forwardSignIn: vi.fn(),
      forwardSignOut: vi.fn(),
      getAuthSession: vi.fn(),
      authHandler: vi.fn(),
    },
  };
});

const mockDemoServerEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
  AUTH_SECRET: "replace-with-16+-char-secret",
  AUTH_DEMO_PASSWORD: "demo-pass-123",
  VITE_DEMO_OWNER_USERNAME: "owner",
};

vi.mock("@reactiveweb/db", () => db);
vi.mock("~/lib/demo-state.server", () => demoState);
vi.mock("../app/lib/demo-state.server", () => demoState);
vi.mock("../app/lib/demo-state.server.ts", () => demoState);
vi.mock("~/lib/auth.server", () => authServer);
vi.mock("../app/lib/auth.server", () => authServer);
vi.mock("../app/lib/auth.server.ts", () => authServer);
vi.mock("~/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));
vi.mock("../app/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));
vi.mock("../app/lib/env.server.ts", () => ({ demoServerEnv: mockDemoServerEnv }));

const usersRoute = await import("../app/routes/users.tsx");
const userDetailRoute = await import("../app/routes/user-detail.tsx");
const authRoute = await import("../app/routes/auth.tsx");

function buildPostRequest(pathname, fields) {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    body: new URLSearchParams(fields),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
}

describe("users action", () => {
  beforeEach(() => {
    db.createDemoUser.mockReset();
    db.getDemoUserById.mockReset();
    db.updateDemoUserRole.mockReset();
    db.updateDemoUserStatus.mockReset();
    demoState.recordAuditEvent.mockReset();
    demoState.requireAuthSession.mockReset();

    demoState.requireAuthSession.mockResolvedValue({
      user: {
        id: VALID_ACTOR_ID,
        name: "Owner",
        username: "owner",
        role: "owner",
        mustChangePassword: false,
      },
    });
  });

  it("creates a user for createUser intent", async () => {
    db.createDemoUser.mockResolvedValue({
      id: "u-2",
      username: "new-user",
      role: "viewer",
      active: true,
      mustChangePassword: true,
    });

    const response = await usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "createUser",
        name: "New User",
        username: "new-user",
        role: "viewer",
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    });

    expect(response.ok).toBe(true);
    expect(response.intent).toBe("createUser");
    expect(db.createDemoUser).toHaveBeenCalledTimes(1);
    expect(db.createDemoUser.mock.calls[0][0]).toMatchObject({
      name: "New User",
      username: "new-user",
      role: "viewer",
      mustChangePassword: true,
    });
  });

  it("rejects user creation for non-owner/admin roles", async () => {
    demoState.requireAuthSession.mockResolvedValue({
      user: {
        id: "viewer-1",
        name: "Viewer",
        username: "viewer",
        role: "viewer",
        mustChangePassword: false,
      },
    });

    const run = usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "createUser",
        name: "New User",
        username: "new-user",
        role: "viewer",
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    });

    await expect(run).rejects.toMatchObject({ status: 403 });
    expect(db.createDemoUser).not.toHaveBeenCalled();
  });

  it("returns not found when cycleRole target is missing", async () => {
    db.getDemoUserById.mockResolvedValue(null);

    const response = await usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "cycleRole",
        userId: "f458c2b1-4ea4-4342-8192-9a3624fbc2f2",
      }),
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe("NOT_FOUND");
  });

  it("rejects self status changes", async () => {
    db.getDemoUserById.mockResolvedValue({
      id: VALID_ACTOR_ID,
      role: "owner",
      username: "owner",
      active: true,
    });

    const run = usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "toggleStatus",
        userId: VALID_ACTOR_ID,
      }),
    });

    await expect(run).rejects.toMatchObject({ status: 403 });
  });

  it("propagates auth guard redirects", async () => {
    demoState.requireAuthSession.mockRejectedValue(
      new Response(null, {
        status: 302,
        headers: { location: "/auth" },
      }),
    );

    const run = usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "createUser",
        name: "Blocked",
        username: "blocked",
        role: "viewer",
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    });

    await expect(run).rejects.toMatchObject({ status: 302 });
  });
});

describe("user detail action", () => {
  beforeEach(() => {
    db.getDemoUserById.mockReset();
    db.updateDemoUserPassword.mockReset();
    demoState.recordAuditEvent.mockReset();
    demoState.requireAuthSession.mockReset();

    demoState.requireAuthSession.mockResolvedValue({
      user: {
        id: VALID_ACTOR_ID,
        name: "Owner",
        username: "owner",
        role: "owner",
        mustChangePassword: false,
      },
    });
  });

  it("resets a target user password and requires rotation", async () => {
    const targetId = "0b98020a-2190-486c-a376-bd8fbbf5aa22";
    db.getDemoUserById.mockResolvedValue({
      id: targetId,
      role: "viewer",
      username: "target-user",
      active: true,
    });
    db.updateDemoUserPassword.mockResolvedValue({ id: targetId, mustChangePassword: true });

    const response = await userDetailRoute.action({
      request: buildPostRequest("/users/u-2", {
        intent: "resetPassword",
        userId: targetId,
        newPassword: "reset-pass-123",
        confirmPassword: "reset-pass-123",
      }),
    });

    expect(response.ok).toBe(true);
    expect(db.updateDemoUserPassword).toHaveBeenCalledTimes(1);
    expect(db.updateDemoUserPassword).toHaveBeenCalledWith({
      userId: targetId,
      passwordHash: expect.any(String),
      mustChangePassword: true,
    });
  });

  it("rejects self password reset from user-detail action", async () => {
    db.getDemoUserById.mockResolvedValue({
      id: VALID_ACTOR_ID,
      role: "owner",
      username: "owner",
      active: true,
    });

    const run = userDetailRoute.action({
      request: buildPostRequest("/users/owner", {
        intent: "resetPassword",
        userId: VALID_ACTOR_ID,
        newPassword: "reset-pass-123",
        confirmPassword: "reset-pass-123",
      }),
    });

    await expect(run).rejects.toMatchObject({ status: 403 });
  });
});

describe("auth action", () => {
  beforeEach(() => {
    authServer.forwardSignIn.mockReset();
    authServer.forwardSignOut.mockReset();
    db.getDemoUserByUsername.mockReset();
    db.createDemoUser.mockReset();
    demoState.recordAuditEvent.mockReset();

    authServer.forwardSignIn.mockResolvedValue(new Response(null, { status: 302 }));
    authServer.forwardSignOut.mockResolvedValue(new Response(null, { status: 302 }));
  });

  it("returns typed bad request for invalid sign-in payload", async () => {
    const response = await authRoute.action({
      request: buildPostRequest("/auth", { intent: "signIn", username: "x", password: "short" }),
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe("BAD_REQUEST");
  });

  it("forwards sign-in with sanitized callback", async () => {
    await authRoute.action({
      request: buildPostRequest("/auth", {
        intent: "signIn",
        username: "owner",
        password: "demo-pass-123",
        callbackUrl: "https://evil.example.com",
      }),
    });

    expect(authServer.forwardSignIn).toHaveBeenCalledTimes(1);
    const call = authServer.forwardSignIn.mock.calls[0];
    expect(call[1]).toBe("owner");
    expect(call[2]).toBe("demo-pass-123");
    expect(call[3]).toBe("/auth?status=signed-in");
  });

  it("creates a self-signup account", async () => {
    db.getDemoUserByUsername.mockResolvedValue(null);
    db.createDemoUser.mockResolvedValue({
      id: "u-3",
      username: "new-user",
      role: "viewer",
      active: true,
      mustChangePassword: false,
    });

    const response = await authRoute.action({
      request: buildPostRequest("/auth", {
        intent: "signUp",
        username: "new-user",
        name: "New User",
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    });

    expect(response.ok).toBe(true);
    expect(response.intent).toBe("signUp");
    expect(db.createDemoUser).toHaveBeenCalledTimes(1);
    expect(demoState.recordAuditEvent).toHaveBeenCalledTimes(1);
  });

  it("rejects self-signup when username already exists", async () => {
    db.getDemoUserByUsername.mockResolvedValue({
      id: "u-existing",
      username: "existing-user",
      role: "viewer",
      active: true,
    });

    const response = await authRoute.action({
      request: buildPostRequest("/auth", {
        intent: "signUp",
        username: "existing-user",
        name: "Existing User",
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe("BAD_REQUEST");
    expect(db.createDemoUser).not.toHaveBeenCalled();
  });

  it("forwards sign-out", async () => {
    await authRoute.action({
      request: buildPostRequest("/auth", {
        intent: "signOut",
        callbackUrl: "https://evil.example.com/logout",
      }),
    });

    expect(authServer.forwardSignOut).toHaveBeenCalledTimes(1);
    const call = authServer.forwardSignOut.mock.calls[0];
    expect(call[1]).toBe("/auth?status=signed-out");
  });
});
