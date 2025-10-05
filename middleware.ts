import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // leaving this hook in case I need per-route checks later
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/assignments/:path*',
    '/calendar/:path*',
    '/profile/:path*',
    '/api/assignments/:path*',
    '/api/courses/:path*',
    '/api/ladder/:path*',
    // trimmed out the old streak routes
  ]
}
