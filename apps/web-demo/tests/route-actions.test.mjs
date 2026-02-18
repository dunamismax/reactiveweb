import { beforeEach, describe, expect, it, vi } from "vitest";

const { VALID_ACTOR_ID, db, demoState, authServer } = vi.hoisted(() => {
  const VALID_ACTOR_ID = "79f0e8e6-4603-4711-bdb8-22af87ce756d";

  return {
    VALID_ACTOR_ID,
    db: {
      createDemoInvite: vi.fn(),
      getDemoUserByEmail: vi.fn(),
      getDemoUserById: vi.fn(),
      listDemoUsers: vi.fn(),
      markDemoUserSeen: vi.fn(),
      updateDemoUserRole: vi.fn(),
      updateDemoUserStatus: vi.fn(),
    },
    demoState: {
      ensureDemoSeeded: vi.fn(async () => null),
      mapDbUserToDemoUser: (user) => user,
      nextRole: (role) => (role === "viewer" ? "editor" : "viewer"),
      recordAuditEvent: vi.fn(async () => null),
      requireAuthSession: vi.fn(async () => ({
        user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
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
  VITE_DEMO_ADMIN_EMAIL: "admin@reactiveweb.dev",
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
    db.createDemoInvite.mockReset();
    db.getDemoUserById.mockReset();
    db.updateDemoUserRole.mockReset();
    db.updateDemoUserStatus.mockReset();
    demoState.recordAuditEvent.mockReset();
    demoState.requireAuthSession.mockReset();

    demoState.requireAuthSession.mockResolvedValue({
      user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
    });
  });

  it("generates an invite link for inviteUser intent", async () => {
    db.createDemoInvite.mockResolvedValue({
      id: "i-1",
      email: "new@reactiveweb.dev",
      role: "viewer",
      token: "invite-token",
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "inviteUser",
        email: "new@reactiveweb.dev",
        role: "viewer",
      }),
    });

    expect(response.ok).toBe(true);
    expect(response.intent).toBe("inviteUser");
    expect(response.inviteUrl).toContain("/invite/");
    expect(db.createDemoInvite).toHaveBeenCalledTimes(1);
    expect(db.createDemoInvite.mock.calls[0][0]).toMatchObject({
      email: "new@reactiveweb.dev",
      role: "viewer",
    });
    expect(typeof db.createDemoInvite.mock.calls[0][0].token).toBe("string");
  });

  it("rejects invite creation for non-owner/admin roles", async () => {
    demoState.requireAuthSession.mockResolvedValue({
      user: { id: "viewer-1", name: "Viewer", role: "viewer" },
    });

    const run = usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "inviteUser",
        email: "new@reactiveweb.dev",
        role: "viewer",
      }),
    });

    await expect(run).rejects.toMatchObject({ status: 403 });
    expect(db.createDemoInvite).not.toHaveBeenCalled();
  });

  it("allows admin invites for viewer/editor roles", async () => {
    demoState.requireAuthSession.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", role: "admin" },
    });
    db.createDemoInvite.mockResolvedValue({
      id: "i-1",
      email: "new@reactiveweb.dev",
      role: "viewer",
      token: "invite-token",
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    for (const role of ["viewer", "editor"]) {
      const response = await usersRoute.action({
        request: buildPostRequest("/users", {
          intent: "inviteUser",
          email: `new-${role}@reactiveweb.dev`,
          role,
        }),
      });
      expect(response.ok).toBe(true);
    }
  });

  it("blocks admin invites for owner/admin roles", async () => {
    demoState.requireAuthSession.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", role: "admin" },
    });

    for (const role of ["owner", "admin"]) {
      const run = usersRoute.action({
        request: buildPostRequest("/users", {
          intent: "inviteUser",
          email: `new-${role}@reactiveweb.dev`,
          role,
        }),
      });
      await expect(run).rejects.toMatchObject({ status: 403 });
    }
    expect(db.createDemoInvite).not.toHaveBeenCalled();
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
      email: "owner@reactiveweb.dev",
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
        intent: "inviteUser",
        email: "nope@x.dev",
        role: "viewer",
      }),
    });

    await expect(run).rejects.toMatchObject({ status: 302 });
  });
});

describe("auth action", () => {
  beforeEach(() => {
    authServer.forwardSignIn.mockReset();
    authServer.forwardSignOut.mockReset();
    authServer.forwardSignIn.mockResolvedValue(new Response(null, { status: 302 }));
    authServer.forwardSignOut.mockResolvedValue(new Response(null, { status: 302 }));
  });

  it("returns typed bad request for invalid payload", async () => {
    const response = await authRoute.action({
      request: buildPostRequest("/auth", { intent: "signIn", email: "bad", password: "short" }),
    });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe("BAD_REQUEST");
  });

  it("forwards sign-in with sanitized callback", async () => {
    await authRoute.action({
      request: buildPostRequest("/auth", {
        intent: "signIn",
        email: "owner@reactiveweb.dev",
        password: "demo-pass-123",
        callbackUrl: "https://evil.example.com",
      }),
    });

    expect(authServer.forwardSignIn).toHaveBeenCalledTimes(1);
    const call = authServer.forwardSignIn.mock.calls[0];
    expect(call[1]).toBe("owner@reactiveweb.dev");
    expect(call[2]).toBe("demo-pass-123");
    expect(call[3]).toBe("/auth?status=signed-in");
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
