'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // wait until next-auth tells us what's up
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // router push above handles the redirect
  }

  return <>{children}</>
}
