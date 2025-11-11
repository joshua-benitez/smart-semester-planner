// singleton prisma client so hot reloads don't blow up the connection pool
import { PrismaClient } from '@prisma/client'

function ensureDatabaseConfig() {
  const provider = process.env.DATABASE_PROVIDER?.toLowerCase()
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured. Run `npm run verify:env` and try again.')
  }

  if (!provider || provider === 'postgresql') {
    if (!/^postgres(ql)?:\/\//i.test(url)) {
      throw new Error('DATABASE_URL must start with postgresql:// when using the Postgres provider.')
    }
    return
  }

  if (provider === 'sqlite' && !url.startsWith('file:')) {
    throw new Error('DATABASE_URL must start with file: when DATABASE_PROVIDER=sqlite.')
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
