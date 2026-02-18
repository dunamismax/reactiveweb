# reactiveweb

Monorepo for Stephen Sawyer's React projects and apps, built on Node.js + pnpm and a shared TypeScript-first stack.

## Stack

- Node.js 24.13.1+ + pnpm workspaces
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
corepack enable
pnpm install
docker rm -f reactiveweb-postgres 2>/dev/null || true
docker run -d \
  --name reactiveweb-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=reactiveweb \
  -p 55432:5432 \
  postgres:16-alpine
cp .env.example .env
set -a; source .env; set +a
pnpm run demo:bootstrap
pnpm run dev
```

`AUTH_DEMO_PASSWORD` is a local bootstrap credential source. `web-demo` stores and verifies per-user password hashes in Postgres.
`55432` avoids collisions with existing local Postgres services bound to `5432`.

## Workspace Commands

```bash
# list all apps
pnpm run apps:list

# run flagship demo app
pnpm run dev

# run reusable starter template app
pnpm run dev:template

# run a specific app
pnpm run dev:app web-template

# database bootstrap helpers for web-demo
pnpm run db:migrate
pnpm run demo:seed
pnpm run demo:bootstrap

# quality checks
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test:web-demo
```

## Starter Apps

- `apps/web-demo`: exemplar dashboard app covering Auth.js + Postgres-backed sessions/users/audit flows
- `apps/web-template`: reusable baseline for cloning new apps
