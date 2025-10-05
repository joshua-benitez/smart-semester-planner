# Smart Semester Planner

Assignment tracker for students with course management, calendar view, and fast syllabus parsing.

## Getting Started

```bash
npm install
npm run db:push  # Set up database (SQLite dev by default)
npm run dev      # Start development server
```

## Database Configuration

- Development uses SQLite by default via `DATABASE_URL=file:./dev.db`.
- For production, configure `DATABASE_URL` to a PostgreSQL connection string and switch the Prisma datasource provider to `postgresql` if desired.

Example `.env` entries are provided in `.env.example`.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma + SQLite (dev) / PostgreSQL (prod)
- NextAuth.js
- TailwindCSS
- React Query

## Features

- Assignment tracking (create, edit, delete, list)
- Syllabus parsing with natural language dates (chrono)
- Dashboard and course management
- Auth via NextAuth (credentials), protected routes
- In-app calendar view

Roadmap
- Grade tracking and projections
- Tests for parser and APIs

## Project Structure

```
smart-semester-planner/
├── app/                             # Next.js App Router
│   ├── (auth)/                      # Auth route group
│   │   └── signin/page.tsx          # Sign in page
│   ├── (dashboard)/                 # Dashboard route group
│   │   └── page.tsx                 # Main dashboard
│   ├── api/                         # API routes
│   │   ├── assignments/             # Assignment CRUD (list/create/update/delete)
│   │   └── auth/[...nextauth]/      # NextAuth.js
│   ├── assignments/                 # Assignment pages
│   ├── calendar/                    # Calendar view
│   ├── profile/                     # User profile
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing page
│   └── providers.tsx                # Context providers
│
├── components/                      # React components
│   ├── ui/                          # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── AssignmentCard.tsx          # Assignment display
│   ├── DailyCheckModal.tsx         # Daily check-in modal
│   ├── Navigation.tsx              # Navigation bar
│   ├── features/ladder/            # Productivity ladder UI widgets
│   └── UrgencyIndicator.tsx        # Priority indicator
│
├── hooks/                          # Custom React hooks
│   ├── useAssignments.ts           # Assignment data
│   └── useDailyCheck.ts            # Daily check state
│
├── lib/                            # Core business logic
│   ├── auth.ts                     # Authentication config
│   ├── db.ts                       # Database client
│   ├── parser.ts                   # Syllabus parser (chrono-based)
│   ├── utils.ts                    # Utility functions
│   └── validations.ts              # Input validation
│
├── prisma/                         # Database
│   ├── schema.prisma               # Database schema (SQLite dev; Postgres prod)
│   └── seed.ts                     # Sample data (optional)
│
├── types/                          # TypeScript types
│   └── index.ts
│
└── Config files
    ├── .env.example                # Environment variables
    ├── .eslintrc.json              # ESLint config
    ├── .gitignore                  # Git ignore
    ├── middleware.ts               # Next.js middleware
    ├── next.config.mjs             # Next.js config
    ├── package.json                # Dependencies
    ├── prettier.config.js          # Code formatting
    ├── tailwind.config.js          # TailwindCSS config
    └── tsconfig.json               # TypeScript config
```

## Progress Log (Today)

What we shipped today so it’s easy to pick up tomorrow:

- Productivity ladder foundation
  - Added ladder models (`LadderStanding` / `LadderEvent`) and seeded the demo user with sample point history.
  - Replaced the streak scaffold with `/api/ladder` GET/POST and helper logic for steps/levels.
  - Hooked the sidebar card to the ladder summary via `useLadder`; shows step, level, progress, and event placeholders.

- Assignment ladder scoring
  - Assignment status changes now award base points, early bonuses, or late penalties through the new ladder service helpers.
  - Added optional submission notes and timestamps to assignments, surfaced them in the UI, and render ladder events with friendly copy + relative timing.

- Documentation/cleanup
  - Updated the roadmap with ladder integrity rules (banked rewards, optional submission notes, toggle audits, grace window, event feed, custom badges).
  - Removed streak pages/hooks/types and pruned middleware/config references.

## Plan (Tomorrow)

Focus: Integrity workflows + automation.

1) Delayed verification job
- Queue ladder intent events until the due date passes, then post the final reward/penalty batch.
- Add a background worker (or cron-friendly route) to flush banked events.

2) Toggle audits & safeguards
- Track repeat reopenings after deadlines and surface gentle warnings / automatic adjustments.
- Add moderation tooling to inspect per-assignment ladder history.

3) Visual polish
- Iterate on custom ladder badge concepts and expand the HUD event list for richer history.

## Ladder Integrity Rules (draft)

To keep the ladder meaningful without punishing honest students, we will:

- **Bank rewards until due time** – completing early logs the intent, but points only post once the due date passes and the item remains completed. If it reopens before then, the reward evaporates (and may trigger a small penalty).
- **Offer optional submission notes** – a quick “where did you submit?” field grants a tiny bonus and provides personal context without blocking completion.
- **Audit status toggles** – we will track flips after the deadline; repeated reopenings apply a light integrity penalty and surface a friendly reminder that points finalize when work does.
- **Respect grace windows** – a 15–30 minute buffer covers portal glitches; same-day late submissions earn reduced credit, while multi-day lateness yields zero points plus the standard deduction.
- **Surface everything in the event feed** – every award or penalty writes a ladder event (`+22 pts • Lab Report submitted 18h early`, `-10 pts • Problem Set overdue`) so wins feel tangible and cheating looks pointless.
- **Custom badge art** – ladder badges will use bespoke artwork generated outside the repo so each tier feels intentional.
- Optional: equal min-width for action buttons for visual symmetry.

4) Seed + Demo
- Add `prisma/seed.ts` with a few courses and assignments so the demo isn’t empty.
- README screenshots for Dashboard, Calendar, Parser.

## Backlog / Ideas

- Study planner + sessions
  - Break assignments into tasks with estimates and auto-schedule sessions before due dates.
- “What‑If” grade calculator
  - Project course grades with sliders for upcoming assignments.
- Risk radar
  - Score urgency/impact/effort and surface top risks with one-tap mitigation (add a session tonight).
- Streak engagement
  - Streak freeze tokens, weekly goals with confetti, multipliers (7/14/30), badges (7/30/100), pre‑miss nudges.
- Calendar integration
  - ICS export; optional Google Calendar (one‑way first).
- Parser v2
  - PDF/Docx import, improved confidence handling, better “open vs due” detection.

## Deploy (Vercel) — Checklist

- Database
  - Use a hosted Postgres (Neon/Supabase/Vercel Postgres).
  - Set `DATABASE_URL` in Vercel → Project → Settings → Environment Variables.
  - Switch `prisma/schema.prisma` datasource provider to `postgresql` for prod, then run:
    - `npx prisma db push` (or `npx prisma migrate deploy` if using migrations).
- Auth
  - Set `NEXTAUTH_URL` to your Vercel URL and `NEXTAUTH_SECRET` to a strong value.
- Build
  - Defaults are fine (`next build`). `@prisma/client` will generate during build.
- Optional
  - Seed production DB with a small dataset for a richer demo.

### Pre-deploy validation helpers

- `npm run verify:env` — confirms `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `DATABASE_URL` are supplied either via your shell or local env files.
- `npm run smoke:check` — runs the env validation, performs a production build, and prints a manual smoke checklist covering API/auth flows.

Run the smoke checklist locally, then repeat the same steps against your deployed Vercel preview to prove stability to reviewers.
