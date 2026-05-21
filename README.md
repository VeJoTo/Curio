# Curio

A daily-curiosity mobile app. One illustrated topic a day, with quick or deep-dive flows and a small quiz.

## Repo layout

```
shared/      zod schemas (single source of truth)
api/         Cloudflare Workers + Hono (push, devices, schedules)
app/         Expo + Expo Router (iOS + Android)
authoring/   Node CLI for AI-assisted topic authoring
```

## Setup

```bash
nvm use            # Node 20
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

## Design docs

- Spec: `docs/superpowers/specs/2026-05-20-curio-design.md`
- Plans: `docs/superpowers/plans/`
