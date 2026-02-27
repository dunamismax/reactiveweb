import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
// Prefer neutral/Nuxt env names but keep the legacy Vite alias as a fallback.
const ownerUsername =
  process.env.DEMO_OWNER_USERNAME ??
  process.env.NUXT_PUBLIC_DEMO_OWNER_USERNAME ??
  process.env.VITE_DEMO_OWNER_USERNAME ??
  "owner";

export default defineNuxtConfig({
  compatibilityDate: "2026-02-27",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET ?? "",
    databaseUrl: process.env.DATABASE_URL ?? "",
    authDemoPassword: process.env.AUTH_DEMO_PASSWORD ?? "",
    authMaxFailedSigninAttempts: Number(process.env.AUTH_MAX_FAILED_SIGNIN_ATTEMPTS ?? "5"),
    authLockoutDurationMinutes: Number(process.env.AUTH_LOCKOUT_DURATION_MINUTES ?? "15"),
    ownerUsername,
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME ?? "ReactiveWeb Demo",
      ownerUsername: process.env.NUXT_PUBLIC_DEMO_OWNER_USERNAME ?? ownerUsername,
    },
  },
  alias: {
    "@reactiveweb/config": resolve(appDir, "../../packages/config/src/index.ts"),
    "@reactiveweb/db": resolve(appDir, "../../packages/db/src/index.ts"),
    "@reactiveweb/db/schema": resolve(appDir, "../../packages/db/src/schema/index.ts"),
    "@reactiveweb/ui": resolve(appDir, "../../packages/ui/src/index.ts"),
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  build: {
    transpile: ["@reactiveweb/config", "@reactiveweb/db", "@reactiveweb/ui"],
  },
});
