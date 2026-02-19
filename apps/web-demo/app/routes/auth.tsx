import { createDemoUser, getDemoUserByUsername } from "@reactiveweb/db";
import { Button } from "@reactiveweb/ui";
import { useEffect, useMemo, useState } from "react";
import { Form, useNavigation, useSearchParams } from "react-router";
import { DataList } from "~/components/data-list";
import { InputField } from "~/components/input";
import { SectionHeader } from "~/components/section-header";
import { forwardSignIn, forwardSignOut, getAuthSession } from "~/lib/auth.server";
import {
  demoAuthUiConfig,
  sanitizeCallbackPath,
  validateSignInPayload,
  validateSignUpPayload,
} from "~/lib/auth-config";
import {
  AUTH_PASSWORD_MIN_LENGTH,
  AUTH_PASSWORD_POLICY_MESSAGE,
  normalizeUsernameForAudit,
} from "~/lib/auth-policy";
import { ensureDemoSeeded, recordAuditEvent } from "~/lib/demo-state.server";
import { demoServerEnv } from "~/lib/env.server";
import { authActionSchema } from "~/lib/models";
import { hashPassword } from "~/lib/password.server";
import { errorPayload } from "~/lib/server-responses";
import { formatLockoutMessage, getSignInLockoutState } from "~/lib/sign-in-attempts.server";
import type { Route } from "./+types/auth";

