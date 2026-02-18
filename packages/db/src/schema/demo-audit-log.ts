import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { demoUsers } from "./demo-user";

export const demoAuditLogs = pgTable("demo_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => demoUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  target: text("target").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
