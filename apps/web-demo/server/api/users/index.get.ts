import { listDemoUsers } from "@reactiveweb/db";

import { requireSession } from "../../utils/auth-session";
import { mapDbUserToDemoUser } from "../../utils/demo-state";
import { errorPayload } from "../../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  const users = await listDemoUsers();

  return {
    ok: true,
    users: users.map(mapDbUserToDemoUser),
  };
});
