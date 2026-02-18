import { Button } from "@reactiveweb/ui";
import { type FormEvent, useState } from "react";

import { demoAuthConfig, demoCredentialsHint } from "~/lib/auth-config";
import { useDemoStore } from "~/lib/demo-store";
import { demoEnv } from "~/lib/env";

export default function AuthRoute() {
  const {
    state: { authenticatedUserId },
    currentUserName,
    signIn,
    signOut,
  } = useDemoStore();

  const [email, setEmail] = useState(demoCredentialsHint.email);
  const [password, setPassword] = useState(demoCredentialsHint.password);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = signIn({ email, password });

    if (!result.ok) {
      setFeedback(result.error ?? "Sign-in failed.");
      return;
    }

    setFeedback("Session established.");
  }

  return (
    <section>
      <header className="border-b border-[var(--border)] pb-4">
        <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">Auth Lab</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Auth.js Integration Surface</h2>
        <p className="mt-2 text-sm text-[var(--muted)] md:text-base">
          Demonstrates typed Auth.js configuration, credential validation, and session-aware UI.
        </p>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Credentials Demo</p>
          <form className="mt-3 grid gap-3" onSubmit={handleSignIn}>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Email</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 outline-none focus:border-[var(--accent)]"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--muted)]">Password</span>
              <input
                className="rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 outline-none focus:border-[var(--accent)]"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            <div className="flex gap-2">
              <Button type="submit">Sign In</Button>
              <Button onClick={signOut} type="button" variant="outline">
                Sign Out
              </Button>
            </div>
          </form>
          {feedback ? <p className="mt-3 text-sm text-[var(--muted)]">{feedback}</p> : null}
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm font-medium">Session Diagnostics</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Authenticated</dt>
              <dd>{authenticatedUserId ? "yes" : "no"}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Current Identity</dt>
              <dd>{currentUserName}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Session Strategy</dt>
              <dd>{demoAuthConfig.session?.strategy}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
              <dt className="text-[var(--muted)]">Sign-in Route</dt>
              <dd>{demoAuthConfig.pages?.signIn}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[var(--muted)]">Demo Admin Email</dt>
              <dd>{demoEnv.VITE_DEMO_ADMIN_EMAIL}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
