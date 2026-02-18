import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const demoInvites = pgTable("demo_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  token: text("token").unique(),
  tokenHash: text("token_hash").unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
