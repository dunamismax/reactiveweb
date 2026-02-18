# web-template

Reusable React Router SPA starter for new apps in `reactiveweb`.

## What this template includes

- React Router framework mode with `ssr: false`
- React 19 + TypeScript baseline
- Tailwind CSS setup
- Shared UI package integration via `@reactiveweb/ui`
- Starter route structure and starter layout components

## Commands

```bash
pnpm run dev
pnpm run build
pnpm run typecheck
```

## New app bootstrap flow

1. Copy this directory: `cp -R apps/web-template apps/<new-app-name>`
2. Rename the package in `apps/<new-app-name>/package.json`
3. Update route content and metadata in `app/root.tsx` and `app/routes/home.tsx`
4. Run from repo root: `pnpm run dev:app <new-app-name>`
