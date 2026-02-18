import {
  getDemoUserById,
  listDemoUsers,
  listRecentDemoActivity,
  updateDemoUserRole,
  updateDemoUserStatus,
} from "@reactiveweb/db";
import { useEffect, useState } from "react";
import { Link, useNavigation, useSubmit } from "react-router";
import { z } from "zod";
import { Avatar } from "~/components/avatar";
import { Badge, roleBadgeVariant, statusBadgeVariant } from "~/components/badge";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { SectionHeader } from "~/components/section-header";
import { useToast } from "~/components/toast";
import { assertCanMutateUser } from "~/lib/authorization.server";
import {
  mapDbActivityToEvent,
  mapDbUserToDemoUser,
  nextRole,
  recordAuditEvent,
  requireAuthSession,
} from "~/lib/demo-state.server";
import { type Role, toRole } from "~/lib/models";
import { errorPayload } from "~/lib/server-responses";
import type { Route } from "./+types/user-detail";

const userDetailActionSchema = z.object({
  intent: z.enum(["cycleRole", "toggleStatus"]),
  userId: z.string().uuid("Invalid user id."),
});

type PendingAction = {
  intent: "cycleRole" | "toggleStatus";
  userId: string;
  description: string;
  tone: "danger" | "warning" | "default";
};

function getNextRole(current: Role): Role {
  const roles: Role[] = ["viewer", "editor", "admin", "owner"];
  const idx = roles.indexOf(current);
  return roles[(idx + 1) % roles.length] ?? "viewer";
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAuthSession(request);

  const userId = params.id;
  if (!userId) {
    throw Response.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "User ID is required." } },
      { status: 400 },
    );
  }

  const [allUsers, allActivity] = await Promise.all([listDemoUsers(), listRecentDemoActivity(100)]);

  const dbUser = allUsers.find((u) => u.id === userId);
  if (!dbUser) {
    throw Response.json(
      { ok: false, error: { code: "NOT_FOUND", message: "User not found." } },
      { status: 404 },
    );
  }

  const user = mapDbUserToDemoUser(dbUser);

  const userActivity = allActivity
    .filter(
      (row) =>
        row.actorId === dbUser.id || row.target.toLowerCase().includes(dbUser.email.toLowerCase()),
    )
    .slice(0, 20)
    .map(mapDbActivityToEvent);

  return { user, activity: userActivity };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuthSession(request);
  const formData = await request.formData();
  const rawInput = Object.fromEntries(formData.entries());
  const parsed = userDetailActionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return errorPayload(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid request payload.",
    );
  }

  const { intent, userId } = parsed.data;
  const current = await getDemoUserById(userId);
  if (!current) {
    return errorPayload("NOT_FOUND", "User not found.");
  }

  assertCanMutateUser(session.user, { id: current.id, role: toRole(current.role) }, intent);

  if (intent === "cycleRole") {
    const role = nextRole(toRole(current.role));
    if (session.user.role === "admin" && (role === "owner" || role === "admin")) {
      return errorPayload("FORBIDDEN", "Admin accounts can only assign viewer/editor roles.");
    }
    await updateDemoUserRole({ userId, role });
    await recordAuditEvent({
      actorId: session.user.id,
      action: "Updated",
      target: `${current.email} role`,
      details: `${session.user.name} changed role to ${role}`,
    });
    return { ok: true, message: "Role updated." };
  }

  const nextActive = !current.active;
  await updateDemoUserStatus({ userId, active: nextActive });
  await recordAuditEvent({
    actorId: session.user.id,
    action: nextActive ? "Activated" : "Suspended",
    target: current.email,
    details: `${session.user.name} set status to ${nextActive ? "active" : "suspended"}`,
  });
  return { ok: true, message: "Status updated." };
}

