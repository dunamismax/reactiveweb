import { getDemoUserById } from "@reactiveweb/db";

import { requireSession } from "../../utils/auth-session";
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

  return {
    ok: true,
    profile: {
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      mustChangePassword: dbUser.mustChangePassword,
      role: dbUser.role,
      lastSeenAt: dbUser.lastSeenAt ? dbUser.lastSeenAt.toISOString() : null,
    },
  };
});
