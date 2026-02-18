import {
  createDemoUser,
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
import { demoServerEnv } from "~/lib/env.server";
import {
  createUserInputSchema,
  type DemoUser,
  type Role,
  toRole,
  usersActionSchema,
} from "~/lib/models";
import { hashBootstrapPassword } from "~/lib/password.server";
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

  if (parsed.data.intent === "createUser") {
    const parsedUser = createUserInputSchema.safeParse(parsed.data);
    if (!parsedUser.success) {
      return errorPayload(
        "BAD_REQUEST",
        parsedUser.error.issues[0]?.message ?? "Invalid user payload.",
      );
    }

    assertCanCreateUser(session.user, parsedUser.data.role);

    const created = await createDemoUser({
      ...parsedUser.data,
      passwordHash: hashBootstrapPassword(demoServerEnv.AUTH_DEMO_PASSWORD),
    });
    if (!created) {
      return errorPayload("BAD_REQUEST", "A user with this email already exists.");
    }

    await recordAuditEvent({
      actorId: session.user.id,
      action: "Created",
      target: `user ${created.email}`,
      details: `${session.user.name} created ${created.email}`,
    });

    return { ok: true, message: "User created successfully.", intent: "createUser" as const };
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
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
      if (actionData.intent === "createUser") {
        setName("");
        setEmail("");
        setRole("viewer");
      }
    } else if ("error" in actionData) {
      addToast(actionData.error.message, "error");
    }
  }, [actionData, addToast]);

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
            <input name="intent" type="hidden" value="createUser" />
            <InputField
              label="Name"
              name="name"
              onChange={(event) => setName((event.target as HTMLInputElement).value)}
              placeholder="Jordan Lee"
              value={name}
            />
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
              Create Account
            </Button>
          </Form>
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
                search ? "Try a different search term." : "Create a user to get started."
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
