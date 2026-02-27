import { getDemoUserById, updateDemoUserStatus } from "@reactiveweb/db";

import { requireSession } from "../../../utils/auth-session";
import { assertCanMutateUser } from "../../../utils/authorization";
import { recordAuditEvent } from "../../../utils/demo-state";
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
    assertCanMutateUser(auth.user, { id: current.id, role: toRole(current.role) }, "toggleStatus");
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

  const nextActive = !current.active;
  await updateDemoUserStatus({ userId, active: nextActive });
  await recordAuditEvent({
    actorId: auth.user.id,
    action: nextActive ? "Activated" : "Suspended",
    target: current.username,
    details: `${auth.user.username} set status to ${nextActive ? "active" : "suspended"}`,
  });

  return {
    ok: true,
    message: "Status updated.",
  };
});