export async function loader({ request }: Route.LoaderArgs) {
  await ensureDemoSeeded();
  const session = await getAuthSession(request);

  return {
    authenticatedUserId: session?.user?.id ?? null,
    currentUserName: session?.user?.name ?? "Visitor Session",
    ownerUsername: demoServerEnv.VITE_DEMO_OWNER_USERNAME,
    authEnabled: true,
    sessionStrategy: demoAuthUiConfig.sessionStrategy,
    signInRoute: demoAuthUiConfig.signInRoute,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const input = Object.fromEntries(formData.entries());
  const parsed = authActionSchema.safeParse(input);

  if (!parsed.success) {
    const username = normalizeUsernameForAudit(formData.get("username"));
    const intent = formData.get("intent");
    if (intent === "signIn" || intent === "signUp") {
      await recordAuditEvent({
        actorId: null,
        action: intent === "signIn" ? "SignInFailure" : "SignUpFailure",
        target: `auth:user:${username}`,
        details: `${intent === "signIn" ? "Sign-in" : "Sign-up"} failed for ${username}; payload validation failed.`,
      });
    }

    return errorPayload("BAD_REQUEST", parsed.error.issues[0]?.message ?? "Invalid auth payload.");
  }

  if (parsed.data.intent === "signIn") {
    const validated = validateSignInPayload(parsed.data);
    if (!validated.success) {
      const username = normalizeUsernameForAudit(formData.get("username"));
      await recordAuditEvent({
        actorId: null,
        action: "SignInFailure",
        target: `auth:user:${username}`,
        details: `Sign-in failed for ${username}; payload validation failed.`,
      });

      return errorPayload("BAD_REQUEST", validated.error.issues[0]?.message ?? "Sign-in failed.");
    }

    const lockout = await getSignInLockoutState(validated.data.username);
    if (lockout.isLocked && lockout.lockedUntil) {
      await recordAuditEvent({
        actorId: null,
        action: "SignInFailure",
        target: `auth:user:${validated.data.username}`,
        details: `Sign-in blocked for ${validated.data.username}; temporary lockout active until ${lockout.lockedUntil.toISOString()}.`,
      });

      return errorPayload("BAD_REQUEST", formatLockoutMessage(lockout.lockedUntil));
    }

    return forwardSignIn(
      request,
      validated.data.username,
      validated.data.password,
      sanitizeCallbackPath(formData.get("callbackUrl"), demoAuthUiConfig.signInCallbackPath),
    );
  }

  if (parsed.data.intent === "signUp") {
    const username = normalizeUsernameForAudit(formData.get("username"));
    const validated = validateSignUpPayload(parsed.data);
    if (!validated.success) {
      await recordAuditEvent({
        actorId: null,
        action: "SignUpFailure",
        target: `auth:user:${username}`,
        details: `Sign-up failed for ${username}; payload validation failed.`,
      });

      return errorPayload("BAD_REQUEST", validated.error.issues[0]?.message ?? "Sign-up failed.");
    }

    const existing = await getDemoUserByUsername(validated.data.username);
    if (existing) {
      await recordAuditEvent({
        actorId: existing.id,
        action: "SignUpFailure",
        target: `auth:user:${validated.data.username}`,
        details: `Sign-up failed for ${validated.data.username}; username already exists.`,
      });

      return errorPayload("BAD_REQUEST", "That username is already in use.");
    }

    const created = await createDemoUser({
      name: validated.data.name,
      username: validated.data.username,
      role: "viewer",
      passwordHash: hashPassword(validated.data.password),
      mustChangePassword: false,
    });

    if (!created) {
      await recordAuditEvent({
        actorId: null,
        action: "SignUpFailure",
        target: `auth:user:${validated.data.username}`,
        details: `Sign-up failed for ${validated.data.username}; user creation returned no record.`,
      });

      return errorPayload("INTERNAL_ERROR", "Unable to create account.");
    }

    await recordAuditEvent({
      actorId: created.id,
      action: "SignUpSuccess",
      target: `auth:user:${created.username}`,
      details: `${created.username} created an account via public sign-up.`,
    });

    return {
      ok: true,
      intent: "signUp" as const,
      message: "Account created. Sign in with your new credentials.",
    };
  }

  return forwardSignOut(
    request,
    sanitizeCallbackPath(formData.get("callbackUrl"), demoAuthUiConfig.signOutCallbackPath),
  );
}

export default function AuthRoute({ loaderData, actionData }: Route.ComponentProps) {
  const {
    authenticatedUserId,
    currentUserName,
    ownerUsername,
    authEnabled,
    sessionStrategy,
    signInRoute,
  } = loaderData;

  const [signInUsername, setSignInUsername] = useState(ownerUsername);
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [searchParams] = useSearchParams();

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (!actionData || !("ok" in actionData) || !actionData.ok) {
      return;
    }

    if (actionData.intent === "signUp") {
      setSignUpUsername("");
      setSignUpName("");
      setSignUpPassword("");
      setSignUpConfirmPassword("");
    }
  }, [actionData]);

  const feedback = useMemo(() => {
    if (actionData && "error" in actionData) {
      return { message: actionData.error.message ?? "Auth request failed.", isError: true };
    }

    if (actionData && "ok" in actionData && actionData.ok && actionData.intent === "signUp") {
      return { message: actionData.message, isError: false };
    }

    const status = searchParams.get("status");
    const error = searchParams.get("error");

    if (error) {
      return { message: "Sign-in failed. Check your credentials and try again.", isError: true };
    }

    if (status === "signed-in") {
      return { message: "Session established.", isError: false };
    }

    if (status === "signed-out") {
      return { message: "Session cleared.", isError: false };
    }

    return null;
  }, [actionData, searchParams]);

  return (
    <section>
      <SectionHeader
        caption="Auth Lab"
        description="Demonstrates typed Auth.js configuration, credential validation, and session-aware UI."
        title="Auth.js Integration Surface"
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Credentials Demo</p>
          <Form className="mt-3 grid gap-3" method="post" viewTransition>
            <input name="intent" type="hidden" value="signIn" />
            <input name="callbackUrl" type="hidden" value={demoAuthUiConfig.signInCallbackPath} />
            <InputField
              autoComplete="username"
              label="Username"
              name="username"
              onChange={(event) => setSignInUsername((event.target as HTMLInputElement).value)}
              value={signInUsername}
            />
            <InputField
              autoComplete="current-password"
              label="Password"
              name="password"
              onChange={(event) => setSignInPassword((event.target as HTMLInputElement).value)}
              type="password"
              value={signInPassword}
            />
            <Button disabled={isSubmitting} type="submit">
              Sign In
            </Button>
          </Form>
          <Form className="mt-2" method="post" viewTransition>
            <input name="intent" type="hidden" value="signOut" />
            <input name="callbackUrl" type="hidden" value={demoAuthUiConfig.signOutCallbackPath} />
            <Button disabled={isSubmitting} type="submit" variant="outline">
              Sign Out
            </Button>
          </Form>
          {feedback ? (
            <p
              className={`mt-3 text-sm ${feedback.isError ? "text-[var(--tone-error-fg)]" : "text-[var(--tone-success-fg)]"}`}
            >
              {feedback.message}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Create Account</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Public sign-up creates a viewer account with username/password credentials.
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{AUTH_PASSWORD_POLICY_MESSAGE}</p>
          <Form className="mt-3 grid gap-3" method="post" viewTransition>
            <input name="intent" type="hidden" value="signUp" />
            <InputField
              autoComplete="name"
              label="Display Name"
              name="name"
              onChange={(event) => setSignUpName((event.target as HTMLInputElement).value)}
              required
              value={signUpName}
            />
            <InputField
              autoComplete="username"
              label="Username"
              name="username"
              onChange={(event) => setSignUpUsername((event.target as HTMLInputElement).value)}
              required
              value={signUpUsername}
            />
            <InputField
              autoComplete="new-password"
              label="Password"
              minLength={AUTH_PASSWORD_MIN_LENGTH}
              name="password"
              onChange={(event) => setSignUpPassword((event.target as HTMLInputElement).value)}
              required
              type="password"
              value={signUpPassword}
            />
            <InputField
              autoComplete="new-password"
              label="Confirm Password"
              minLength={AUTH_PASSWORD_MIN_LENGTH}
              name="confirmPassword"
              onChange={(event) =>
                setSignUpConfirmPassword((event.target as HTMLInputElement).value)
              }
              required
              type="password"
              value={signUpConfirmPassword}
            />
            <Button disabled={isSubmitting} type="submit" variant="outline">
              Create Account
            </Button>
          </Form>
        </article>
      </div>

      <article className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-medium">Session Diagnostics</p>
        <div className="mt-3">
          <DataList
            items={[
              { label: "Authenticated", value: authenticatedUserId ? "yes" : "no" },
              { label: "Current Identity", value: currentUserName },
              { label: "Session Strategy", value: sessionStrategy },
              { label: "Sign-in Route", value: signInRoute },
              { label: "Auth Demo Enabled", value: String(authEnabled) },
              { label: "Demo Owner Username", value: ownerUsername },
            ]}
          />
        </div>
      </article>
    </section>
  );
}
