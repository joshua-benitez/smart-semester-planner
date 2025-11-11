# Smart Semester Planner

I'm building this so I stop juggling random spreadsheets and overdue Canvas tabs. It keeps my classes, assignments, and study plan in one place and makes it easy to show off what I shipped.

## Quick Start

```bash
cp .env.example .env.local   # update DATABASE_PROVIDER/URL + NextAuth vars
npm install
npm run verify:env           # quick sanity check before touching Prisma
npx prisma db push           # sync schema to your dev database
npm run db:seed              # optional: load the demo data
npm run dev                  # launches Next.js on http://localhost:3000
```

> 💡 Want a zero-setup local database? Set `DATABASE_PROVIDER=sqlite` and
> `DATABASE_URL="file:./prisma/dev.db"` in `.env.local`, then run `npx prisma db push`.

I use a Neon branch for local development so I get the same Postgres flavor that runs in production, but any Postgres instance works (Docker, Supabase, etc.).

## How It Works

- App Router (Next.js 14) drives the UI with client components where it makes sense.
- Prisma handles the data layer; Postgres everywhere (Neon in prod, Neon branch locally).
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

1. **Database** – spin up a managed Postgres (I’m using Neon). Copy the pooled connection string and stash it in Vercel as `DATABASE_URL`.
2. **Auth env** – in Vercel → Project → Settings → Environment Variables set:
   - `DATABASE_URL` – the pooled Postgres URI (include `?sslmode=require`).
   - `NEXTAUTH_SECRET` – `openssl rand -hex 32` output.
   - `NEXTAUTH_URL` – the exact production URL with `https://` (e.g., `https://courseflow-alpha.vercel.app`).
3. **Schema sync** – before the first deploy run `npx prisma db push` (or `npx prisma migrate deploy`) pointed at that Postgres instance, then `npm run db:seed` if you want demo data.
4. **Deploy** – `git push` and let Vercel build; it runs `next build` + Prisma generate automatically.
5. **Smoke test prod** – create a fresh account, hit `/api/assignments`, and toggle the ladder from the live site to confirm everything talks to Neon.

Once all that passes, I link recruiters/admissions straight to the hosted app so they can click around a real deployment.
