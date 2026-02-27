import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  out: resolve(configDir, "drizzle"),
  schema: resolve(configDir, "src/schema/*.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:55432/reactiveweb",
  },
});
