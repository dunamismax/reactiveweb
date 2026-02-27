import {
  clearDemoAuthFailures,
  getDemoAuthAttempt,
  getDemoUserByUsername,
  insertDemoAuditLog,
  markDemoUserSeen,
  recordDemoAuthFailure,
} from "@reactiveweb/db";

import { demoServerEnv } from "./env";
import { verifyPassword } from "./password";

type CredentialAuthUser = {
  id: string;
  name: string;
  role: string;
  username: string;
};

export function formatLockoutMessage(lockedUntil: Date, now = new Date()) {
  const remainingMs = Math.max(lockedUntil.getTime() - now.getTime(), 0);
  const remainingMinutes = Math.max(Math.ceil(remainingMs / 60_000), 1);
  return `Too many failed sign-in attempts. Try again in about ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`;
}

export async function getSignInLockoutState(username: string, now = new Date()) {
  const attempt = await getDemoAuthAttempt(username);
  if (!attempt?.lockedUntil) {
    return { isLocked: false, lockedUntil: null as Date | null };
  }

  if (attempt.lockedUntil.getTime() <= now.getTime()) {
    await clearDemoAuthFailures(username);
    return { isLocked: false, lockedUntil: null as Date | null };
  }

  return { isLocked: true, lockedUntil: attempt.lockedUntil };
}

export async function authorizeCredentialsSignIn(
  username: string,
  password: string,
  now = new Date(),
): Promise<CredentialAuthUser | null> {
  const lockout = await getSignInLockoutState(username, now);

  if (lockout.isLocked && lockout.lockedUntil) {
    await insertDemoAuditLog({
      actorId: null,
      action: "SignInFailure",
      target: `auth:user:${username}`,
      details: `Sign-in blocked for ${username}; temporary lockout active until ${lockout.lockedUntil.toISOString()}.`,
    });

    return null;
  }

  const user = await getDemoUserByUsername(username);
  const passwordValid =
    typeof user?.passwordHash === "string" &&
    user.active === true &&
    verifyPassword(password, user.passwordHash);

  if (!user || !passwordValid) {
    const attempt = await recordDemoAuthFailure({
      username,
      now,
      maxFailedAttempts: demoServerEnv.AUTH_MAX_FAILED_SIGNIN_ATTEMPTS,
      lockoutMinutes: demoServerEnv.AUTH_LOCKOUT_DURATION_MINUTES,
    });
    const lockoutDetails =
      attempt?.lockedUntil && attempt.lockedUntil.getTime() > now.getTime()
        ? ` Account locked until ${attempt.lockedUntil.toISOString()}.`
        : "";

    await insertDemoAuditLog({
      actorId: user?.id ?? null,
      action: "SignInFailure",
      target: `auth:user:${username}`,
      details: `Sign-in failed for ${username}; invalid credentials.${lockoutDetails}`,
    });

    return null;
  }

  await clearDemoAuthFailures(username);
  await markDemoUserSeen(user.id);
  await insertDemoAuditLog({
    actorId: user.id,
    action: "SignInSuccess",
    target: `auth:user:${user.username}`,
    details: `${user.username} signed in successfully.`,
  });

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    username: user.username,
  };
}
