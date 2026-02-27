import { requireSession } from "../../utils/auth-session";
import { ensureDemoSeeded, listActivity } from "../../utils/demo-state";
import { activityQuerySchema } from "../../utils/models";
import { errorPayload } from "../../utils/responses";

function toCsvCell(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

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
    page: 1,
    pageSize: query.pageSize,
    includeAll: true,
    action: query.action && query.action !== "All" ? query.action : undefined,
    actorName: query.actor,
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
    to: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
    q: query.q,
  });

  const rows = result.rows.map((row) => [
    toCsvCell(row.id),
    toCsvCell(row.actor),
    toCsvCell(row.action),
    toCsvCell(row.target),
    toCsvCell(row.createdAt),
  ]);

  const csv = ["id,actor,action,target,timestamp", ...rows.map((cells) => cells.join(","))].join(
    "\n",
  );

  setHeader(event, "content-type", "text/csv; charset=utf-8");
  setHeader(event, "content-disposition", 'attachment; filename="activity.csv"');
  setHeader(event, "cache-control", "no-store");

  return csv;
});
