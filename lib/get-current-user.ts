import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./db"

// Helper function to get current authenticated user
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  })

  return user
}

// Helper to get user or throw error  
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}