export default function UserDetailRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { user, activity } = loaderData;
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submit = useSubmit();
  const { addToast } = useToast();

  useEffect(() => {
    if (!actionData) return;
    if ("ok" in actionData && actionData.ok) {
      addToast(actionData.message, "success");
    } else if ("error" in actionData) {
      addToast(actionData.error.message, "error");
    }
  }, [actionData, addToast]);

  function requestAction(intent: "cycleRole" | "toggleStatus") {
    if (intent === "cycleRole") {
      const next = getNextRole(user.role);
      setPendingAction({
        intent,
        userId: user.id,
        description: `Change ${user.name}'s role from ${user.role} to ${next}.`,
        tone: "default",
      });
    } else {
      const willSuspend = user.status === "active";
      setPendingAction({
        intent,
        userId: user.id,
        description: willSuspend
          ? `Suspend ${user.name}'s account. They will lose access immediately.`
          : `Activate ${user.name}'s account and restore access.`,
        tone: willSuspend ? "danger" : "default",
      });
    }
  }

  function handleConfirm() {
    if (!pendingAction) return;
    submit({ intent: pendingAction.intent, userId: pendingAction.userId }, { method: "post" });
    setPendingAction(null);
  }

  const actionBadgeColors: Record<string, string> = {
    created:
      "border-[var(--role-admin-border)] bg-[var(--role-admin-bg)] text-[var(--role-admin-fg)]",
    updated:
      "border-[var(--role-editor-border)] bg-[var(--role-editor-bg)] text-[var(--role-editor-fg)]",
    activated:
      "border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] text-[var(--tone-success-fg)]",
    suspended:
      "border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] text-[var(--tone-error-fg)]",
    seeded: "border-[var(--border)] bg-[var(--overlay-soft)] text-[var(--muted)]",
  };

  return (
    <section>
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-4">
        <Link
          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          to="/users"
        >
          ← Users
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-5">
        <Avatar name={user.name} size="lg" />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight">{user.name}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
            <Badge variant={statusBadgeVariant(user.status)}>{user.status}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs tracking-[0.15em] text-[var(--muted)] uppercase">Account Info</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Member since</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Last seen</dt>
              <dd>{formatDate(user.lastSeenAt)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--muted)]">User ID</dt>
              <dd className="font-mono text-xs text-[var(--muted)]">{user.id.slice(0, 8)}…</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs tracking-[0.15em] text-[var(--muted)] uppercase">Actions</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Click a control to change this user's role or status. Both require confirmation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="nav-transition rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:opacity-40"
              disabled={isSubmitting}
              onClick={() => requestAction("cycleRole")}
              type="button"
            >
              Cycle role → <span className="text-[var(--muted)]">{getNextRole(user.role)}</span>
            </button>
            <button
              className={`nav-transition rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 ${
                user.status === "active"
                  ? "border-[var(--tone-error-border)] text-[var(--tone-error-fg)] hover:bg-[var(--tone-error-bg)]"
                  : "border-[var(--tone-success-border)] text-[var(--tone-success-fg)] hover:bg-[var(--tone-success-bg)]"
              }`}
              disabled={isSubmitting}
              onClick={() => requestAction("toggleStatus")}
              type="button"
            >
              {user.status === "active" ? "Suspend account" : "Activate account"}
            </button>
          </div>
        </article>
      </div>

      <div className="mt-6">
        <SectionHeader
          caption="Timeline"
          title="Activity"
          description="Recent audit events where this user was the actor or subject."
        />
        <div className="mt-4 grid gap-3">
          {activity.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--overlay-soft)] px-6 py-10 text-center">
              <p className="text-sm text-[var(--muted)]">No recorded activity for this user.</p>
            </div>
          ) : (
            activity.map((event) => (
              <article
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                key={event.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={event.actor} size="sm" />
                    <span className="text-sm font-medium">{event.actor}</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                        actionBadgeColors[event.action.toLowerCase()] ??
                        "border-[var(--border)] bg-[var(--overlay-soft)] text-[var(--muted)]"
                      }`}
                    >
                      {event.action}
                    </span>
                  </div>
                  <time className="shrink-0 text-xs text-[var(--muted)]">
                    {formatTime(event.createdAt)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{event.target}</p>
              </article>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        description={pendingAction?.description ?? ""}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        open={pendingAction !== null}
        title={
          pendingAction?.intent === "cycleRole"
            ? `Change role for ${user.name}`
            : `Update status for ${user.name}`
        }
        tone={pendingAction?.tone ?? "default"}
      />
    </section>
  );
}
