# Product

## What this is

Currency Lens is a React-based business intelligence dashboard for analyzing
currency exchange rates and related news data. It is the frontend for an
existing FastAPI backend. Frontend and backend run in separate Docker
containers; in production Nginx serves the built frontend and proxies API
requests to the backend.

The authoritative product and design reference is the frontend design
specification: #[[file:docs/frontend_design_spec.md]]

## Current state

The shared application shell is already built and working:

- Full-height app shell with sidebar, header, and main content area.
- Collapsible left sidebar with Lucide icons and a mobile overlay drawer.
- Light and dark themes with a warm beige palette, a header theme toggle,
  `localStorage` persistence, `prefers-color-scheme` fallback, and a
  pre-mount anti-flash script in `index.html`.
- React Router navigation across three routes, each rendering a minimal
  placeholder.

Current navigation (do not add others yet):

- FX Performance — `/exchange-rates`
- Daily Heatmap — `/daily-heatmap`
- Media Analytics — `/media-analytics`

## Scope guardrails

- The shell and design system are the only foundation currently in scope.
  Treat the shell, beige palette, light/dark themes, sidebar, and Docker
  setup as working features to preserve, not to rebuild.
- Do not implement the analytics pages (FX Performance, Daily Heatmap,
  Media Analytics) until each has an approved specification. Keep the current
  placeholders until then.
- Do not add Prediction or Correlation navigation or pages. Their backend
  APIs and page specs are not ready.
- Do not invent business logic, KPIs, mock metrics, API calls, or
  cross-filtering that the specification has not defined.
- Do not modify the backend project.

## Working style

- Follow the written specification closely. When the spec is silent on a
  detail, prefer the smallest change that satisfies the stated intent and
  surface the decision rather than inventing requirements.
- Prefer reusing what already exists over introducing new structure.
- Stop and report at the end of each task; wait for approval before moving on.
