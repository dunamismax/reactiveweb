import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:55432/reactiveweb";

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);
export * from "./demo";
