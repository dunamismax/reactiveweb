# AGENTS.md

> Runtime operations source of truth for `reactiveweb`.
> This file defines what to run, how to run it, and what done looks like.
> For identity and voice, see `SOUL.md`.

---

## First Rule

Read `SOUL.md` first, then this file, then `README.md`.

---

## Owner

- Name: Stephen
- Alias: `dunamismax`
- Home: `/home/sawyer`
- Projects root: `/home/sawyer/github`
- Repo: `/home/sawyer/github/reactiveweb`

---

## Stack Contract (Strict)

Do not deviate from this stack unless Stephen explicitly approves:

- Runtime + package manager + task runner: **Bun** (`bun`, `bunx`)
- App framework: **Vite + React Router (framework mode, SPA-first)**
- UI runtime: **React 19 + TypeScript**
- Styling/components: **Tailwind CSS + shadcn/ui patterns**
- Database: **Postgres**
- ORM/migrations: **Drizzle ORM + drizzle-kit**
- Auth baseline when required: **Auth.js**
- Validation: **Zod**
- Formatting/linting: **Biome**

### Disallowed by default

- No npm/pnpm/yarn scripts.
- No ESLint/Prettier migration unless explicitly requested.
- No SSR-by-default app setup in this repo.

---

## Repository Layout

- `apps/` multi-app workspace
- `apps/web-sample` showcase sample app
- `apps/web-template` reusable starter baseline
- `packages/ui` shared UI package
- `packages/db` shared Drizzle/Postgres package
- `packages/config` shared zod/env package
- `scripts/` Bun TypeScript orchestration scripts
- `docs/` architecture and operational docs

---

## Workflow

`Wake -> Explore -> Plan -> Code -> Verify -> Report`

- Prefer smallest reliable diffs.
- Keep changes reviewable and intentional.
- Execute directly, then verify with commands.

---

## Command Policy

Use Bun for all repository operations.

### Canonical commands

```bash
bun install
bun run apps:list
bun run dev
bun run dev:template
bun run dev:app <app-name>
bun run build
bun run typecheck
bun run lint
bun run format
```

### App orchestration

- `scripts/cli.ts` is the workspace command entrypoint.
- `bun run scripts/cli.ts list` discovers apps in `apps/`.
- `bun run scripts/cli.ts <dev|build|typecheck> <app|all>` is the execution contract.

---

## Done Criteria

A task is done only when all are true:

- Requirements are implemented.
- Relevant checks were run and reported.
- `bun run lint` passes.
- `bun run typecheck` passes.
- `bun run build` passes when build-impacting changes exist.
- Docs are aligned with behavior changes.

---

## Safety Rules

- Ask before destructive deletes or external system changes.
- Keep commits focused and atomic.
- Never claim success without verification output.
- Escalate when uncertainty is high and blast radius is non-trivial.

---

## Living Document Protocol

- Keep this file current-state only.
- Update whenever stack, workflows, or safety posture changes.
- Synchronize with `SOUL.md` whenever repo identity or operating assumptions change.
