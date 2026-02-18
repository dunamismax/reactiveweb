import { Button } from "@reactiveweb/ui";

const checkpoints = [
  "Bun workspace monorepo ready",
  "Shared UI, DB, and config packages",
  "React Router SPA-first app baseline",
  "Tailwind + shadcn-style component patterns",
];

export function Hero() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-12">
      <p className="mb-4 inline-flex w-fit rounded-full border border-neutral-400/50 px-3 py-1 text-xs tracking-[0.2em] uppercase">
        ReactiveWeb
      </p>
      <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-neutral-900 md:text-6xl">
        One monorepo for every React product you ship.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-700">
        This template app is the first reusable slot inside your platform repo. Build future apps in
        <code className="mx-1 rounded bg-neutral-200 px-2 py-1 text-sm">apps/</code>, share code in{" "}
        <code className="mx-1 rounded bg-neutral-200 px-2 py-1 text-sm">packages/</code>, keep
        orchestration in{" "}
        <code className="mx-1 rounded bg-neutral-200 px-2 py-1 text-sm">scripts/</code>.
      </p>

      <div className="mt-8 flex gap-3">
        <Button>Ship New App</Button>
        <Button variant="outline">Open Architecture Docs</Button>
      </div>

      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {checkpoints.map((item) => (
          <li key={item} className="rounded-xl border border-neutral-300 bg-white/70 p-4">
            {item}
          </li>
        ))}
      </ul>
    </main>
  );
}
