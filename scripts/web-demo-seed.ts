import { hashBootstrapPassword } from "../apps/web-demo/server/utils/password.ts";
import { parseDemoServerEnv } from "../packages/config/src/index.ts";
import {
  ensureDemoWorkspaceSeed,
  fillMissingDemoUserPasswordHashes,
} from "../packages/db/src/index.ts";

async function main() {
  const env = parseDemoServerEnv({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_DEMO_PASSWORD: process.env.AUTH_DEMO_PASSWORD,
    AUTH_MAX_FAILED_SIGNIN_ATTEMPTS: process.env.AUTH_MAX_FAILED_SIGNIN_ATTEMPTS,
    AUTH_LOCKOUT_DURATION_MINUTES: process.env.AUTH_LOCKOUT_DURATION_MINUTES,
    DEMO_OWNER_USERNAME:
      process.env.DEMO_OWNER_USERNAME ??
      process.env.NUXT_PUBLIC_DEMO_OWNER_USERNAME ??
      process.env.VITE_DEMO_OWNER_USERNAME,
  });

  const passwordHash = hashBootstrapPassword(env.AUTH_DEMO_PASSWORD);
  await ensureDemoWorkspaceSeed(env.OWNER_USERNAME, passwordHash);
  const backfilledCount = await fillMissingDemoUserPasswordHashes(passwordHash);

  console.log(
    `web-demo seed complete: owner=${env.OWNER_USERNAME}, backfilled_password_hashes=${backfilledCount}`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
