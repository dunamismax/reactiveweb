import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

import { db } from "./index.ts";
import { demoAuditLogs, demoUsers } from "./schema/index.ts";

const defaultWorkspaceUsers = [
  { name: "Stephen Sawyer", username: "owner", role: "owner", active: true },
  { name: "Rae Sullivan", username: "admin", role: "admin", active: true },
  { name: "Jules Park", username: "editor", role: "editor", active: true },
  { name: "Mina Flores", username: "viewer", role: "viewer", active: false },
] as const;

function normalizeUsername(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : "owner";
}

function ensureUniqueUsername(base: string, used: Set<string>) {
  let candidate = normalizeUsername(base);
  let index = 1;

  while (used.has(candidate)) {
    candidate = `${normalizeUsername(base)}-${index}`;
    index += 1;
  }

  used.add(candidate);
  return candidate;
}

export async function ensureDemoWorkspaceSeed(ownerUsername: string, passwordHash: string) {
  const [{ total }] = await db.select({ total: count() }).from(demoUsers);
  if (total > 0) {
    return;
  }

  const now = new Date();
  const usedUsernames = new Set<string>();

  const usersToInsert = defaultWorkspaceUsers.map((user, index) => {
    const id = randomUUID();
    return {
      id,
      name: user.name,
      username: ensureUniqueUsername(index === 0 ? ownerUsername : user.username, usedUsernames),
      passwordHash,
      mustChangePassword: false,
      role: user.role,
      active: user.active,
      lastSeenAt: now,
    };
  });

  const insertedUsers = await db.insert(demoUsers).values(usersToInsert).returning({
    id: demoUsers.id,
    name: demoUsers.name,
  });

  const ownerId = insertedUsers[0]?.id ?? null;
  const ownerName = insertedUsers[0]?.name ?? "System";

  await db.insert(demoAuditLogs).values({
    actorId: ownerId,
    action: "Seeded",
    target: "workspace users",
    details: `${ownerName} initialized demo workspace`,
  });
}

export async function getDemoUserCount() {
  const [{ total }] = await db.select({ total: count() }).from(demoUsers);
  return total;
}

export async function listDemoUsers() {
  return db
    .select({
      id: demoUsers.id,
      name: demoUsers.name,
      username: demoUsers.username,
      mustChangePassword: demoUsers.mustChangePassword,
      role: demoUsers.role,
      active: demoUsers.active,
      createdAt: demoUsers.createdAt,
      updatedAt: demoUsers.updatedAt,
      lastSeenAt: demoUsers.lastSeenAt,
    })
    .from(demoUsers)
    .orderBy(asc(demoUsers.name));
}

export async function getDemoUserById(id: string) {
  const [user] = await db
    .select({
      id: demoUsers.id,
      name: demoUsers.name,
      username: demoUsers.username,
      passwordHash: demoUsers.passwordHash,
      mustChangePassword: demoUsers.mustChangePassword,
      role: demoUsers.role,
      active: demoUsers.active,
      lastSeenAt: demoUsers.lastSeenAt,
    })
    .from(demoUsers)
    .where(eq(demoUsers.id, id))
    .limit(1);

  return user ?? null;
}

export async function getDemoUserByUsername(username: string) {
  const [user] = await db
    .select({
      id: demoUsers.id,
      name: demoUsers.name,
      username: demoUsers.username,
      passwordHash: demoUsers.passwordHash,
      mustChangePassword: demoUsers.mustChangePassword,
      role: demoUsers.role,
      active: demoUsers.active,
    })
    .from(demoUsers)
    .where(eq(demoUsers.username, normalizeUsername(username)))
    .limit(1);

  return user ?? null;
}

export async function createDemoUser(input: {
  name: string;
  username: string;
  role: string;
  passwordHash: string;
  mustChangePassword?: boolean;
}) {
  const [created] = await db
    .insert(demoUsers)
    .values({
      id: randomUUID(),
      name: input.name,
      username: normalizeUsername(input.username),
      passwordHash: input.passwordHash,
      mustChangePassword: input.mustChangePassword ?? false,
      role: input.role,
      active: true,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: demoUsers.username })
    .returning({
      id: demoUsers.id,
      name: demoUsers.name,
      username: demoUsers.username,
      mustChangePassword: demoUsers.mustChangePassword,
      role: demoUsers.role,
      active: demoUsers.active,
    });

  return created ?? null;
}

export async function updateDemoUserRole(input: { userId: string; role: string }) {
  const [updated] = await db
    .update(demoUsers)
    .set({
      role: input.role,
      updatedAt: new Date(),
    })
    .where(eq(demoUsers.id, input.userId))
    .returning({
      id: demoUsers.id,
    });

  return updated ?? null;
}

export async function updateDemoUserName(input: { userId: string; name: string }) {
  const [updated] = await db
    .update(demoUsers)
    .set({
      name: input.name,
      updatedAt: new Date(),
    })
    .where(eq(demoUsers.id, input.userId))
    .returning({
      id: demoUsers.id,
      name: demoUsers.name,
      username: demoUsers.username,
      mustChangePassword: demoUsers.mustChangePassword,
      role: demoUsers.role,
      active: demoUsers.active,
    });

  return updated ?? null;
}

export async function updateDemoUserPassword(input: {
  userId: string;
  passwordHash: string;
  mustChangePassword?: boolean;
}) {
  const values = {
    passwordHash: input.passwordHash,
    updatedAt: new Date(),
    ...(typeof input.mustChangePassword === "boolean"
      ? { mustChangePassword: input.mustChangePassword }
      : {}),
  };

  const [updated] = await db
    .update(demoUsers)
    .set(values)
    .where(eq(demoUsers.id, input.userId))
    .returning({
      id: demoUsers.id,
      mustChangePassword: demoUsers.mustChangePassword,
    });

  return updated ?? null;
}

export async function updateDemoUserStatus(input: { userId: string; active: boolean }) {
  const [updated] = await db
    .update(demoUsers)
    .set({
      active: input.active,
      updatedAt: new Date(),
    })
    .where(eq(demoUsers.id, input.userId))
    .returning({
      id: demoUsers.id,
    });

  return updated ?? null;
}

export async function markDemoUserSeen(userId: string) {
  const [updated] = await db
    .update(demoUsers)
    .set({
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(demoUsers.id, userId), eq(demoUsers.active, true)))
    .returning({ id: demoUsers.id });

  return updated ?? null;
}

export async function fillMissingDemoUserPasswordHashes(passwordHash: string) {
  const updated = await db
    .update(demoUsers)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(isNull(demoUsers.passwordHash))
    .returning({ id: demoUsers.id });

  return updated.length;
}

export async function listRecentDemoActivity(limit?: number) {
  const query = db
    .select({
      id: demoAuditLogs.id,
      actorId: demoAuditLogs.actorId,
      action: demoAuditLogs.action,
      target: demoAuditLogs.target,
      createdAt: demoAuditLogs.createdAt,
      actorName: demoUsers.name,
    })
    .from(demoAuditLogs)
    .leftJoin(demoUsers, eq(demoUsers.id, demoAuditLogs.actorId))
    .orderBy(desc(demoAuditLogs.createdAt));

  if (typeof limit === "number") {
    return query.limit(limit);
  }

  return query;
}

export async function insertDemoAuditLog(input: {
  actorId: string | null;
  action: string;
  target: string;
  details: string;
}) {
  const [created] = await db
    .insert(demoAuditLogs)
    .values({
      actorId: input.actorId,
      action: input.action,
      target: input.target,
      details: input.details,
    })
    .returning({ id: demoAuditLogs.id });

  return created ?? null;
}
