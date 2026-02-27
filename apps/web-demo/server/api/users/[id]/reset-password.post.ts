import { getDemoUserById, updateDemoUserPassword } from "@reactiveweb/db";

import { requireSession } from "../../../utils/auth-session";
import { assertCanMutateUser } from "../../../utils/authorization";
import { recordAuditEvent } from "../../../utils/demo-state";
import { resetPasswordInputSchema, toRole } from "../../../utils/models";
import { hashPassword } from "../../../utils/password";
import { errorPayload } from "../../../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  const userId = getRouterParam(event, "id");
  if (!userId) {
    return errorPayload(event, 400, "BAD_REQUEST", "User ID is required.");
  }

  const body = await readBody(event);
  const parsed = resetPasswordInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid request payload.",
    );
  }

  const current = await getDemoUserById(userId);
  if (!current) {
    return errorPayload(event, 404, "NOT_FOUND", "User not found.");
  }

  try {
    assertCanMutateUser(auth.user, { id: current.id, role: toRole(current.role) }, "resetPassword");
  } catch (error) {
    if (isError(error)) {
      return errorPayload(
        event,
        error.statusCode ?? 403,
        "FORBIDDEN",
        error.statusMessage ?? "Forbidden.",
      );
    }
    throw error;
  }

  const updated = await updateDemoUserPassword({
    userId,
    passwordHash: hashPassword(parsed.data.newPassword),
    mustChangePassword: true,
  });

  if (!updated) {
    return errorPayload(event, 404, "NOT_FOUND", "User account not found.");
  }

  await recordAuditEvent({
    actorId: auth.user.id,
    action: "AdminPasswordReset",
    target: `auth:user:${current.username}`,
    details: `${auth.user.username} reset ${current.username}'s password and enforced rotation.`,
  });

  return {
    ok: true,
    message: "Password reset. User must change it on next sign-in.",
  };
});
