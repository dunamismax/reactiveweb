import { listRecentDemoActivity } from "@reactiveweb/db";
import { useMemo, useState } from "react";
import { useNavigation } from "react-router";
import { Avatar } from "~/components/avatar";
import { Badge } from "~/components/badge";
import { EmptyState } from "~/components/empty-state";
import { SectionHeader } from "~/components/section-header";
import { Skeleton } from "~/components/skeleton";
import {
  ensureDemoSeeded,
  mapDbActivityToEvent,
  requireAuthSession,
} from "~/lib/demo-state.server";
import type { Route } from "./+types/activity";

function formatActivityTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const actionFilters = ["All", "Created", "Updated", "Activated", "Suspended"] as const;

type ActionBadgeVariant = "default" | "active" | "suspended" | "editor" | "admin";

function actionBadgeVariant(action: string): ActionBadgeVariant {
  const lower = action.toLowerCase();
  if (lower === "created") return "admin";
  if (lower === "updated") return "editor";
  if (lower === "activated") return "active";
  if (lower === "suspended") return "suspended";
  return "default";
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuthSession(request);
  await ensureDemoSeeded();

  const activity = await listRecentDemoActivity(50);
  return {
    activity: activity.map(mapDbActivityToEvent),
  };
}

export default function ActivityRoute({ loaderData }: Route.ComponentProps) {
  const { activity } = loaderData;
  const [filter, setFilter] = useState<string>("All");
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const filtered = useMemo(() => {
    if (filter === "All") return activity;
    return activity.filter((e) => e.action.toLowerCase() === filter.toLowerCase());
  }, [activity, filter]);

  return (
    <section>
      <SectionHeader
        caption="Activity Log"
        description="Complete audit trail of workspace mutations. All user management actions are recorded."
        title="Workspace Audit Trail"
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {actionFilters.map((f) => (
          <button
            className={`nav-transition rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === f
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            }`}
            key={f}
            onClick={() => setFilter(f)}
            type="button"
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-sm text-[var(--muted)]">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
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
        ) : filtered.length === 0 ? (
          <EmptyState
            description={
              filter !== "All"
                ? `No "${filter}" events found. Try a different filter.`
                : "Events will appear here as workspace actions are performed."
            }
            title="No activity to display"
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((event) => (
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
    </section>
  );
}
