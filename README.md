# reactiveweb

Monorepo for Stephen Sawyer's Nuxt/Vue projects, built on Bun workspaces with a shared TypeScript-first stack.

## Stack

- Bun 1.3+ workspaces
- Nuxt + Vue 3 (SSR-capable, SPA-friendly)
- TypeScript strict mode
- Tailwind CSS + semantic design tokens
- Postgres + Drizzle ORM + drizzle-kit
- Zod for input/env validation
- Biome for linting + formatting

## Visual Identity

- Canonical palette file: `COLOR_PALETTE.md`
- Required baseline: `Main` > `Dark Soft`
- UI color usage maps to semantic tokens in `apps/web-demo/assets/css/main.css`

## Repo Layout

- `apps/` application projects
- `apps/web-demo` flagship full-stack Nuxt app
- `apps/web-template` reusable Nuxt starter
- `packages/ui` intentionally small shared class/style helpers, not a component framework
- `packages/db` shared Drizzle schema/config baseline
- `packages/config` shared zod/env helpers
- `scripts/` workspace orchestration CLI and bootstrap scripts
- `docs/` architecture and operational docs

## Quick Start

```bash
bun install
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
bun run demo:bootstrap
bun run dev
```

## Username-First Auth Bootstrap

1. Bootstrap DB + seed data:
```bash
bun run demo:bootstrap
```
2. Start the app:
```bash
bun run dev
```
3. Open `/auth`.
4. Sign in with username `owner` (or `DEMO_OWNER_USERNAME` / `NUXT_PUBLIC_DEMO_OWNER_USERNAME`) and password `AUTH_DEMO_PASSWORD`.
5. Public sign-up creates viewer accounts.

## Workspace Commands

```bash
# list apps
bun run apps:list

# run flagship demo app
bun run dev

# run starter template app
bun run dev:template

# run a specific app
bun run dev:app web-template

# DB bootstrap helpers
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

- `apps/web-demo`: full-stack Nuxt dashboard app covering auth, RBAC, audit logging, and settings
- `apps/web-template`: Nuxt starter baseline for new apps

## Auth Architecture

- `apps/web-demo` uses a custom signed-cookie session layer in `server/utils/auth-session.ts`.
- The session token only stores subject + timestamps; active user state, role checks, and password-rotation enforcement are always resolved server-side from Postgres.
- Auth.js is not currently used in this repo.
