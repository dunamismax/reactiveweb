# web-template

Reusable Nuxt + Vue starter for new apps in `reactiveweb`.

## Includes

- Nuxt file-router baseline
- Vue 3 + TypeScript strict mode
- Tailwind setup with a minimal design system
- Workspace integration for shared packages

## Commands

```bash
/Users/sawyer/.bun/bin/bun run dev
/Users/sawyer/.bun/bin/bun run build
/Users/sawyer/.bun/bin/bun run typecheck
```

## New App Bootstrap

1. Copy this directory: `cp -R apps/web-template apps/<new-app-name>`
2. Rename package metadata in `apps/<new-app-name>/package.json`
3. Replace `pages/index.vue` with app-specific routes/components
4. Run from repo root: `/Users/sawyer/.bun/bin/bun run dev:app <new-app-name>`
