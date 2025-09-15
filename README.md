# Smart Semester Planner

Gamified assignment tracker for students with RP-based ranking system.

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
- Basic dashboard and course management
- Auth via NextAuth (credentials), protected routes
- In-app calendar view (basic)

Roadmap
- RP-based ranking system and history
- Daily check-ins for accountability
- Grade tracking and projections
- Tests for parser, ranking, and APIs

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
│   │   ├── auth/[...nextauth]/      # NextAuth.js
│   │   ├── daily-check/             # Daily accountability
│   │   └── rp-history/              # RP history
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
│   ├── rank.ts                     # Rank calculation
│   ├── rp.ts                       # RP calculation
│   ├── urgency.ts                  # Priority algorithm
│   ├── utils.ts                    # Utility functions
│   └── validators.ts               # Input validation
│
├── prisma/                         # Database
│   ├── schema.prisma               # Database schema (SQLite dev; Postgres prod)
│   └── seed.ts                     # Sample data (optional)
│
├── tests/                          # Test files (planned)
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
