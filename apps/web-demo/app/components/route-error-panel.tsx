import { isRouteErrorResponse, useRouteError } from "react-router";

type ErrorPayload = {
  ok?: false;
  error?: {
    code?: string;
    message?: string;
  };
};

type RouteErrorPanelProps = {
  title?: string;
};

export function RouteErrorPanel({ title = "Request failed" }: RouteErrorPanelProps) {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    const payload = (error.data ?? null) as ErrorPayload | null;
    const code = payload?.error?.code ?? `HTTP_${error.status}`;
    const message = payload?.error?.message ?? error.statusText;

    return (
      <section className="mx-auto max-w-[720px] rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">{title}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{code}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>
      </section>
    );
  }

  const message = error instanceof Error ? error.message : "Unknown server error.";
  return (
    <section className="mx-auto max-w-[720px] rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
      <p className="text-xs tracking-[0.2em] text-[var(--muted)] uppercase">{title}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Unhandled Error</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>
    </section>
  );
}
