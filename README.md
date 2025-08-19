# Smart Semester Planner

Gamified assignment tracker for students with RP-based ranking system.

## Getting Started

```bash
npm install
npm run db:push  # Set up database
npm run dev      # Start development server
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma + PostgreSQL  
- NextAuth.js
- TailwindCSS
- React Query

## Features

- Assignment tracking with urgency scoring
- RP-based ranking system (Copper to Pink Diamond)
- Daily check-ins for accountability
- Grade tracking and projections
- In-app calendar view

## Project Structure

```
smart-semester-planner/
├── app/                             # Next.js App Router
│   ├── (auth)/                      # Auth route group
│   │   └── signin/page.tsx          # Sign in page
│   ├── (dashboard)/                 # Dashboard route group
│   │   └── page.tsx                 # Main dashboard
│   ├── api/                         # API routes
│   │   ├── assignments/             # Assignment CRUD
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
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Sample data
│
├── tests/                          # Test files
│   ├── rank.test.ts
│   ├── rp.test.ts
│   └── urgency.test.ts
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

