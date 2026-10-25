# Tech

## Stack (locked)

Use the existing project configuration and installed dependencies. Do not
reinstall, replace, upgrade, or remove parts of the stack unless a concrete
technical issue requires it and the change has been approved.

- React 19 + React DOM
- TypeScript (~6)
- Vite 8 (`@vitejs/plugin-react`, `@tailwindcss/vite`)
- Tailwind CSS v4
- shadcn/ui on Base UI (`@base-ui/react`, style `base-nova`)
- Lucide React (icon library)
- React Router 7 (`react-router-dom`)
- Apache ECharts 6 + `echarts-for-react`
- Axios
- TanStack Query, TanStack Table, TanStack Virtual
- `class-variance-authority`, `cn`, `tw-animate-css`
- `@fontsource-variable/geist` (Geist Variable font)

Avoid adding new dependencies. Do not add a global state-management library
solely for theme switching — the existing shared theme state in the shell is
sufficient.

## Theme and tokens

- Theme-dependent colors are defined centrally as semantic CSS custom
  properties in `src/index.css` under `:root` and `.dark`, wired to Tailwind
  through `@theme inline`.
- Do not hardcode theme colors in components. Use the semantic tokens
  (`--background`, `--foreground`, `--card`, `--primary`, `--border`, `--ring`,
  `--sidebar*`, `--chart-1..5`, etc.).
- The beige palette values are initial design decisions, adjustable for
  contrast/accessibility, but must stay centralized.

## Validation (mandatory after every implementation task)

These commands were verified passing against the current project:

- Type check: `tsc --noEmit -p tsconfig.app.json` (verified exit 0, no errors)
- Production build: `tsc -b && vite build` (verified exit 0, `dist/` produced,
  ~1974 modules transformed)

Run both after any implementation task. Fix any new TypeScript errors or build
failures before reporting a task complete. Never claim a check passed unless it
actually ran successfully.

A non-fatal Vite 8 warning is currently emitted: `vite.config.ts` uses
`__dirname`, which Vite's future native config loader wants as
`import.meta.dirname`. The build still succeeds. Do not change
`vite.config.ts` as an unrelated fix; only address it under an approved task.

## PowerShell execution-policy constraint

This is a Windows machine using PowerShell. The `npx` / npm `.ps1` and `.cmd`
shims are blocked by the system execution policy, so commands like
`npx tsc ...` or `npm run build` fail with an "execution of scripts is
disabled" / `UnauthorizedAccess` error.

Work around this by invoking the Node binaries directly, for example:

- `node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json`
- `node ./node_modules/typescript/bin/tsc -b`
- `node ./node_modules/vite/bin/vite.js build`

Do NOT weaken the machine's security settings to work around this. Do not run
`Set-ExecutionPolicy`, do not bypass the policy per-invocation, and do not
change system or user security configuration. The direct-node invocation is the
approved approach.

The interactive terminal in this environment may echo the typed command
character-by-character and report an unreliable exit code. When an exit code is
in doubt, redirect command output to a file and read the file, or verify the
effect directly (for example, inspect freshly produced `dist/` output).

## Engineering requirements

- Use TypeScript; avoid `any`.
- Use Lucide React for icons and React Router for client-side navigation.
- Keep components focused, typed, reusable, and free of business logic in
  layout code.
- Provide accessible labels, visible focus states, and keyboard interaction.
- Do not expose secrets or commit `.env` files.
- Preserve the existing `Dockerfile`, `nginx.conf`, and `.dockerignore` unless
  a specific, approved issue requires a change.
