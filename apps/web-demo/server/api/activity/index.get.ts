import { requireSession } from "../../utils/auth-session";
import { ensureDemoSeeded, listActivity } from "../../utils/demo-state";
import { activityQuerySchema } from "../../utils/models";
import { errorPayload } from "../../utils/responses";

export default defineEventHandler(async (event) => {
  const auth = await requireSession(event);
  if (!auth.ok) {
    return errorPayload(event, auth.statusCode, auth.code, auth.message);
  }

  await ensureDemoSeeded();

  const parsed = activityQuerySchema.safeParse(getQuery(event));
  const query = parsed.success ? parsed.data : activityQuerySchema.parse({});

  const fromDate = query.from ? new Date(query.from) : undefined;
  const toDate = query.to ? new Date(query.to) : undefined;

  const result = await listActivity({
    page: query.page,
    pageSize: query.pageSize,
    action: query.action && query.action !== "All" ? query.action : undefined,
    actorName: query.actor,
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
    to: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
    q: query.q,
  });

  return {
    ok: true,
    activity: result.rows,
    total: result.total,
    page: query.page,
    pageSize: query.pageSize,
    query,
  };
});
