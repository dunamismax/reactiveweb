import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, mockDemoServerEnv } = vi.hoisted(() => ({
  db: {
    clearDemoAuthFailures: vi.fn(),
    getDemoAuthAttempt: vi.fn(),
    getDemoUserByUsername: vi.fn(),
    insertDemoAuditLog: vi.fn(),
    markDemoUserSeen: vi.fn(),
    recordDemoAuthFailure: vi.fn(),
  },
  mockDemoServerEnv: {
    NODE_ENV: "test",
    DATABASE_URL: "postgres://postgres:postgres@localhost:55432/reactiveweb",
    AUTH_SECRET: "replace-with-16+-char-secret",
    AUTH_DEMO_PASSWORD: "demo-pass-123",
    AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: 5,
    AUTH_LOCKOUT_DURATION_MINUTES: 15,
    VITE_DEMO_OWNER_USERNAME: "owner",
  },
}));

vi.mock("@reactiveweb/db", () => db);
vi.mock("../app/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));
vi.mock("~/lib/env.server", () => ({ demoServerEnv: mockDemoServerEnv }));

const { hashPassword } = await import("../app/lib/password.server.ts");
const { authorizeCredentialsSignIn, formatLockoutMessage, getSignInLockoutState } = await import(
  "../app/lib/sign-in-attempts.server.ts"
);

describe("sign-in attempt hardening", () => {
  beforeEach(() => {
    db.clearDemoAuthFailures.mockReset();
    db.getDemoAuthAttempt.mockReset();
    db.getDemoUserByUsername.mockReset();
    db.insertDemoAuditLog.mockReset();
    db.markDemoUserSeen.mockReset();
    db.recordDemoAuthFailure.mockReset();

    db.getDemoAuthAttempt.mockResolvedValue(null);
    db.insertDemoAuditLog.mockResolvedValue({ id: "audit-1" });
    db.clearDemoAuthFailures.mockResolvedValue({ username: "owner" });
    db.markDemoUserSeen.mockResolvedValue({ id: "u-1" });
    db.recordDemoAuthFailure.mockResolvedValue({
      username: "owner",
      failedAttempts: 1,
      lastFailedAt: new Date("2026-01-01T00:00:00.000Z"),
      lockedUntil: null,
    });
  });

  it("formats lockout feedback for users", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const lockedUntil = new Date("2026-01-01T00:01:01.000Z");

    expect(formatLockoutMessage(lockedUntil, now)).toBe(
      "Too many failed sign-in attempts. Try again in about 2 minutes.",
    );
  });

  it("clears expired lockouts when checking state", async () => {
    const now = new Date("2026-01-01T00:30:00.000Z");
    db.getDemoAuthAttempt.mockResolvedValue({
      username: "owner",
      failedAttempts: 5,
      lastFailedAt: new Date("2026-01-01T00:00:00.000Z"),
      lockedUntil: new Date("2026-01-01T00:15:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const state = await getSignInLockoutState("owner", now);

    expect(state.isLocked).toBe(false);
    expect(state.lockedUntil).toBeNull();
    expect(db.clearDemoAuthFailures).toHaveBeenCalledWith("owner");
  });

  it("records a failure and applies lockout metadata when credentials are invalid", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    db.getDemoUserByUsername.mockResolvedValue({
      id: "u-1",
      name: "Owner",
      username: "owner",
      passwordHash: hashPassword("correct-pass-123"),
      mustChangePassword: false,
      role: "owner",
      active: true,
    });
    db.recordDemoAuthFailure.mockResolvedValue({
      username: "owner",
      failedAttempts: 5,
      lastFailedAt: now,
      lockedUntil: new Date("2026-01-01T00:15:00.000Z"),
    });

    const result = await authorizeCredentialsSignIn(
      { username: "owner", password: "wrong-pass-123" },
      now,
    );

    expect(result).toBeNull();
    expect(db.recordDemoAuthFailure).toHaveBeenCalledWith({
      username: "owner",
      now,
      maxFailedAttempts: 5,
      lockoutMinutes: 15,
    });
    expect(db.insertDemoAuditLog).toHaveBeenCalledWith({
      actorId: "u-1",
      action: "SignInFailure",
      target: "auth:user:owner",
      details:
        "Sign-in failed for owner; invalid credentials. Account locked until 2026-01-01T00:15:00.000Z.",
    });
  });

  it("blocks active lockouts before credential checks", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    db.getDemoAuthAttempt.mockResolvedValue({
      username: "owner",
      failedAttempts: 5,
      lastFailedAt: now,
      lockedUntil: new Date("2026-01-01T00:15:00.000Z"),
      updatedAt: now,
    });

    const result = await authorizeCredentialsSignIn(
      { username: "owner", password: "wrong-1234" },
      now,
    );

    expect(result).toBeNull();
    expect(db.getDemoUserByUsername).not.toHaveBeenCalled();
    expect(db.recordDemoAuthFailure).not.toHaveBeenCalled();
    expect(db.insertDemoAuditLog).toHaveBeenCalledWith({
      actorId: null,
      action: "SignInFailure",
      target: "auth:user:owner",
      details:
        "Sign-in blocked for owner; temporary lockout active until 2026-01-01T00:15:00.000Z.",
    });
  });

  it("clears failure state and records success on valid sign-in", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    db.getDemoUserByUsername.mockResolvedValue({
      id: "u-1",
      name: "Owner",
      username: "owner",
      passwordHash: hashPassword("correct-pass-123"),
      mustChangePassword: false,
      role: "owner",
      active: true,
    });

    const result = await authorizeCredentialsSignIn(
      { username: "owner", password: "correct-pass-123" },
      now,
    );

    expect(result).toEqual({
      id: "u-1",
      name: "Owner",
      role: "owner",
    });
    expect(db.clearDemoAuthFailures).toHaveBeenCalledWith("owner");
    expect(db.markDemoUserSeen).toHaveBeenCalledWith("u-1");
    expect(db.insertDemoAuditLog).toHaveBeenCalledWith({
      actorId: "u-1",
      action: "SignInSuccess",
      target: "auth:user:owner",
      details: "owner signed in successfully.",
    });
  });
});
