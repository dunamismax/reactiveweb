import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

import { db } from "./index";
import { demoAuditLogs, demoUsers } from "./schema";

const defaultWorkspaceUsers = [
  { name: "Stephen Sawyer", email: "stephen@reactiveweb.dev", role: "owner", active: true },
  { name: "Rae Sullivan", email: "rae@reactiveweb.dev", role: "admin", active: true },
  { name: "Jules Park", email: "jules@reactiveweb.dev", role: "editor", active: true },
  { name: "Mina Flores", email: "mina@reactiveweb.dev", role: "viewer", active: false },
] as const;

export async function ensureDemoWorkspaceSeed(adminEmail: string, passwordHash: string) {
  const [{ total }] = await db.select({ total: count() }).from(demoUsers);
  if (total > 0) {
    return;
  }

  const now = new Date();
  const usersToInsert = defaultWorkspaceUsers.map((user, index) => ({
    name: user.name,
    email: index === 0 ? adminEmail.toLowerCase() : user.email,
    passwordHash,
    role: user.role,
    active: user.active,
    lastSeenAt: now,
  }));

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
      email: demoUsers.email,
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
      email: demoUsers.email,
      passwordHash: demoUsers.passwordHash,
      role: demoUsers.role,
      active: demoUsers.active,
      lastSeenAt: demoUsers.lastSeenAt,
    })
    .from(demoUsers)
    .where(eq(demoUsers.id, id))
    .limit(1);

  return user ?? null;
}

export async function getDemoUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: demoUsers.id,
      name: demoUsers.name,
      email: demoUsers.email,
      passwordHash: demoUsers.passwordHash,
      role: demoUsers.role,
      active: demoUsers.active,
    })
    .from(demoUsers)
    .where(eq(demoUsers.email, email.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function createDemoUser(input: {
  name: string;
  email: string;
  role: string;
  passwordHash: string;
}) {
  const [created] = await db
    .insert(demoUsers)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      active: true,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: demoUsers.email })
    .returning({
      id: demoUsers.id,
      name: demoUsers.name,
      email: demoUsers.email,
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

export async function listRecentDemoActivity(limit = 12) {
  return db
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
    .orderBy(desc(demoAuditLogs.createdAt))
    .limit(limit);
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
