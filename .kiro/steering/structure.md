# Structure

This file records the current, actual folder and import conventions. It
describes what exists today, not a target to migrate toward. Do not silently
move files or change aliases based on this document.

## Current layout (as-is)

```
/                         repo root
  index.html              anti-flash theme script + app mount
  vite.config.ts          React + Tailwind plugins; alias "@" -> ./src
  components.json          shadcn config; aliases "@/components", "@/lib", ...
  tsconfig.app.json        paths: "@/*" -> ["./src/*"]
  Dockerfile, nginx.conf, .dockerignore   deployment (preserve)
  docs/
    frontend_design_spec.md   authoritative design/spec (real filename is
                              lowercase)
  src/
    main.tsx              React entry
    App.tsx               entire app shell: App -> BrowserRouter -> Shell,
                          plus ThemeToggle, AppSidebar, PagePlaceholder,
                          and the `routes` config array
    components/ui/        shadcn/ui components
      button.tsx
      card.tsx
      select.tsx
      tooltip.tsx
    lib/
      utils.ts            re-exports `cn` from the `cn` package
    index.css             Tailwind import + centralized theme tokens + layout CSS
    App.css               leftover Vite starter CSS, not imported anywhere
    assets/               starter images (hero.png, react.svg, vite.svg)
```

## Import conventions (as-is)

- Import shadcn components (and other `src` modules) via the `@` alias, e.g.
  `import { Button } from "@/components/ui/button";`. The alias `@/*` resolves
  to `./src/*` in both `vite.config.ts` and `tsconfig.app.json`. Prefer the
  alias over long relative paths.
- shadcn/ui components import the class helper as `import { cn } from "cn"`
  (the standalone `cn` npm package). `@/lib/utils.ts` simply re-exports it.
  This differs from the usual local `clsx` + `tailwind-merge` util; keep new
  components consistent with the existing `cn` convention.
- Routes, page titles, and descriptions come from the single `routes` array in
  `App.tsx`. Derive header title/description from the current route rather than
  duplicating strings elsewhere. Keep this structure easy to extend.

## RESOLVED — alias/folder mismatch

The earlier mismatch between the `@` alias and a stray top-level `@/` folder has
been resolved. For history: shadcn components used to live in a real top-level
directory literally named `@`, imported via relative paths, while the `@/*`
alias actually pointed at `./src/*` — so the alias and the files never agreed.

Resolution applied:

- The components were moved into `src`: `src/components/ui/*` and
  `src/lib/utils.ts`.
- `App.tsx` now imports via the alias (`@/components/ui/button`).
- The empty top-level `@/` folder was removed.
- `vite.config.ts`, `tsconfig.app.json`, and `components.json` were left
  unchanged — the `@/* -> ./src/*` mapping and the shadcn aliases are now
  consistent with where the files live, so the shadcn CLI resolves correctly.

Verified after the change: `tsc --noEmit -p tsconfig.app.json` (exit 0) and
`tsc -b && vite build` (exit 0, `dist/` produced).

## Component reuse — mandatory

Before creating any component, utility, or hook:

1. Inspect what already exists — the shadcn/ui components in `@/components/ui`
   (`button`, `card`, `select`, `tooltip`), the `cn` helper in `@/lib/utils.ts`,
   the shell sub-components in `App.tsx`, and the installed dependencies.
2. Reuse an existing component or utility whenever it fits the need.
3. Only create something new when existing pieces are genuinely insufficient,
   and when you do, state in the task report which existing components you
   checked and why they could not be reused.

Do not create duplicate or parallel versions of components that already exist.

## Suggested future organization (NOT yet created)

The design spec suggests, for later work, folders such as
`src/components/layout/` (AppLayout, AppHeader, AppSidebar),
`src/features/<page>/`, `src/hooks/`, `src/lib/`, and `src/types/`, plus a small
theme provider/hook. These do not exist yet. Introduce them only under an
approved spec or task, and only when they add real value — avoid abstractions
that are not useful for the current scope.

## Change discipline

- Inspect the relevant files before implementing anything.
- Stay within the scope of the approved specification or task.
- Avoid unrelated refactors (for example, do not remove the leftover
  `src/App.css` or rework unrelated imports unless a task explicitly covers it).
- Validate every implementation task with the commands in `tech.md`.
