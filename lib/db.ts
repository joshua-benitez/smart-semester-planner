// singleton prisma client so hot reloads don't blow up the connection pool
import { PrismaClient } from '@prisma/client'

function ensureDatabaseConfig() {
  const provider = process.env.DATABASE_PROVIDER?.toLowerCase()
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured. Run `npm run verify:env` and try again.')
  }

  if (provider && provider !== 'postgresql') {
    throw new Error('DATABASE_PROVIDER must be set to "postgresql" for this project.')
  }

  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error('DATABASE_URL must start with postgresql:// and point at your Neon/Supabase database.')
  }
}

ensureDatabaseConfig()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
