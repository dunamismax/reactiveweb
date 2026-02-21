# AGENTS.md

> Runtime operations source of truth for `reactiveweb`.
> This file defines what to run, how to run it, and what done looks like.
> For identity and voice, see `SOUL.md`.

---

## First Rule

Read `SOUL.md` first, then this file, then `README.md`, then `COLOR_PALETTE.md`.

---

## Owner

- Name: Stephen Sawyer
- Alias: `dunamismax`
- Home: `/home/sawyer`
- Projects root: `/home/sawyer/github`
- Repo: `/home/sawyer/github/reactiveweb`

---

## Stack Contract (Strict)

Do not deviate from this stack unless Stephen explicitly approves:

- Runtime + package manager + task runner: **Node.js 24.13.1+ + pnpm**
- App framework: **Vite + React Router (framework mode, SPA-first)**
- UI runtime: **React 19 + TypeScript**
- Styling/components: **Tailwind CSS + shadcn/ui patterns**
- Database: **Postgres**
- ORM/migrations: **Drizzle ORM + drizzle-kit**
- Auth baseline when required: **Auth.js**
- Validation: **Zod**
- Formatting/linting: **Biome**

### Disallowed by default

- No `npm` or `yarn` scripts.
- No ESLint/Prettier migration unless explicitly requested.
- No SSR-by-default app setup in this repo.

## Visual Palette Contract (Strict)

- Canonical palette file: `COLOR_PALETTE.md`.
- Theme direction: `Main` > `Dark Soft` is the required visual baseline for all repo UI work.
- Map UI to semantic tokens derived from this palette; do not introduce ad-hoc palettes without explicit approval from Stephen.

---

## Repository Layout

- `apps/` multi-app workspace
- `apps/web-demo` flagship showcase demo app
- `apps/web-template` reusable starter baseline
- `packages/ui` shared UI package
- `packages/db` shared Drizzle/Postgres package
- `packages/config` shared zod/env package
- `scripts/` TypeScript orchestration scripts
- `docs/` architecture and operational docs

---

## Workflow

`Wake -> Explore -> Plan -> Code -> Verify -> Report`

- Prefer smallest reliable diffs.
- Keep changes reviewable and intentional.
- Execute directly, then verify with commands.

### Next-Agent Handoff Prompt (Standard)

- After major completed work and reporting results, ask Stephen whether to generate a handoff prompt for the next AI agent.
- Major completed work means PR-level scope is done or changes were committed/pushed.
- Do not ask after minor one-off tasks, quick clarifications, status updates, or no-change exchanges.
- If Stephen says yes, generate a context-aware next-agent prompt that:
  - uses current repo/app state and recent changes,
  - prioritizes highest-value next steps,
  - includes concrete implementation goals, constraints, verification commands, and expected response format.
- Treat this as part of the normal workflow for every major completed task.

### Live Iteration Loop (Default for Frontend Work)

- Keep one dev server running in the background while iterating.
- Prefer hot-reload/HMR feedback over restart-heavy workflows.
- Make small visual/function changes, then hand off quickly for in-browser review.
- Apply feedback immediately and continue in short iteration cycles.
- Restart the dev server only when required (config/runtime/env changes), not for routine UI edits.
- Keep verification proportional during iteration (`pnpm run lint` minimum), then run full gates before final sign-off.

---

## Command Policy

Use pnpm for all repository operations.
If pnpm is not globally available in the shell, use `corepack pnpm ...`.

### Canonical commands

```bash
pnpm install
pnpm run apps:list
pnpm run dev
pnpm run dev:template
pnpm run dev:app <app-name>
pnpm run db:migrate
pnpm run demo:seed
pnpm run demo:bootstrap
pnpm run build
pnpm run typecheck
pnpm run lint
pnpm run format
pnpm run test:web-demo
```

### App orchestration

- `scripts/cli.ts` is the workspace command entrypoint.
- `node scripts/cli.ts list` discovers apps in `apps/`.
- `node scripts/cli.ts <dev|build|typecheck|test> <app|all>` is the execution contract.

---

## Done Criteria

A task is done only when all are true:

- Requirements are implemented.
- Relevant checks were run and reported.
- `pnpm run lint` passes.
- `pnpm run typecheck` passes.
- `pnpm run build` passes when build-impacting changes exist.
- `pnpm run test:web-demo` passes for `apps/web-demo` behavior/auth/data changes.
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

---

## Platform Baseline (Strict)

- Primary and only local development OS is **macOS**.
- Assume `zsh`, BSD userland, and macOS filesystem paths by default.
- Do not provide or prioritize Windows/PowerShell/WSL instructions.
- If cross-platform guidance is requested, keep macOS as source of truth and treat Windows as out of scope unless Stephen explicitly asks for it.
- Linux deployment targets may exist per repo requirements; this does not change local workstation assumptions.
