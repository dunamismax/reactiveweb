import { parseDemoServerEnv } from "@reactiveweb/config";

const rawServerEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_DEMO_PASSWORD: process.env.AUTH_DEMO_PASSWORD,
  VITE_DEMO_OWNER_USERNAME: process.env.VITE_DEMO_OWNER_USERNAME,
};

export const demoServerEnv = parseDemoServerEnv(rawServerEnv);
