import { getDemoUserById, updateDemoUserName } from "@reactiveweb/db";

import { requireSession } from "../../utils/auth-session";
import { recordAuditEvent } from "../../utils/demo-state";
import { updateProfileInputSchema } from "../../utils/models";
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
  const parsed = updateProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return errorPayload(
      event,
      400,
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid settings payload.",
    );
  }

  const updated = await updateDemoUserName({
    userId: auth.user.id,
    name: parsed.data.name,
  });

  if (!updated) {
    return errorPayload(event, 404, "NOT_FOUND", "User account not found.");
  }

  await recordAuditEvent({
    actorId: auth.user.id,
    action: "Updated",
    target: `${dbUser.username} profile`,
    details: `${auth.user.username} changed display name to ${parsed.data.name}`,
  });

  return {
    ok: true,
    message: "Profile updated.",
  };
});
