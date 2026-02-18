# reactiveweb

Monorepo for Stephen's React projects and apps, built on Bun and a shared TypeScript-first stack.

## Stack

- Bun + Bun workspaces
- Vite + React Router (framework mode, SPA-first)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui patterns
- Postgres + Drizzle ORM + drizzle-kit
- Auth.js (when needed per app)
- Zod for input/env validation
- Biome for linting + formatting

## Repo Layout

- `apps/` application projects
- `apps/web-demo` flagship stack showcase app
- `apps/web-template` reusable starter for future apps
- `packages/ui` shared React UI primitives (shadcn-style)
- `packages/db` shared Drizzle schema/config baseline
- `packages/config` shared zod/env config helpers
- `scripts/` orchestration CLI for app commands
- `docs/` architecture and operational docs

## Quick Start

```bash
bun install
bun run apps:list
bun run dev
```

## Workspace Commands

```bash
# list all apps
bun run apps:list

# run flagship demo app
bun run dev

# run reusable starter template app
bun run dev:template

# run a specific app
bun run dev:app web-template

# quality checks
bun run lint
bun run typecheck
```

## Starter Apps

- `apps/web-demo`: exemplar dashboard app covering auth, user flows, and stack integrations
- `apps/web-template`: reusable baseline for cloning new apps
