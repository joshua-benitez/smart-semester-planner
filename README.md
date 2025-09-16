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
│   ├── RankBadge.tsx               # Rank display
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

- Branding and layout
  - Unified logo + name + tagline blocks on landing and dashboard (tight spacing, consistent sizing).
  - Landing page hero, feature highlights, and “How it works” section.
  - Auth pages (Sign In / Create Account) centered and sized consistently.
  - Sidebar navigation refined (sharp left indicator on active/hover, added Streaks link).

- Assignments UX
  - Added `/assignments` index page using the same list component as the dashboard.
  - “Your Assignments” list: toggleable selection mode (checkboxes only when needed), consistent button sizes, improved spacing, and an outline-only red trash icon.
  - Priority/sections backgrounds unified to `bg-brandPrimary/10` for visual consistency.

- Create/Edit Assignment form
  - Category Weight now uses percent (0–100%) instead of 0.1–5.0.
  - Due date defaults to Today 11:59 PM with quick buttons for Today/Tomorrow at 11:59 PM.
  - Cleaned labels (removed asterisks) while keeping required behavior.

- Profile
  - Built `/profile` page with name update and password change forms.
  - Added `/api/profile` GET/PUT.

- Auth/Routes/Infra
  - Removed unused daily-check / rp-history references and cleaned middleware.
  - Added protected `/streaks` route; included a mock `/api/streaks` endpoint.
  - Fixed Tailwind layering and PostCSS so custom component classes compile.

## Plan (Tomorrow)

Focus: Streaks v1 (DB-backed) and small quality-of-life boosts.

1) Streaks implementation
- Prisma models:
  - `StreakLog` (id, userId, date (YYYY-MM-DD), createdAt) with unique (userId, date)
  - Optional `StreakCounters` (userId, currentStreak, bestStreak, updatedAt) for fast reads
- API `/api/streaks`
  - GET: return last 8–12 weeks of days + computed current/best
  - POST: upsert today (check-in)
  - DELETE: undo today
  - Timezone: normalize to user local day (or store as UTC date string)
- Wire the mocks to Prisma and verify the heatmap + header counters update.

2) Landing polish (optional quick wins)
- Add a small screenshot or animated GIF strip.
- Tweak hero copy if needed; finalize logo sizing.

3) Assignments UX
- Add preset pills for Type and Difficulty.
- Add “Next Monday 11:59 PM” quick date.
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
