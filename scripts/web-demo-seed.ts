import { hashBootstrapPassword } from "../apps/web-demo/app/lib/password.server.ts";
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
    VITE_DEMO_ADMIN_EMAIL: process.env.VITE_DEMO_ADMIN_EMAIL,
  });

  const passwordHash = hashBootstrapPassword(env.AUTH_DEMO_PASSWORD);
  await ensureDemoWorkspaceSeed(env.VITE_DEMO_ADMIN_EMAIL, passwordHash);
  const backfilledCount = await fillMissingDemoUserPasswordHashes(passwordHash);

  console.log(
    `web-demo seed complete: admin=${env.VITE_DEMO_ADMIN_EMAIL}, backfilled_password_hashes=${backfilledCount}`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
