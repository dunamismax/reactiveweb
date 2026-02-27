import { setSession } from "../../utils/auth-session";
import { ensureDemoSeeded, recordAuditEvent } from "../../utils/demo-state";
import { signInInputSchema } from "../../utils/models";
import { errorPayload } from "../../utils/responses";
import {
  authorizeCredentialsSignIn,
  formatLockoutMessage,
  getSignInLockoutState,
} from "../../utils/sign-in-attempts";

export default defineEventHandler(async (event) => {
  await ensureDemoSeeded();

  const body = await readBody(event);
  const parsed = signInInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Sign-in failed.",
    );
  }

  const lockout = await getSignInLockoutState(parsed.data.username);
  if (lockout.isLocked && lockout.lockedUntil) {
    await recordAuditEvent({
      actorId: null,
      action: "SignInFailure",
      target: `auth:user:${parsed.data.username}`,
      details: `Sign-in blocked for ${parsed.data.username}; temporary lockout active until ${lockout.lockedUntil.toISOString()}.`,
    });
    return errorPayload(event, 400, "BAD_REQUEST", formatLockoutMessage(lockout.lockedUntil));
  }

  const user = await authorizeCredentialsSignIn(parsed.data.username, parsed.data.password);
  if (!user) {
    return errorPayload(event, 400, "BAD_REQUEST", "Invalid username or password.");
  }

  setSession(event, user.id);

  return {
    ok: true,
    message: "Session established.",
  };
});
