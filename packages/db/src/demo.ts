import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

import { db } from "./index.ts";
import { demoAuditLogs, demoInvites, demoUsers } from "./schema/index.ts";

const defaultWorkspaceUsers = [
  { name: "Stephen Sawyer", email: "stephen@reactiveweb.dev", role: "owner", active: true },
  { name: "Rae Sullivan", email: "rae@reactiveweb.dev", role: "admin", active: true },
  { name: "Jules Park", email: "jules@reactiveweb.dev", role: "editor", active: true },
  { name: "Mina Flores", email: "mina@reactiveweb.dev", role: "viewer", active: false },
] as const;

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function constantTimeMatch(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

function buildDemoUsername(userId: string) {
  return `user_${userId.replaceAll("-", "")}`;
}

export async function ensureDemoWorkspaceSeed(adminEmail: string, passwordHash: string) {
  const [{ total }] = await db.select({ total: count() }).from(demoUsers);
  if (total > 0) {
    return;
  }

  const now = new Date();
  const usersToInsert = defaultWorkspaceUsers.map((user, index) => {
    const id = randomUUID();
    return {
      id,
      name: user.name,
      email: index === 0 ? adminEmail.toLowerCase() : user.email,
      username: buildDemoUsername(id),
      passwordHash,
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
      email: demoUsers.email,
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
      email: demoUsers.email,
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

export async function getDemoUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: demoUsers.id,
      name: demoUsers.name,
      email: demoUsers.email,
      username: demoUsers.username,
      passwordHash: demoUsers.passwordHash,
      mustChangePassword: demoUsers.mustChangePassword,
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
  const id = randomUUID();
  const [created] = await db
    .insert(demoUsers)
    .values({
      id,
      name: input.name,
      email: input.email.toLowerCase(),
      username: buildDemoUsername(id),
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
      email: demoUsers.email,
      username: demoUsers.username,
      mustChangePassword: demoUsers.mustChangePassword,
      role: demoUsers.role,
      active: demoUsers.active,
    });

  return updated ?? null;
}

export async function updateDemoUserPassword(input: { userId: string; passwordHash: string }) {
  const [updated] = await db
    .update(demoUsers)
    .set({
      passwordHash: input.passwordHash,
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

export async function createDemoInvite(input: {
  email: string;
  role: string;
  token: string;
  expiresAt: Date;
}) {
  const email = input.email.toLowerCase();
  const tokenHash = hashInviteToken(input.token);
  await db.delete(demoInvites).where(eq(demoInvites.email, email));

  const [created] = await db
    .insert(demoInvites)
    .values({
      email,
      role: input.role,
      token: null,
      tokenHash,
      expiresAt: input.expiresAt,
    })
    .returning({
      id: demoInvites.id,
      email: demoInvites.email,
      role: demoInvites.role,
      tokenHash: demoInvites.tokenHash,
      expiresAt: demoInvites.expiresAt,
      createdAt: demoInvites.createdAt,
    });

  if (!created) return null;
  return {
    ...created,
    token: input.token,
  };
}

export async function getDemoInviteByToken(token: string) {
  const tokenHash = hashInviteToken(token);

  const [hashedInvite] = await db
    .select({
      id: demoInvites.id,
      email: demoInvites.email,
      role: demoInvites.role,
      token: demoInvites.token,
      tokenHash: demoInvites.tokenHash,
      expiresAt: demoInvites.expiresAt,
      createdAt: demoInvites.createdAt,
    })
    .from(demoInvites)
    .where(eq(demoInvites.tokenHash, tokenHash))
    .limit(1);

  if (hashedInvite?.tokenHash && constantTimeMatch(hashedInvite.tokenHash, tokenHash)) {
    return hashedInvite;
  }

  const [legacyInvite] = await db
    .select({
      id: demoInvites.id,
      email: demoInvites.email,
      role: demoInvites.role,
      token: demoInvites.token,
      tokenHash: demoInvites.tokenHash,
      expiresAt: demoInvites.expiresAt,
      createdAt: demoInvites.createdAt,
    })
    .from(demoInvites)
    .where(eq(demoInvites.token, token))
    .limit(1);

  if (!legacyInvite?.token || !constantTimeMatch(legacyInvite.token, token)) {
    return null;
  }

  const [backfilled] = await db
    .update(demoInvites)
    .set({
      tokenHash,
      token: null,
    })
    .where(eq(demoInvites.id, legacyInvite.id))
    .returning({
      id: demoInvites.id,
      email: demoInvites.email,
      role: demoInvites.role,
      token: demoInvites.token,
      tokenHash: demoInvites.tokenHash,
      expiresAt: demoInvites.expiresAt,
      createdAt: demoInvites.createdAt,
    });

  return (
    backfilled ?? {
      ...legacyInvite,
      token: null,
      tokenHash,
    }
  );
}

export async function consumeDemoInvite(inviteId: string) {
  const deleted = await db.delete(demoInvites).where(eq(demoInvites.id, inviteId)).returning({
    id: demoInvites.id,
  });
  return deleted.length > 0;
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
