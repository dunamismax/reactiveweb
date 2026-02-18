import {
  createDemoInvite,
  getDemoUserById,
  listDemoUsers,
  updateDemoUserRole,
  updateDemoUserStatus,
} from "@reactiveweb/db";
import { Button } from "@reactiveweb/ui";
import { useEffect, useMemo, useState } from "react";
import { Form, Link, useNavigation, useSubmit } from "react-router";
import { Avatar } from "~/components/avatar";
import { Badge, roleBadgeVariant, statusBadgeVariant } from "~/components/badge";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { EmptyState } from "~/components/empty-state";
import { InputField } from "~/components/input";
import { SectionHeader } from "~/components/section-header";
import { SelectField } from "~/components/select";
import { Skeleton } from "~/components/skeleton";
import { useToast } from "~/components/toast";
import { assertCanCreateUser, assertCanMutateUser } from "~/lib/authorization.server";
import {
  mapDbUserToDemoUser,
  nextRole,
  recordAuditEvent,
  requireAuthSession,
} from "~/lib/demo-state.server";
import {
  type DemoUser,
  inviteUserInputSchema,
  type Role,
  toRole,
  usersActionSchema,
} from "~/lib/models";
import { errorPayload } from "~/lib/server-responses";
import type { Route } from "./+types/users";

const roleOptions: { value: string; label: string }[] = [
  { value: "viewer", label: "viewer" },
  { value: "editor", label: "editor" },
  { value: "admin", label: "admin" },
  { value: "owner", label: "owner" },
];

type SortColumn = "name" | "role" | "status" | "lastSeenAt";
type SortDir = "asc" | "desc";

type PendingAction = {
  intent: "cycleRole" | "toggleStatus";
  userId: string;
  userName: string;
  description: string;
  tone: "danger" | "warning" | "default";
};

const roleOrder: Record<string, number> = {
  owner: 0,
  admin: 1,
  editor: 2,
  viewer: 3,
};

function getNextRole(current: Role): Role {
  const roles: Role[] = ["viewer", "editor", "admin", "owner"];
  const idx = roles.indexOf(current);
  return roles[(idx + 1) % roles.length] ?? "viewer";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="opacity-30">↕</span>;
  return <span>{dir === "asc" ? "↑" : "↓"}</span>;
}

function SortableHeader({
  col,
  current,
  dir,
  label,
  onSort,
}: {
  col: SortColumn;
  current: SortColumn;
  dir: SortDir;
  label: string;
  onSort: (col: SortColumn) => void;
}) {
  const isActive = current === col;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        className={`flex items-center gap-1 text-left transition-colors hover:text-[var(--foreground)] ${
          isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"
        }`}
        onClick={() => onSort(col)}
        type="button"
      >
        {label}
        <SortIcon active={isActive} dir={dir} />
      </button>
    </th>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuthSession(request);
  const users = await listDemoUsers();

  return {
    users: users.map(mapDbUserToDemoUser),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAuthSession(request);
  const formData = await request.formData();
  const rawInput = Object.fromEntries(formData.entries());
  const parsed = usersActionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return errorPayload(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid request payload.",
    );
  }

  if (parsed.data.intent === "inviteUser") {
    const parsedInvite = inviteUserInputSchema.safeParse(parsed.data);
    if (!parsedInvite.success) {
      return errorPayload(
        "BAD_REQUEST",
        parsedInvite.error.issues[0]?.message ?? "Invalid invite payload.",
      );
    }

    assertCanCreateUser(session.user, parsedInvite.data.role);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    const token = crypto.randomUUID().replaceAll("-", "");
    const invite = await createDemoInvite({
      email: parsedInvite.data.email,
      role: parsedInvite.data.role,
      token,
      expiresAt,
    });
    if (!invite) {
      return errorPayload("INTERNAL_ERROR", "Unable to generate invite.");
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: "Invited",
      target: `user ${invite.email}`,
      details: `${session.user.name} generated invite for ${invite.email} (${invite.role})`,
    });

    const inviteUrl = new URL(`/invite/${invite.token}`, request.url).toString();
    return {
      ok: true,
      message: "Invite link generated.",
      inviteUrl,
      inviteExpiresAt: invite.expiresAt.toISOString(),
      intent: "inviteUser" as const,
    };
  }

  const current = await getDemoUserById(parsed.data.userId);
  if (!current) {
    return errorPayload("NOT_FOUND", "User not found.");
  }

  assertCanMutateUser(
    session.user,
    { id: current.id, role: toRole(current.role) },
    parsed.data.intent,
  );

  if (parsed.data.intent === "cycleRole") {
    const role = nextRole(toRole(current.role));

    if (session.user.role === "admin" && (role === "owner" || role === "admin")) {
      return errorPayload("FORBIDDEN", "Admin accounts can only assign viewer/editor roles.");
    }

    await updateDemoUserRole({ userId: parsed.data.userId, role });

    await recordAuditEvent({
      actorId: session.user.id,
      action: "Updated",
      target: `${current.email} role`,
      details: `${session.user.name} changed role to ${role}`,
    });

    return { ok: true, message: "Role updated.", intent: "cycleRole" as const };
  }

  const nextActive = !current.active;
  await updateDemoUserStatus({ userId: parsed.data.userId, active: nextActive });

  await recordAuditEvent({
    actorId: session.user.id,
    action: nextActive ? "Activated" : "Suspended",
    target: current.email,
    details: `${session.user.name} set status to ${nextActive ? "active" : "suspended"}`,
  });

  return { ok: true, message: "Status updated.", intent: "toggleStatus" as const };
}

