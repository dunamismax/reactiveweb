# Color Palette Library

Living palette library for ReactiveWeb projects.

Last updated: 2026-02-18

## AI Agent Implementation Playbook

Use this checklist whenever applying a palette in this repo.

### Primary Target Files

- `apps/web-demo/app/app.css`: theme token source of truth.
- `packages/ui/src/components/button.tsx`: shared button fallback colors.
- `COLOR_PALETTES.md`: update palette status and ranking notes after each trial.

### Token Mapping Contract (web-demo)

Map palette colors into these CSS custom properties in `apps/web-demo/app/app.css`:

- `--background`: page/base background
- `--panel`: large containers (sidebars/main panels)
- `--surface`: cards/secondary surfaces
- `--border`: border/divider color
- `--foreground`: primary text
- `--muted`: secondary text
- `--accent`: primary action color
- `--accent-foreground`: text/icon color on accent backgrounds
- `--overlay-soft`, `--overlay`, `--overlay-strong`: translucent overlays derived from `--background`
- `--track`: progress/track backgrounds derived from `--surface`
- `--tone-good-*`, `--tone-warn-*`: semantic status tones derived from accent/support colors

### Gradient and Contrast Rules

- Always update the `body` gradient stops in `apps/web-demo/app/app.css` to match the new palette.
- Keep contrast readable:
  - dark backgrounds with lighter text
  - avoid same-luminance foreground/background pairs
  - preserve legibility for forms, table text, and nav states

### Shared UI Fallback Rules

If a palette introduces very different accent/foreground contrast behavior, update fallback values in:

- `packages/ui/src/components/button.tsx`

This prevents non-token contexts from drifting off-theme.

### Required Workflow Per Theme Trial

1. Apply tokens + gradients in `apps/web-demo/app/app.css`.
2. Update `COLOR_PALETTES.md` status for that palette (e.g., `Adopted`, `Favorite`, `Least Favorite`, ranking).
3. Run `bun run lint`.
4. Keep dev server running and iterate via live review.

### Ranking/Status Convention

- `Favorite (Stephen Sawyer)` or `Tied 1st Place (Stephen Sawyer)`
- `2nd Place`, `3rd Place`, etc.
- `Least Favorite (Stephen Sawyer), retained for reference`
- Remove entries entirely only when explicitly requested.

## How To Use This File

- Pick one palette and map roles before implementation:
  - `bg`: page background
  - `surface`: cards/panels
  - `accent`: buttons/links/highlights
  - `text`: primary foreground
  - `muted`: secondary foreground/borders
- Keep one palette per app/page theme pass.
- If a palette feels weak in real UI, mark it `Needs Revision` instead of deleting immediately.
- Add notes after usage: contrast wins/fails, where it worked, where it broke.

## 3-Color Palettes

### Web-Sourced

| Name | Colors | Source | Status |
|---|---|---|---|
| Classic Blue Trio | `#0D6EFD` `#F8F9FA` `#6C757D` | The Marketing Momma + TechByDev list context | 2nd Place Overall (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18, trial) |

### Original

| Name | Colors | Intent | Status |
|---|---|---|---|
| Ink + Sand + Ember | `#101820` `#F2E8CF` `#D97D54` | Editorial, premium, warm contrast | 1st Place Overall (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18, trial) |
| Night + Ice + Signal | `#111827` `#DDEAF7` `#F97316` | SaaS dashboard CTA clarity | 5th Place Overall (Stephen Sawyer), close to 1st for orange CTA + Adopted (`apps/web-demo`, 2026-02-18, trial) |

## 4-Color Palettes

### Web-Sourced

| Name | Colors | Source | Status |
|---|---|---|---|

### Original

| Name | Colors | Intent | Status |
|---|---|---|---|
| Steel Harbor | `#0B132B` `#1C2541` `#3A506B` `#E0FBFC` | Dark UI with crisp readability | Favorite (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18) |

## 5-Color Palettes

### Web-Sourced

| Name | Colors | Source | Status |
|---|---|---|---|

### Original

