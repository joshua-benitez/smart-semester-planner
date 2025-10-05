import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./db"
import { UnauthorizedError } from "./errors"

// central place to grab the signed-in user on the server
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return null
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })
    return user
  } catch (err) {
    // if NextAuth/Prisma explode, just act like the user isn't signed in
    return null
  }
}

// same as above but throws when we absolutely need a user
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new UnauthorizedError()
  }
  return user
}
