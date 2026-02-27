import { getDemoUserById, updateDemoUserRole } from "@reactiveweb/db";

import { requireSession } from "../../../utils/auth-session";
import { assertCanMutateUser } from "../../../utils/authorization";
import { nextRole, recordAuditEvent } from "../../../utils/demo-state";
import { toRole } from "../../../utils/models";
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

  const current = await getDemoUserById(userId);
  if (!current) {
    return errorPayload(event, 404, "NOT_FOUND", "User not found.");
  }

  try {
    assertCanMutateUser(auth.user, { id: current.id, role: toRole(current.role) }, "cycleRole");
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

  const role = nextRole(toRole(current.role));
  if (auth.user.role === "admin" && (role === "owner" || role === "admin")) {
    return errorPayload(
      event,
      403,
      "FORBIDDEN",
      "Admin accounts can only assign viewer/editor roles.",
    );
  }

  await updateDemoUserRole({ userId, role });
  await recordAuditEvent({
    actorId: auth.user.id,
    action: "Updated",
    target: `${current.username} role`,
    details: `${auth.user.username} changed role to ${role}`,
  });

  return {
    ok: true,
    message: "Role updated.",
  };
});