| Name | Colors | Intent | Status |
|---|---|---|---|
| Midnight Citrus | `#0B132B` `#1C2541` `#3A506B` `#5BC0BE` `#F6AE2D` | Dark SaaS with energetic CTA | Adopted (`apps/web-demo`, 2026-02-18, trial) |
| Harbor Night | `#0A1128` `#001F54` `#034078` `#1282A2` `#FEFCFB` | Trust-heavy product sites | Least Favorite (Stephen Sawyer), retained for reference |
| Mono + Volt | `#0A0A0A` `#2A2A2A` `#6B7280` `#E5E7EB` `#A3E635` | Developer tooling / dashboards | Least Favorite (Stephen Sawyer), retained for reference |
| Fjord + Rust | `#102A43` `#243B53` `#486581` `#F0B429` `#D64545` | Analytical UI with warm focus | Adopted (`apps/web-demo`, 2026-02-18, trial) |
| Soft Brutalism | `#111827` `#E5E7EB` `#9CA3AF` `#2563EB` `#F59E0B` | Brutalist layout with polish | 3rd Place Overall (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18, trial) |
| Matcha Editorial | `#283618` `#606C38` `#DDA15E` `#FEFAE0` `#BC6C25` | Magazine and brand sites | Adopted (`apps/web-demo`, 2026-02-18, trial) |
| Nordic Glow | `#1F2937` `#374151` `#9CA3AF` `#F9FAFB` `#22D3EE` | Clean product landing pages | 4th Place Overall (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18, trial) |

## Dark Themes Lab (80s/90s Hacker + Modern Dark)

All palettes in this section are intentionally dark-first.

### Web-Researched Dark Themes

| Name | Colors | Research Basis | Status |
|---|---|---|---|
| Nord Polar Night | `#2E3440` `#3B4252` `#434C5E` `#88C0D0` `#ECEFF4` | Nord official palette | 5th Place Dark Theme (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18, trial) |
| GitHub Dark Signal | `#0D1117` `#161B22` `#30363D` `#58A6FF` `#C9D1D9` | GitHub dark UI language reference | Tied 2nd Place Dark Theme (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18, trial) |

### Original Dark Themes (Hacker / Retro)

| Name | Colors | Vibe | Status |
|---|---|---|---|
| BBS Blue Steel | `#070B14` `#101A2B` `#1C2D46` `#5DA9E9` `#D6E4FF` | Dial-up BBS control panel | 4th Place Dark Theme (Stephen Sawyer) + Adopted (`apps/web-demo`, 2026-02-18, trial) |

## Fast Selection Guide

- Want dramatic dark UI: `Steel Harbor`, `Midnight Oil`, `Midnight Citrus`, `Harbor Night`.
- Want clean SaaS look: `Executive`, `Nordic Glow`, `Soft Brutalism`, `Night + Ice + Signal`.
- Want warmer brand feel: `Olive Paper`, `Matcha Editorial`, `Vintage Home`, `Ink + Sand + Ember`.
- Want bold/creative: `Sunset Gradient`, `Neon Pulse`, `Night Orchard`, `Ember Field`.
- Want retro hacker vibes: `BBS Blue Steel`.

## Change Log

- 2026-02-18: Initial version created with web-sourced and original palettes; structured for ongoing iteration.
- 2026-02-18: Added dark-only research section for modern dark UI and 80s/90s hacker-inspired palettes.

## Sources

- ColorMagic API docs: https://colormagic.app/api
- TechByDev palette collection: https://www.techbydev.site/design/styling
- The Marketing Momma trend article: https://themarketingmomma.com/top-trending-color-palettes-for-websites-in-2025/
- ColorCombos scheme example: https://www.colorcombos.com/combos/id/4/ColorCombo4
- Colorfa palette ideas article: https://colorfa.me/blog/color-palette-ideas-2025
- WCAG 2.1 contrast guidance: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- Material Design dark theme guidance: https://material.io/design/color/dark-theme.html
- web.dev dark mode design guidance: https://web.dev/articles/prefers-color-scheme
- Nord official palette: https://www.nordtheme.com/
- Dracula official colors: https://draculatheme.com/contribute
- Catppuccin official docs: https://catppuccin.com/palette/
- cool-retro-term (CRT inspiration): https://github.com/Swordfish90/cool-retro-term
