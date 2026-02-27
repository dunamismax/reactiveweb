import { listDemoUsers, listRecentDemoActivity } from "@reactiveweb/db";

import { requireSession } from "../../utils/auth-session";
import { mapDbActivityToEvent, mapDbUserToDemoUser } from "../../utils/demo-state";
import { errorPayload } from "../../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  const userId = getRouterParam(event, "id");
  if (!userId) {
    return errorPayload(event, 400, "BAD_REQUEST", "User ID is required.");
  }

  const [allUsers, allActivity] = await Promise.all([listDemoUsers(), listRecentDemoActivity(100)]);
  const dbUser = allUsers.find((u) => u.id === userId);

  if (!dbUser) {
    return errorPayload(event, 404, "NOT_FOUND", "User not found.");
  }

  const activity = allActivity
    .filter(
      (row) =>
        row.actorId === dbUser.id ||
        row.target.toLowerCase().includes(dbUser.username.toLowerCase()),
    )
    .slice(0, 20)
    .map(mapDbActivityToEvent);

  return {
    ok: true,
    user: mapDbUserToDemoUser(dbUser),
    activity,
  };
});
