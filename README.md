# CleanNest

Cleaning services booking platform — Next.js, TypeScript, Tailwind CSS, MongoDB Atlas.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in your MongoDB Atlas connection string.
3. `npm run dev`

## Folder structure

- `src/app` — Next.js App Router, grouped by route: `(public)`, `(auth)`, `(customer)`, `(cleaner)`, `(admin)`, `api`
- `src/components` — `ui` (shadcn primitives), `layout`, `booking`, `dashboard`, `shared`
- `src/lib` — db connection, auth config, pricing engine, OTP, email
- `src/services` — data-access layer per entity
- `src/models` — Mongoose schemas
- `src/types` — shared TypeScript types
- `src/hooks` — custom React hooks
- `src/store` — booking wizard client state

## Developer documentation

See [`docs/DEVELOPER_HANDOVER.md`](docs/DEVELOPER_HANDOVER.md) for architecture, environment variables, data models, API routes, authentication, workflows, testing, deployment, and known issues.
