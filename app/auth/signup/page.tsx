'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function SignUp() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Something went wrong')
        return
      }

      setSuccess('Account created successfully! Signing you in…')

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but sign in failed. Please sign in manually.')
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
          <h1 className="text-[1.1rem] font-semibold text-white/90">Create account</h1>
          <p className="text-[0.78rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Get started in a minute.</p>
        </div>

        {error && (
          <div className="mb-4 text-[0.78rem] rounded-md px-3 py-2" style={{ background: 'rgba(248,113,113,0.12)', color: 'rgba(248,113,113,0.9)' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 text-[0.78rem] rounded-md px-3 py-2" style={{ background: 'rgba(34,197,94,0.12)', color: 'rgba(34,197,94,0.9)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.72rem] mb-1" style={{ color: 'rgba(230,234,246,0.5)' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={inputCls}
              style={inputStyle}
              placeholder="Your name"
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
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
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-[0.75rem]" style={{ color: 'rgba(230,234,246,0.4)' }}>
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
