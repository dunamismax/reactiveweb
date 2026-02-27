import { listDemoUsers, listRecentDemoActivity } from "@reactiveweb/db";

import { requireSession } from "../utils/auth-session";
import {
  buildActivityTrend,
  ensureDemoSeeded,
  fetchActivityTrendRows,
  mapDbActivityToEvent,
  mapDbUserToDemoUser,
} from "../utils/demo-state";
import { errorPayload } from "../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  await ensureDemoSeeded();

  const [users, activity, trendRows] = await Promise.all([
    listDemoUsers(),
    listRecentDemoActivity(12),
    fetchActivityTrendRows(7),
  ]);

  return {
    ok: true,
    currentUserName: auth.user.name,
    users: users.map(mapDbUserToDemoUser),
    activity: activity.map(mapDbActivityToEvent),
    trend: buildActivityTrend(trendRows, 7),
  };
});
