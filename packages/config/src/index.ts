import { z } from "zod";

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const demoEnvSchema = baseEnvSchema.extend({
  VITE_APP_NAME: z.string().min(1).default("ReactiveWeb Demo"),
  VITE_ENABLE_AUTH_DEMO: z.coerce.boolean().default(true),
  VITE_DEMO_ADMIN_EMAIL: z.string().email().default("admin@reactiveweb.dev"),
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
});

export function parseBaseEnv(input: unknown) {
  return baseEnvSchema.parse(input);
}

export function parseDemoEnv(input: unknown) {
  return demoEnvSchema.parse(input);
}
