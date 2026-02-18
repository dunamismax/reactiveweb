import { hashBootstrapPassword } from "../apps/web-demo/app/lib/password.server.ts";
import {
  VISUAL_INVITE_EMAIL,
  VISUAL_INVITE_ROLE,
  VISUAL_INVITE_TOKEN,
} from "../apps/web-demo/tests/visual/constants.ts";
import { parseDemoServerEnv } from "../packages/config/src/index.ts";
import {
  createDemoInvite,
  ensureDemoWorkspaceSeed,
  fillMissingDemoUserPasswordHashes,
} from "../packages/db/src/index.ts";

const VISUAL_INVITE_EXPIRES_AT = new Date("2099-01-01T00:00:00.000Z");

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
  await fillMissingDemoUserPasswordHashes(passwordHash);

  const invite = await createDemoInvite({
    email: VISUAL_INVITE_EMAIL,
    role: VISUAL_INVITE_ROLE,
    token: VISUAL_INVITE_TOKEN,
    expiresAt: VISUAL_INVITE_EXPIRES_AT,
  });

  if (!invite) {
    throw new Error("Unable to prepare visual invite fixture.");
  }

  console.log(
    `web-demo visual fixtures ready: invite=/invite/${VISUAL_INVITE_TOKEN}, email=${VISUAL_INVITE_EMAIL}`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