export default function UsersRoute({ loaderData, actionData }: Route.ComponentProps) {
  const { users } = loaderData;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [latestInviteExpiresAt, setLatestInviteExpiresAt] = useState("");
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isLoading = navigation.state === "loading";
  const submit = useSubmit();
  const { addToast } = useToast();

  useEffect(() => {
    if (!actionData) return;
    if ("ok" in actionData && actionData.ok) {
      addToast(actionData.message, "success");
      if (actionData.intent === "inviteUser") {
        setEmail("");
        setRole("viewer");
        setLatestInviteUrl(actionData.inviteUrl);
        setLatestInviteExpiresAt(actionData.inviteExpiresAt);
      }
    } else if ("error" in actionData) {
      addToast(actionData.error.message, "error");
    }
  }, [actionData, addToast]);

  async function copyInviteLink() {
    if (!latestInviteUrl) return;
    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      addToast("Invite link copied to clipboard.", "info");
    } catch {
      addToast("Unable to copy invite link.", "warning");
    }
  }

  function handleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDir("asc");
    }
  }

  function requestAction(user: DemoUser, intent: "cycleRole" | "toggleStatus") {
    if (intent === "cycleRole") {
      const next = getNextRole(user.role);
      setPendingAction({
        intent,
        userId: user.id,
        userName: user.name,
        description: `Change ${user.name}'s role from ${user.role} to ${next}.`,
        tone: "default",
      });
    } else {
      const willSuspend = user.status === "active";
      setPendingAction({
        intent,
        userId: user.id,
        userName: user.name,
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

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q),
    );
  }, [users, search]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortColumn === "name") return a.name.localeCompare(b.name) * dir;
      if (sortColumn === "role") {
        return ((roleOrder[a.role] ?? 4) - (roleOrder[b.role] ?? 4)) * dir;
      }
      if (sortColumn === "status") return a.status.localeCompare(b.status) * dir;
      if (sortColumn === "lastSeenAt") {
        return (new Date(a.lastSeenAt).getTime() - new Date(b.lastSeenAt).getTime()) * dir;
      }
      return 0;
    });
  }, [filteredUsers, sortColumn, sortDir]);

  return (
    <section>
      <SectionHeader
        caption="User Management"
        description="Server-side validation and authorization are enforced for every mutation."
        title="Team Access Controls"
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Invite User</p>
          <Form className="mt-3 grid gap-3" method="post">
            <input name="intent" type="hidden" value="inviteUser" />
            <InputField
              label="Email"
              name="email"
              onChange={(event) => setEmail((event.target as HTMLInputElement).value)}
              placeholder="jordan@reactiveweb.dev"
              type="email"
              value={email}
            />
            <SelectField
              label="Role"
              name="role"
              onChange={(event) => setRole((event.target as HTMLSelectElement).value as Role)}
              options={roleOptions}
              value={role}
            />
            <Button disabled={isSubmitting} type="submit">
              Generate Invite Link
            </Button>
          </Form>

          {latestInviteUrl ? (
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--overlay-soft)] p-3">
              <p className="text-xs tracking-[0.15em] text-[var(--muted)] uppercase">
                Latest Invite
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Expires: {new Date(latestInviteExpiresAt).toLocaleString("en-US")}
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]"
                  readOnly
                  value={latestInviteUrl}
                />
                <button
                  className="nav-transition rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface)]"
                  onClick={copyInviteLink}
                  type="button"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : null}
        </article>

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted)]">
              {sortedUsers.length} of {users.length} users
            </p>
            <input
              className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--overlay)] px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              type="search"
              value={search}
            />
          </div>

          {sortedUsers.length === 0 && !isLoading ? (
            <EmptyState
              description={
                search ? "Try a different search term." : "Generate an invite link to get started."
              }
              title={search ? "No users match your search" : "No users yet"}
            />
          ) : (
            <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3 font-medium text-[var(--muted)]" />
                    <SortableHeader
                      col="name"
                      current={sortColumn}
                      dir={sortDir}
                      label="User"
                      onSort={handleSort}
                    />
                    <SortableHeader
                      col="role"
                      current={sortColumn}
                      dir={sortDir}
                      label="Role"
                      onSort={handleSort}
                    />
                    <SortableHeader
                      col="status"
                      current={sortColumn}
                      dir={sortDir}
                      label="Status"
                      onSort={handleSort}
                    />
                    <SortableHeader
                      col="lastSeenAt"
                      current={sortColumn}
                      dir={sortDir}
                      label="Last Seen"
                      onSort={handleSort}
                    />
                    <th className="px-4 py-3 font-medium text-[var(--muted)]">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr
                          className="border-b border-[var(--border)]"
                          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
                          key={i}
                        >
                          <td className="px-4 py-3">
                            <Skeleton className="size-9 rounded-full" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="mb-1 h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-5 w-14 rounded-full" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-3 w-20" />
                          </td>
                          <td className="px-4 py-3">
                            <Skeleton className="h-3 w-20" />
                          </td>
                        </tr>
                      ))
                    : sortedUsers.map((user) => (
                        <tr
                          className="row-interactive border-b border-[var(--border)]"
                          key={user.id}
                        >
                          <td className="px-4 py-3 align-middle">
                            <Link to={`/users/${user.id}`}>
                              <Avatar name={user.name} size="md" />
                            </Link>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Link to={`/users/${user.id}`}>
                              <p className="font-medium transition-colors hover:text-[var(--accent)]">
                                {user.name}
                              </p>
                              <p className="text-xs text-[var(--muted)]">{user.email}</p>
                            </Link>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <button
                              className="cursor-pointer"
                              onClick={() => requestAction(user, "cycleRole")}
                              type="button"
                            >
                              <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                            </button>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <button
                              className="cursor-pointer"
                              onClick={() => requestAction(user, "toggleStatus")}
                              type="button"
                            >
                              <Badge variant={statusBadgeVariant(user.status)}>{user.status}</Badge>
                            </button>
                          </td>
                          <td className="px-4 py-3 align-top text-[var(--muted)]">
                            {formatTimestamp(user.lastSeenAt)}
                          </td>
                          <td className="px-4 py-3 align-top text-xs text-[var(--muted)]">
                            {formatTimestamp(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </article>
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
            ? `Change role for ${pendingAction.userName}`
            : `Update status for ${pendingAction?.userName ?? ""}`
        }
        tone={pendingAction?.tone ?? "default"}
      />
    </section>
  );
}
