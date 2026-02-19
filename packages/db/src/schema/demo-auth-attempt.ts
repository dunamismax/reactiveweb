import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const demoAuthAttempts = pgTable("demo_auth_attempts", {
  username: text("username").primaryKey(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lastFailedAt: timestamp("last_failed_at", { withTimezone: true }),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
