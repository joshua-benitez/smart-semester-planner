import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// TODO: Create NextAuth handler with authOptions
const handler = NextAuth(authOptions)

// TODO: Export the handler for both GET and POST requests
export { handler as GET, handler as POST }