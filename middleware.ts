import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
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
    // removed unused routes
  ]
}
