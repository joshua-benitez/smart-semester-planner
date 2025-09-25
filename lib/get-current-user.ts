import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./db"
import { UnauthorizedError } from "./errors"

// Helper function to get current authenticated user
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return null
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    return user
  } catch (err) {
    // If NextAuth or Prisma throw, treat as unauthenticated in API context
    return null
  }
}

// Helper to get user or throw error  
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new UnauthorizedError()
  }
  return user
}