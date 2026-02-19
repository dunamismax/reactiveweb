import { parseDemoServerEnv } from "@reactiveweb/config";

const rawServerEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_DEMO_PASSWORD: process.env.AUTH_DEMO_PASSWORD,
  AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: process.env.AUTH_MAX_FAILED_SIGNIN_ATTEMPTS,
  AUTH_LOCKOUT_DURATION_MINUTES: process.env.AUTH_LOCKOUT_DURATION_MINUTES,
  VITE_DEMO_OWNER_USERNAME: process.env.VITE_DEMO_OWNER_USERNAME,
};

export const demoServerEnv = parseDemoServerEnv(rawServerEnv);
