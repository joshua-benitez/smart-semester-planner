'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import Logo from "@/components/ui/Logo"

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
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full text-sm px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brandPrimary focus:border-transparent transition-colors shadow-sm"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brandBg px-4">
      <div className="mb-8">
        <Logo width={64} unwrapped imgClassName="rounded-xl shadow-sm" />
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-card">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">Get started in a minute.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={inputCls} placeholder="Your name" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputCls} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" className={inputCls} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-2.5">
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium text-gray-500">
          Already have an account? <Link href="/auth/signin" className="text-brandPrimary transition-colors hover:text-brandPrimaryDark">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
