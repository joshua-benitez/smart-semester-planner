import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// wiring NextAuth into the App Router
const handler = NextAuth(authOptions)

// expose the same handler for both verbs because NextAuth expects it
export { handler as GET, handler as POST }
