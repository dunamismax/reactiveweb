import { parseDemoEnv } from "@reactiveweb/config";

const rawEnv = {
  NODE_ENV: import.meta.env.MODE,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_ENABLE_AUTH_DEMO: import.meta.env.VITE_ENABLE_AUTH_DEMO,
  VITE_DEMO_ADMIN_EMAIL: import.meta.env.VITE_DEMO_ADMIN_EMAIL,
  DATABASE_URL: import.meta.env.VITE_DATABASE_URL,
  AUTH_SECRET: import.meta.env.VITE_AUTH_SECRET,
};

export const demoEnv = parseDemoEnv(rawEnv);
