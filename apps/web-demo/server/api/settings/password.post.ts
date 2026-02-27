import { getDemoUserById, updateDemoUserPassword } from "@reactiveweb/db";

import { requireSession } from "../../utils/auth-session";
import { recordAuditEvent } from "../../utils/demo-state";
import { changePasswordInputSchema } from "../../utils/models";
import { hashPassword, verifyPassword } from "../../utils/password";
import { errorPayload } from "../../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event, { allowPasswordChange: true });
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  const dbUser = await getDemoUserById(auth.user.id);
  if (!dbUser) {
    return errorPayload(event, 401, "UNAUTHORIZED", "Session user no longer exists.");
  }

  const body = await readBody(event);
  const parsed = changePasswordInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid settings payload.",
    );
  }

  if (!dbUser.passwordHash || !verifyPassword(parsed.data.currentPassword, dbUser.passwordHash)) {
    return errorPayload(event, 403, "FORBIDDEN", "Current password is incorrect.");
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      "New password must be different from current password.",
    );
  }

  const updated = await updateDemoUserPassword({
    userId: auth.user.id,
    passwordHash: hashPassword(parsed.data.newPassword),
    mustChangePassword: false,
  });

  if (!updated) {
    return errorPayload(event, 404, "NOT_FOUND", "User account not found.");
  }

  await recordAuditEvent({
    actorId: auth.user.id,
    action: "Updated",
    target: `${dbUser.username} password`,
    details: `${auth.user.username} changed account password`,
  });

  return {
    ok: true,
    message: "Password updated.",
  };
});
