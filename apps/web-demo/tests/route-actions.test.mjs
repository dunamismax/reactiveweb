import { beforeEach, describe, expect, it, mock } from "bun:test";

const VALID_ACTOR_ID = "79f0e8e6-4603-4711-bdb8-22af87ce756d";

const db = {
  createDemoUser: mock(),
  getDemoUserById: mock(),
  listDemoUsers: mock(),
  updateDemoUserRole: mock(),
  updateDemoUserStatus: mock(),
};

const demoState = {
  ensureDemoSeeded: mock(async () => null),
  mapDbUserToDemoUser: (user) => user,
  nextRole: (role) => (role === "viewer" ? "editor" : "viewer"),
  recordAuditEvent: mock(async () => null),
  requireAuthSession: mock(async () => ({
    user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
  })),
};

const authServer = {
  forwardSignIn: mock(),
  forwardSignOut: mock(),
  getAuthSession: mock(),
};

mock.module("@reactiveweb/db", () => db);
mock.module("~/lib/demo-state.server", () => demoState);
mock.module("~/lib/auth.server", () => authServer);
mock.module("~/lib/env.server", () => ({
  demoServerEnv: {
    AUTH_DEMO_PASSWORD: "demo-pass-123",
    VITE_DEMO_ADMIN_EMAIL: "admin@reactiveweb.dev",
  },
}));

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
    db.createDemoUser.mockReset();
    db.getDemoUserById.mockReset();
    db.updateDemoUserRole.mockReset();
    db.updateDemoUserStatus.mockReset();
    demoState.recordAuditEvent.mockReset();
    demoState.requireAuthSession.mockReset();

    demoState.requireAuthSession.mockResolvedValue({
      user: { id: VALID_ACTOR_ID, name: "Owner", role: "owner" },
    });
  });

  it("creates a user for createUser intent", async () => {
    db.createDemoUser.mockResolvedValue({ id: "u-1", email: "new@reactiveweb.dev" });

    const response = await usersRoute.action({
      request: buildPostRequest("/users", {
        intent: "createUser",
        name: "New User",
        email: "new@reactiveweb.dev",
        role: "viewer",
      }),
    });

    expect(response.ok).toBe(true);
    expect(response.intent).toBe("createUser");
    expect(db.createDemoUser).toHaveBeenCalledTimes(1);
    expect(db.createDemoUser.mock.calls[0][0]).toMatchObject({
      email: "new@reactiveweb.dev",
      role: "viewer",
    });
    expect(db.createDemoUser.mock.calls[0][0].passwordHash).toBeString();
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
        intent: "createUser",
        name: "Nope",
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
