import {
  ensureDemoWorkspaceSeed,
  fillMissingDemoUserPasswordHashes,
  getDemoUserById,
  getDemoUserCount,
  insertDemoAuditLog,
  type listDemoUsers,
  type listRecentDemoActivity,
} from "@reactiveweb/db";
import { redirect } from "react-router";
import { getAuthSession } from "./auth.server";
import { demoServerEnv } from "./env.server";
import { type ActivityEvent, type DemoUser, type Role, toRole } from "./models";
import { hashBootstrapPassword } from "./password.server";
import { throwRouteError } from "./server-responses";

let cachedBootstrapPasswordHash: { source: string; hash: string } | null = null;

function getBootstrapPasswordHash() {
  const source = demoServerEnv.AUTH_DEMO_PASSWORD;
  if (cachedBootstrapPasswordHash?.source === source) {
    return cachedBootstrapPasswordHash.hash;
  }

  const hash = hashBootstrapPassword(source);
  cachedBootstrapPasswordHash = { source, hash };
  return hash;
}

export function nextRole(current: Role): Role {
  const roles: Role[] = ["viewer", "editor", "admin", "owner"];
  const index = roles.indexOf(current);
  return roles[(index + 1) % roles.length] ?? "viewer";
}

function serializeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function mapDbUserToDemoUser(
  user: Awaited<ReturnType<typeof listDemoUsers>>[number],
): DemoUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toRole(user.role),
    status: user.active ? "active" : "suspended",
    createdAt: serializeDate(user.createdAt),
    lastSeenAt: serializeDate(user.lastSeenAt ?? user.updatedAt),
  };
}

export function mapDbActivityToEvent(
  row: Awaited<ReturnType<typeof listRecentDemoActivity>>[number],
): ActivityEvent {
  return {
    id: row.id,
    actor: row.actorName ?? "System",
    action: row.action,
    target: row.target,
    createdAt: serializeDate(row.createdAt),
  };
}

export async function ensureDemoSeeded() {
  const passwordHash = getBootstrapPasswordHash();
  await ensureDemoWorkspaceSeed(demoServerEnv.VITE_DEMO_ADMIN_EMAIL, passwordHash);
  await fillMissingDemoUserPasswordHashes(passwordHash);
}

export async function getLayoutSessionState(request: Request) {
  const session = await getAuthSession(request);
  if (!session?.user?.id) {
    return {
      isAuthenticated: false,
      currentUserName: "Visitor Session",
      userCount: 0,
    };
  }

  await ensureDemoSeeded();

  const dbUser = await getDemoUserById(session.user.id);
  if (!dbUser || !dbUser.active) {
    return {
      isAuthenticated: false,
      currentUserName: "Visitor Session",
      userCount: 0,
    };
  }

  const userCount = await getDemoUserCount();
  return {
    isAuthenticated: true,
    currentUserName: dbUser.name,
    userCount,
  };
}

export type RequiredSession = {
  user: {
    id: string;
    role: Role;
    name: string;
  };
};

export async function requireAuthSession(request: Request): Promise<RequiredSession> {
  const session = await getAuthSession(request);
  if (!session?.user?.id) {
    throw redirect("/auth");
  }

  const dbUser = await getDemoUserById(session.user.id);
  if (!dbUser) {
    throwRouteError(401, "UNAUTHORIZED", "Session user no longer exists.");
  }

  if (!dbUser.active) {
    throw redirect("/auth?error=session-revoked");
  }

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      role: toRole(dbUser.role),
    },
  };
}

export async function recordAuditEvent(input: {
  actorId: string | null;
  action: string;
  target: string;
  details: string;
}) {
  await insertDemoAuditLog(input);
}
