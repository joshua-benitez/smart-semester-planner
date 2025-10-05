# Smart Semester Planner

I'm building this so I stop juggling random spreadsheets and overdue Canvas tabs. It keeps my classes, assignments, and study plan in one place and makes it easy to show off what I shipped.

## Quick Start

```bash
npm install
npm run db:push   # creates the local SQLite dev file
npm run dev       # launches Next.js on http://localhost:3000
```

Demo data lives in `prisma/seed.ts` if you want a populated dashboard.

## How It Works

- App Router (Next.js 14) drives the UI with client components where it makes sense.
- Prisma handles the data layer; SQLite locally, Postgres when I deploy.
- NextAuth manages email/password auth with JWT sessions.
- React Query keeps the assignment and ladder data in sync without me hand-rolling caches.
- Tailwind is doing the styling lift so I can focus on features.

## Core Features

- Track assignments across every class, filter by course, and mark progress.
- Paste a syllabus and let the chrono-powered parser guess dates, types, and difficulty.
- Calendar and dashboard views that highlight the next deadlines and weekly workload.
- "Ladder" system that gives me a game-style points recap whenever I finish or reopen work.
- Profile page to tweak preferences and update my info.

## Project Layout

```
app/                    # routes and layouts (App Router)
components/             # UI pieces and feature-specific components
hooks/                  # React Query hooks for assignments, ladder, preferences
lib/                    # auth config, prisma client, parser, validation helpers
prisma/                 # schema + seed data
public/                 # static assets (logo, etc.)
types/                  # shared TypeScript types
```

## In-Progress / Next Up

- Add background jobs so the ladder can bank points until after deadlines.
- Write parser and API tests instead of trusting vibes.
- Drop in grade tracking once the core workflow is rock solid.

## Deploy Notes (Vercel)

1. Grab a managed Postgres instance (Neon/Supabase/Vercel Postgres) and set `DATABASE_URL`.
2. Add the following env vars in Vercel settings:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
3. Switch the Prisma datasource to `postgresql` before running `npx prisma migrate deploy` (or `db push` if you keep it lightweight).
4. Run a smoke check locally:
   - `next build`
   - hit `/api/assignments` with a logged-in session
   - sign in/out once to confirm auth.
5. Deploy and repeat the same checklist against the production URL.

That’s the baseline I show recruiters/admissions so they know the project actually runs.
