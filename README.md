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

## Core Files You Own

- `/lib/rp.ts` - RP calculation logic
- `/lib/urgency.ts` - Assignment priority algorithm  
- `/lib/rank.ts` - Rank computation
- `/app/api/daily-check/route.ts` - Daily accountability flow

Claude scaffolds. You write the logic.