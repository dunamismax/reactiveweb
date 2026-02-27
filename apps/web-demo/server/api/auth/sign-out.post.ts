import { clearAuthSession, getSessionUser } from "../../utils/auth-session";
import { recordAuditEvent } from "../../utils/demo-state";

export default defineEventHandler(async (event) => {
  const current = await getSessionUser(event);

  if (current) {
    await recordAuditEvent({
      actorId: current.id,
      action: "SignOut",
      target: `auth:user:${current.username}`,
      details: `${current.username} signed out.`,
    });
  }

  clearAuthSession(event);

  return {
    ok: true,
  };
});
