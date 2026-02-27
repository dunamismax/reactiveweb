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

const demoClientInputSchema = baseEnvSchema.extend({
  APP_NAME: z.string().min(1).optional(),
  // Legacy Vite aliases remain accepted during the Nuxt migration.
  VITE_APP_NAME: z.string().min(1).optional(),
  NUXT_PUBLIC_APP_NAME: z.string().min(1).optional(),
  ENABLE_AUTH_DEMO: envBooleanSchema.optional(),
  VITE_ENABLE_AUTH_DEMO: envBooleanSchema.optional(),
  NUXT_PUBLIC_ENABLE_AUTH_DEMO: envBooleanSchema.optional(),
  DEMO_OWNER_USERNAME: demoUsernameSchema.optional(),
  VITE_DEMO_OWNER_USERNAME: demoUsernameSchema.optional(),
  NUXT_PUBLIC_DEMO_OWNER_USERNAME: demoUsernameSchema.optional(),
});

export const demoClientEnvSchema = baseEnvSchema.extend({
  APP_NAME: z.string().min(1).default("ReactiveWeb Demo"),
  ENABLE_AUTH_DEMO: envBooleanSchema.default(true),
  OWNER_USERNAME: demoUsernameSchema.default("owner"),
});

export function parseBaseEnv(input: unknown) {
  return baseEnvSchema.parse(input);
}

export function parseDemoEnv(input: unknown) {
  const parsed = demoClientInputSchema.parse(input);

  return demoClientEnvSchema.parse({
    NODE_ENV: parsed.NODE_ENV,
    APP_NAME: parsed.NUXT_PUBLIC_APP_NAME ?? parsed.APP_NAME ?? parsed.VITE_APP_NAME,
    ENABLE_AUTH_DEMO:
      parsed.NUXT_PUBLIC_ENABLE_AUTH_DEMO ??
      parsed.ENABLE_AUTH_DEMO ??
      parsed.VITE_ENABLE_AUTH_DEMO,
    OWNER_USERNAME:
      parsed.DEMO_OWNER_USERNAME ??
      parsed.NUXT_PUBLIC_DEMO_OWNER_USERNAME ??
      parsed.VITE_DEMO_OWNER_USERNAME,
  });
}

const demoServerInputSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_DEMO_PASSWORD: z.string().min(8),
  AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: envPositiveIntSchema.default(5),
  AUTH_LOCKOUT_DURATION_MINUTES: envPositiveIntSchema.default(15),
  DEMO_OWNER_USERNAME: demoUsernameSchema.optional(),
  // Legacy Vite alias for existing local env files.
  VITE_DEMO_OWNER_USERNAME: demoUsernameSchema.optional(),
  NUXT_PUBLIC_DEMO_OWNER_USERNAME: demoUsernameSchema.optional(),
});

export const demoServerEnvSchema = baseEnvSchema.extend({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_DEMO_PASSWORD: z.string().min(8),
  AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: envPositiveIntSchema.default(5),
  AUTH_LOCKOUT_DURATION_MINUTES: envPositiveIntSchema.default(15),
  OWNER_USERNAME: demoUsernameSchema.default("owner"),
});

export function parseDemoServerEnv(input: unknown) {
  const parsed = demoServerInputSchema.parse(input);

  return demoServerEnvSchema.parse({
    NODE_ENV: parsed.NODE_ENV,
    DATABASE_URL: parsed.DATABASE_URL,
    AUTH_SECRET: parsed.AUTH_SECRET,
    AUTH_DEMO_PASSWORD: parsed.AUTH_DEMO_PASSWORD,
    AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: parsed.AUTH_MAX_FAILED_SIGNIN_ATTEMPTS,
    AUTH_LOCKOUT_DURATION_MINUTES: parsed.AUTH_LOCKOUT_DURATION_MINUTES,
    OWNER_USERNAME:
      parsed.DEMO_OWNER_USERNAME ??
      parsed.NUXT_PUBLIC_DEMO_OWNER_USERNAME ??
      parsed.VITE_DEMO_OWNER_USERNAME,
  });
}
