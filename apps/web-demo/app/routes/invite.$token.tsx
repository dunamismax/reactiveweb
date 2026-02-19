import {
  consumeDemoInvite,
  createDemoUser,
  getDemoInviteByToken,
  getDemoUserByEmail,
  updateDemoUserPassword,
  updateDemoUserRole,
  updateDemoUserStatus,
} from "@reactiveweb/db";
import { Button } from "@reactiveweb/ui";
import { Form, Link, useNavigation } from "react-router";
import { InputField } from "~/components/input";
import { SectionHeader } from "~/components/section-header";
import { recordAuditEvent } from "~/lib/demo-state.server";
import { inviteAcceptSchema } from "~/lib/models";
import { hashPassword } from "~/lib/password.server";
import { errorPayload } from "~/lib/server-responses";
import type { Route } from "./+types/invite.$token";

function deriveNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "user";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  const normalized = cleaned.length >= 2 ? cleaned : "New User";
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token;
  if (!token) {
    return {
      valid: false,
      error: "Invite token is missing.",
    };
  }

  const invite = await getDemoInviteByToken(token);
  if (!invite) {
    return {
      valid: false,
      error: "This invite link is invalid or has already been used.",
    };
  }

  if (invite.expiresAt < new Date()) {
    return {
      valid: false,
      error: "This invite link has expired. Ask an admin for a new invite.",
    };
  }

  return {
    valid: true,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const token = params.token;
  if (!token) {
    return errorPayload("BAD_REQUEST", "Invite token is missing.");
  }

  const formData = await request.formData();
  const input = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };
  const parsed = inviteAcceptSchema.safeParse(input);

  if (!parsed.success) {
    return errorPayload(
      "BAD_REQUEST",
      parsed.error.issues[0]?.message ?? "Invalid invite payload.",
    );
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return errorPayload("BAD_REQUEST", "Password confirmation does not match.");
  }

  const invite = await getDemoInviteByToken(token);
  if (!invite) {
    return errorPayload("NOT_FOUND", "This invite link is invalid or has already been used.");
  }

  if (invite.expiresAt < new Date()) {
    return errorPayload("FORBIDDEN", "This invite link has expired.");
  }

  const passwordHash = hashPassword(parsed.data.password);
  const existing = await getDemoUserByEmail(invite.email);

  let userId: string;
  if (existing) {
    const updatedPassword = await updateDemoUserPassword({ userId: existing.id, passwordHash });
    const updatedRole = await updateDemoUserRole({ userId: existing.id, role: invite.role });
    const updatedStatus = await updateDemoUserStatus({ userId: existing.id, active: true });

    if (!updatedPassword || !updatedRole || !updatedStatus) {
      return errorPayload("INTERNAL_ERROR", "Unable to activate invite account.");
    }

    userId = existing.id;
  } else {
    const created = await createDemoUser({
      name: deriveNameFromEmail(invite.email),
      email: invite.email,
      role: invite.role,
      passwordHash,
    });

    if (!created) {
      return errorPayload("INTERNAL_ERROR", "Unable to activate invite account.");
    }

    userId = created.id;
  }

  const consumed = await consumeDemoInvite(invite.id);
  if (!consumed) {
    return errorPayload("NOT_FOUND", "This invite link has already been used.");
  }

  await recordAuditEvent({
    actorId: userId,
    action: "Activated",
    target: `user ${invite.email}`,
    details: `${invite.email} accepted invite and activated account`,
  });

  return {
    ok: true,
    message: "Account activated. You can sign in now.",
  };
}

export default function InviteTokenRoute({ actionData, loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const inviteExpiryLabel =
    loaderData.valid && loaderData.expiresAt
      ? new Date(loaderData.expiresAt).toLocaleString("en-US")
      : "";

  return (
    <section className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
      <SectionHeader
        caption="Invite"
        description="Set your password to activate your account."
        title="Accept Workspace Invite"
      />

      {!loaderData.valid ? (
        <div className="mt-5 rounded-xl border border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] p-4 text-sm text-[var(--tone-error-fg)]">
          <p>{loaderData.error}</p>
          <Link className="mt-3 inline-block text-[var(--accent)] hover:underline" to="/auth">
            Back to sign-in
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
            <p>
              Invite for <span className="font-medium">{loaderData.email}</span> as{" "}
              <span className="font-medium">{loaderData.role}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Expires: {inviteExpiryLabel}</p>
          </div>

          <Form className="mt-5 grid gap-3" method="post">
            <InputField
              autoComplete="new-password"
              label="Password"
              name="password"
              placeholder="At least 8 characters"
              required
              type="password"
            />
            <InputField
              autoComplete="new-password"
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Repeat password"
              required
              type="password"
            />
            <Button disabled={isSubmitting} type="submit">
              Activate Account
            </Button>
          </Form>

          {actionData && "ok" in actionData && actionData.ok ? (
            <div className="mt-4 rounded-xl border border-[var(--tone-success-border)] bg-[var(--tone-success-bg)] p-4 text-sm text-[var(--tone-success-fg)]">
              <p>{actionData.message}</p>
              <Link className="mt-2 inline-block text-[var(--accent)] hover:underline" to="/auth">
                Continue to sign-in
              </Link>
            </div>
          ) : null}

          {actionData && "error" in actionData ? (
            <div className="mt-4 rounded-xl border border-[var(--tone-error-border)] bg-[var(--tone-error-bg)] p-4 text-sm text-[var(--tone-error-fg)]">
              {actionData.error.message}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
