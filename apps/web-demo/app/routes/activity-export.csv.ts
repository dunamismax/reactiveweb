import { ensureDemoSeeded, listActivity, requireAuthSession } from "~/lib/demo-state.server";
import { activityQuerySchema } from "~/lib/models";
import type { Route } from "./+types/activity-export.csv";

function toCsvCell(value: string) {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuthSession(request);
  await ensureDemoSeeded();

  const url = new URL(request.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const parsed = activityQuerySchema.safeParse(rawParams);
  const query = parsed.success ? parsed.data : activityQuerySchema.parse({});

  const fromDate = query.from ? new Date(query.from) : undefined;
  const toDate = query.to ? new Date(query.to) : undefined;

  const filters = {
    action: query.action && query.action !== "All" ? query.action : undefined,
    actorName: query.actor,
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
    to: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
    q: query.q,
  };

  const result = await listActivity({
    ...filters,
    page: 1,
    pageSize: query.pageSize,
    includeAll: true,
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

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="activity.csv"',
      "cache-control": "no-store",
    },
  });
}
