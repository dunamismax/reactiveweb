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
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/reactiveweb"
export AUTH_SECRET="replace-with-16+-char-secret"
export AUTH_DEMO_PASSWORD="replace-with-demo-password"
export VITE_DEMO_ADMIN_EMAIL="admin@reactiveweb.dev"
bun run demo:bootstrap
bun run dev
```

`AUTH_DEMO_PASSWORD` is a local bootstrap credential source. `web-demo` stores and verifies per-user password hashes in Postgres.

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

# database bootstrap helpers for web-demo
bun run db:migrate
bun run demo:seed
bun run demo:bootstrap

# quality checks
bun run lint
bun run typecheck
bun run build
bun run test:web-demo
```

## Starter Apps

- `apps/web-demo`: exemplar dashboard app covering Auth.js + Postgres-backed sessions/users/audit flows
- `apps/web-template`: reusable baseline for cloning new apps
