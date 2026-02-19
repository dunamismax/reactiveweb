import { parseDemoEnv } from "@reactiveweb/config";

const rawEnv = {
  NODE_ENV: import.meta.env.MODE,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_ENABLE_AUTH_DEMO: import.meta.env.VITE_ENABLE_AUTH_DEMO,
  VITE_DEMO_OWNER_USERNAME: import.meta.env.VITE_DEMO_OWNER_USERNAME,
};

export const demoEnv = parseDemoEnv(rawEnv);
