import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, demoState } = vi.hoisted(() => ({
  db: {
    consumeDemoInvite: vi.fn(),
    createDemoUser: vi.fn(),
    getDemoInviteByToken: vi.fn(),
    getDemoUserByEmail: vi.fn(),
    updateDemoUserPassword: vi.fn(),
    updateDemoUserRole: vi.fn(),
    updateDemoUserStatus: vi.fn(),
  },
  demoState: {
    recordAuditEvent: vi.fn(async () => null),
  },
}));

vi.mock("@reactiveweb/db", () => db);
vi.mock("~/lib/demo-state.server", () => demoState);

const inviteRoute = await import("../app/routes/invite.$token");
type InviteLoaderArgs = Parameters<typeof inviteRoute.loader>[0];
type InviteActionArgs = Parameters<typeof inviteRoute.action>[0];

function buildPostRequest(pathname: string, fields: Record<string, string>) {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    body: new URLSearchParams(fields),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
}

const activeInvite = {
  id: "i-1",
  email: "new@reactiveweb.dev",
  role: "viewer",
  expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  createdAt: new Date("2098-01-01T00:00:00.000Z"),
};

describe("invite token route", () => {
  beforeEach(() => {
    db.consumeDemoInvite.mockReset();
    db.createDemoUser.mockReset();
    db.getDemoInviteByToken.mockReset();
    db.getDemoUserByEmail.mockReset();
    db.updateDemoUserPassword.mockReset();
    db.updateDemoUserRole.mockReset();
    db.updateDemoUserStatus.mockReset();
    demoState.recordAuditEvent.mockReset();
  });

  it("loader returns valid invite payload when token exists and is active", async () => {
    db.getDemoInviteByToken.mockResolvedValue(activeInvite);

    const payload = await inviteRoute.loader({
      params: { token: "invite-token" },
    } as unknown as InviteLoaderArgs);

    expect(payload.valid).toBe(true);
    if (!payload.valid) {
      throw new Error("Expected valid invite payload");
    }
    expect(payload.email).toBe("new@reactiveweb.dev");
    expect(payload.role).toBe("viewer");
  });

  it("loader rejects expired tokens", async () => {
    db.getDemoInviteByToken.mockResolvedValue({
      id: "i-1",
      email: "new@reactiveweb.dev",
      role: "viewer",
      expiresAt: new Date("2000-01-01T00:00:00.000Z"),
      createdAt: new Date("1999-01-01T00:00:00.000Z"),
    });

    const payload = await inviteRoute.loader({
      params: { token: "invite-token" },
    } as unknown as InviteLoaderArgs);

    expect(payload.valid).toBe(false);
    if (payload.valid) {
      throw new Error("Expected invalid invite payload");
    }
    expect(payload.error).toContain("expired");
  });

  it("loader rejects invalid or previously used tokens", async () => {
    db.getDemoInviteByToken.mockResolvedValue(null);

    const payload = await inviteRoute.loader({
      params: { token: "invite-token" },
    } as unknown as InviteLoaderArgs);

    expect(payload.valid).toBe(false);
    if (payload.valid) {
      throw new Error("Expected invalid invite payload");
    }
    expect(payload.error).toContain("invalid");
  });

  it("action returns not found for invalid or previously used tokens", async () => {
    db.getDemoInviteByToken.mockResolvedValue(null);

    const payload = await inviteRoute.action({
      params: { token: "invite-token" },
      request: buildPostRequest("/invite/invite-token", {
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    } as unknown as InviteActionArgs);

    expect(payload.ok).toBe(false);
    if (!("error" in payload)) throw new Error("Expected error payload");
    expect(payload.error.code).toBe("NOT_FOUND");
  });

  it("action enforces single-use token consumption", async () => {
    db.getDemoInviteByToken.mockResolvedValue({
      ...activeInvite,
      email: "existing@reactiveweb.dev",
      role: "editor",
    });
    db.getDemoUserByEmail.mockResolvedValue({
      id: "u-1",
      email: "existing@reactiveweb.dev",
      role: "viewer",
      active: false,
    });
    db.updateDemoUserPassword.mockResolvedValue({ id: "u-1" });
    db.updateDemoUserRole.mockResolvedValue({ id: "u-1" });
    db.updateDemoUserStatus.mockResolvedValue({ id: "u-1" });
    db.consumeDemoInvite.mockResolvedValue(false);

    const payload = await inviteRoute.action({
      params: { token: "invite-token" },
      request: buildPostRequest("/invite/invite-token", {
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    } as unknown as InviteActionArgs);

    expect(payload.ok).toBe(false);
    if (!("error" in payload)) throw new Error("Expected error payload");
    expect(payload.error.code).toBe("NOT_FOUND");
    expect(db.updateDemoUserPassword).toHaveBeenCalledTimes(1);
    expect(db.createDemoUser).not.toHaveBeenCalled();
    expect(demoState.recordAuditEvent).not.toHaveBeenCalled();
  });

  it("action activates existing users without creating duplicates", async () => {
    db.getDemoInviteByToken.mockResolvedValue({
      id: "i-1",
      email: "existing@reactiveweb.dev",
      role: "editor",
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      createdAt: new Date("2098-01-01T00:00:00.000Z"),
    });
    db.consumeDemoInvite.mockResolvedValue(true);
    db.getDemoUserByEmail.mockResolvedValue({
      id: "u-1",
      email: "existing@reactiveweb.dev",
      role: "viewer",
      active: false,
    });
    db.updateDemoUserPassword.mockResolvedValue({ id: "u-1" });
    db.updateDemoUserRole.mockResolvedValue({ id: "u-1" });
    db.updateDemoUserStatus.mockResolvedValue({ id: "u-1" });

    const payload = await inviteRoute.action({
      params: { token: "invite-token" },
      request: buildPostRequest("/invite/invite-token", {
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    } as unknown as InviteActionArgs);

    expect(payload.ok).toBe(true);
    expect(db.updateDemoUserPassword).toHaveBeenCalledTimes(1);
    expect(db.updateDemoUserRole).toHaveBeenCalledWith({ userId: "u-1", role: "editor" });
    expect(db.updateDemoUserStatus).toHaveBeenCalledWith({ userId: "u-1", active: true });
    expect(db.createDemoUser).not.toHaveBeenCalled();
    expect(demoState.recordAuditEvent).toHaveBeenCalledTimes(1);
  });

  it("does not consume invite when creating a new user fails", async () => {
    db.getDemoInviteByToken.mockResolvedValue(activeInvite);
    db.getDemoUserByEmail.mockResolvedValue(null);
    db.createDemoUser.mockResolvedValue(null);

    const payload = await inviteRoute.action({
      params: { token: "invite-token" },
      request: buildPostRequest("/invite/invite-token", {
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    } as unknown as InviteActionArgs);

    expect(payload.ok).toBe(false);
    if (!("error" in payload)) throw new Error("Expected error payload");
    expect(payload.error.code).toBe("INTERNAL_ERROR");
    expect(db.consumeDemoInvite).not.toHaveBeenCalled();
    expect(demoState.recordAuditEvent).not.toHaveBeenCalled();
  });

  it("fails existing-user activation when any mutation returns null", async () => {
    db.getDemoInviteByToken.mockResolvedValue({
      ...activeInvite,
      email: "existing@reactiveweb.dev",
      role: "admin",
    });
    db.getDemoUserByEmail.mockResolvedValue({
      id: "u-1",
      email: "existing@reactiveweb.dev",
      role: "viewer",
      active: false,
    });
    db.updateDemoUserPassword.mockResolvedValue({ id: "u-1" });
    db.updateDemoUserRole.mockResolvedValue(null);
    db.updateDemoUserStatus.mockResolvedValue({ id: "u-1" });

    const payload = await inviteRoute.action({
      params: { token: "invite-token" },
      request: buildPostRequest("/invite/invite-token", {
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }),
    } as unknown as InviteActionArgs);

    expect(payload.ok).toBe(false);
    if (!("error" in payload)) throw new Error("Expected error payload");
    expect(payload.error.code).toBe("INTERNAL_ERROR");
    expect(db.consumeDemoInvite).not.toHaveBeenCalled();
    expect(demoState.recordAuditEvent).not.toHaveBeenCalled();
  });
});
