import { z } from "zod";

const envBooleanSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return value;
}, z.boolean());

const envPositiveIntSchema = z.preprocess((value) => {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}, z.number().int().min(1));

const usernameRegex = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;

const demoUsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(
    usernameRegex,
    "Username must use lowercase letters, numbers, dots, underscores, or hyphens.",
  );

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const demoClientEnvSchema = baseEnvSchema.extend({
  VITE_APP_NAME: z.string().min(1).default("ReactiveWeb Demo"),
  VITE_ENABLE_AUTH_DEMO: envBooleanSchema.default(true),
  VITE_DEMO_OWNER_USERNAME: demoUsernameSchema.default("owner"),
});

export function parseBaseEnv(input: unknown) {
  return baseEnvSchema.parse(input);
}

export function parseDemoEnv(input: unknown) {
  return demoClientEnvSchema.parse(input);
}

export const demoServerEnvSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_DEMO_PASSWORD: z.string().min(8),
  AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: envPositiveIntSchema.default(5),
  AUTH_LOCKOUT_DURATION_MINUTES: envPositiveIntSchema.default(15),
  VITE_DEMO_OWNER_USERNAME: demoUsernameSchema.default("owner"),
});

export function parseDemoServerEnv(input: unknown) {
  return demoServerEnvSchema.parse(input);
}
