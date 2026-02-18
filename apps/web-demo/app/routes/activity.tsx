import { Form, Link, useNavigation, useSearchParams } from "react-router";
import { Avatar } from "~/components/avatar";
import { actionBadgeVariant, Badge } from "~/components/badge";
import { EmptyState } from "~/components/empty-state";
import { SectionHeader } from "~/components/section-header";
import { Skeleton } from "~/components/skeleton";
import { ensureDemoSeeded, listActivity, requireAuthSession } from "~/lib/demo-state.server";
import { activityQuerySchema } from "~/lib/models";
import type { Route } from "./+types/activity";

function formatActivityTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const ACTION_FILTERS = ["All", "Created", "Updated", "Activated", "Suspended"] as const;

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuthSession(request);
  await ensureDemoSeeded();

  const url = new URL(request.url);
  const rawParams = Object.fromEntries(url.searchParams.entries());
  const parsed = activityQuerySchema.safeParse(rawParams);

  const query = parsed.success ? parsed.data : activityQuerySchema.parse({});
  const { page, pageSize, action, actor, from, to, q } = query;

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const result = await listActivity({
    page,
    pageSize,
    action: action && action !== "All" ? action : undefined,
    actorName: actor,
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
    to: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
    q,
  });

  return {
    activity: result.rows,
    total: result.total,
    page,
    pageSize,
    query,
  };
}

export default function ActivityRoute({ loaderData }: Route.ComponentProps) {
  const { activity, total, page, pageSize, query } = loaderData;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentAction = query.action ?? "All";
  const currentQ = query.q ?? "";

  function buildFilterUrl(action: string) {
    const params = new URLSearchParams(searchParams);
    if (action === "All") {
      params.delete("action");
    } else {
      params.set("action", action);
    }
    params.delete("page");
    const qs = params.toString();
    return qs ? `?${qs}` : "?";
  }

  function buildPageUrl(p: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  function buildExportUrl() {
    const params = new URLSearchParams(searchParams);
    const qs = params.toString();
    return qs ? `/activity/export.csv?${qs}` : "/activity/export.csv";
  }

  return (
    <section>
      <SectionHeader
        caption="Activity Log"
        description="Complete audit trail of workspace mutations. All user management actions are recorded."
        title="Workspace Audit Trail"
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {ACTION_FILTERS.map((f) => (
          <Link
            className={`nav-transition rounded-lg px-3 py-1.5 text-sm font-medium ${
              currentAction === f
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            }`}
            key={f}
            to={buildFilterUrl(f)}
          >
            {f}
          </Link>
        ))}
        <Link
          className="nav-transition rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          to={buildExportUrl()}
        >
          Download CSV
        </Link>
        <span className="ml-auto text-sm text-[var(--muted)]">
          {total} event{total !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-3">
        <Form className="flex items-center gap-2" method="get">
          {currentAction !== "All" && <input name="action" type="hidden" value={currentAction} />}
          <input
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            defaultValue={currentQ}
            name="q"
            placeholder="Search events…"
            type="search"
          />
          <button
            className="nav-transition rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            type="submit"
          >
            Search
          </button>
          {currentQ && (
            <Link
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              to={buildFilterUrl(currentAction)}
            >
              Clear
            </Link>
          )}
        </Form>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                key={i}
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-3 w-48" />
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <EmptyState
            description={
              currentAction !== "All" || currentQ
                ? "No events match your filters. Try adjusting the search or filter."
                : "Events will appear here as workspace actions are performed."
            }
            title="No activity to display"
          />
        ) : (
          <div className="grid gap-3">
            {activity.map((event) => (
              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                key={event.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={event.actor} size="sm" />
                    <p className="text-sm font-medium">{event.actor}</p>
                    <Badge variant={actionBadgeVariant(event.action)}>{event.action}</Badge>
                  </div>
                  <time className="shrink-0 text-xs text-[var(--muted)]">
                    {formatActivityTime(event.createdAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{event.target}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 ? (
            <Link
              className="nav-transition rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              to={buildPageUrl(page - 1)}
            >
              ← Prev
            </Link>
          ) : (
            <span className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm opacity-40">
              ← Prev
            </span>
          )}

          <span className="text-sm text-[var(--muted)]">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              className="nav-transition rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              to={buildPageUrl(page + 1)}
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm opacity-40">
              Next →
            </span>
          )}
        </div>
      )}
    </section>
  );
}
