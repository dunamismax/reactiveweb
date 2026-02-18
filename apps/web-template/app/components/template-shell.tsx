import { Button } from "@reactiveweb/ui";

const starterChecklist = [
  "Rename package and update app metadata",
  "Replace hero copy with product positioning",
  "Add real routes in app/routes.ts",
  "Introduce domain modules before shared extraction",
  "Wire Auth.js only when auth is required",
  "Add env parsing with zod where configuration is consumed",
];

export function TemplateShell() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:py-16">
      <header className="flex flex-col gap-4 border-b border-neutral-300/80 pb-8">
        <span className="inline-flex w-fit rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-medium tracking-[0.2em] uppercase">
          Web Template
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          Ship a new app from this starter, not from scratch.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
          This template is the default baseline for new React Router projects inside ReactiveWeb.
          Keep structure predictable, move fast, and scale shared code deliberately.
        </p>
      </header>

      <section className="grid gap-4 py-8 md:grid-cols-2">
        {starterChecklist.map((item) => (
          <article
            className="rounded-xl border border-neutral-300/80 bg-white/65 p-4 backdrop-blur"
            key={item}
          >
            <p className="text-sm leading-relaxed md:text-base">{item}</p>
          </article>
        ))}
      </section>

      <footer className="mt-auto flex flex-wrap gap-3 border-t border-neutral-300/80 pt-6">
        <Button>Start Building</Button>
        <Button variant="outline">Open Docs</Button>
      </footer>
    </main>
  );
}
