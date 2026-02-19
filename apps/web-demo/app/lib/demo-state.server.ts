import {
  ensureDemoWorkspaceSeed,
  fillMissingDemoUserPasswordHashes,
  getDemoUserById,
  getDemoUserCount,
  insertDemoAuditLog,
  type listDemoUsers,
  listRecentDemoActivity,
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
    username: user.username,
    mustChangePassword: user.mustChangePassword,
    role: toRole(user.role),
    status: user.active ? "active" : "suspended",
    createdAt: serializeDate(user.createdAt),
    lastSeenAt: serializeDate(user.lastSeenAt ?? user.updatedAt),
  };
}

type ActivityRow = {
  id: string;
  actorId: string | null;
  action: string;
  target: string;
  createdAt: Date;
  actorName: string | null;
};

export function mapDbActivityToEvent(row: ActivityRow): ActivityEvent {
  return {
    id: row.id,
    actor: row.actorName ?? "System",
    action: row.action,
    target: row.target,
    createdAt: serializeDate(row.createdAt),
  };
}

// Fetch a ceiling of recent activity, then apply filters and pagination in-memory.
// Sufficient for demo-scale datasets (hundreds of audit events).
export async function listActivity(params: {
  page: number;
  pageSize: number;
  includeAll?: boolean;
  action?: string;
  actorName?: string;
  from?: Date;
  to?: Date;
  q?: string;
}) {
  const ceiling = Math.min(params.page * params.pageSize * 2 + 200, 500);
  const allRows = params.includeAll
    ? await listRecentDemoActivity()
    : await listRecentDemoActivity(ceiling);

  let filtered: typeof allRows = allRows;

  if (params.action) {
    const actionLower = params.action.toLowerCase();
    filtered = filtered.filter((r) => r.action.toLowerCase() === actionLower);
  }
  if (params.actorName) {
    const nameLower = params.actorName.toLowerCase();
    filtered = filtered.filter((r) => r.actorName?.toLowerCase().includes(nameLower) ?? false);
  }
  if (params.from) {
    const from = params.from;
    filtered = filtered.filter((r) => r.createdAt >= from);
  }
  if (params.to) {
    const to = params.to;
    filtered = filtered.filter((r) => r.createdAt <= to);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.action.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q) ||
        (r.actorName?.toLowerCase().includes(q) ?? false),
    );
  }

  const total = filtered.length;
  const rows = params.includeAll
    ? filtered
    : filtered.slice((params.page - 1) * params.pageSize, params.page * params.pageSize);

  return {
    rows: rows.map(mapDbActivityToEvent),
    total,
  };
}

export async function fetchActivityTrendRows(days = 7) {
  // Fetch a generous slice; trend only needs the last N days.
  const rows = await listRecentDemoActivity(500);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days + 1);
  cutoff.setUTCHours(0, 0, 0, 0);
  return rows.filter((r) => r.createdAt >= cutoff);
}

export function buildActivityTrend(
  rows: { createdAt: Date; action: string }[],
  days = 7,
): { day: string; label: string; count: number }[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const dayKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = rows.filter((r) => r.createdAt.toISOString().slice(0, 10) === dayKey).length;
    return { day: dayKey, label, count };
  });
}

export async function ensureDemoSeeded() {
  const passwordHash = getBootstrapPasswordHash();
  await ensureDemoWorkspaceSeed(demoServerEnv.VITE_DEMO_OWNER_USERNAME, passwordHash);
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
    username: string;
    mustChangePassword: boolean;
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

  const { pathname } = new URL(request.url);
  const isSettingsRoute = pathname === "/settings" || pathname.startsWith("/settings/");

  if (dbUser.mustChangePassword && !isSettingsRoute) {
    throw redirect("/settings?required=password-change");
  }

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      role: toRole(dbUser.role),
      mustChangePassword: dbUser.mustChangePassword,
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
