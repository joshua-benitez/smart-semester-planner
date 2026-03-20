'use client'

import { signIn, getSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.replace('/dashboard')
      }
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.replace('/dashboard')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full text-[0.82rem] px-3 py-2 rounded-md outline-none transition-colors'
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(230,234,246,0.85)',
  } as React.CSSProperties

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#0b0d12' }}>
      <div className="w-full max-w-sm px-7 py-6 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#0f1116' }}>
        <div className="mb-5">
          <h1 className="text-[1.1rem] font-semibold text-white/90">Welcome back</h1>
          <p className="text-[0.78rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Sign in to continue.</p>
        </div>

        {error && (
          <div className="mb-4 text-[0.78rem] rounded-md px-3 py-2" style={{ background: 'rgba(248,113,113,0.12)', color: 'rgba(248,113,113,0.9)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.72rem] mb-1" style={{ color: 'rgba(230,234,246,0.5)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputCls}
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-[0.72rem] mb-1" style={{ color: 'rgba(230,234,246,0.5)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputCls}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-[0.8rem] font-semibold px-3 py-2 rounded-md disabled:opacity-40"
            style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-[0.75rem]" style={{ color: 'rgba(230,234,246,0.4)' }}>
          Don’t have an account?{' '}
          <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
