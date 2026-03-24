'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { DEFAULT_USER_PREFERENCES, UserPreferences } from '@/types/user'

type Profile = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { preferences, updatePreferences, isUpdating: prefsSaving } = useUserPreferences()
  const [prefForm, setPrefForm] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) throw new Error('Failed to load profile')
        const payload = await res.json()
        if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to load profile')
        setProfile(payload.data)
        setName(payload.data?.name ?? '')
      } catch {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (preferences) {
      setPrefForm({ ...DEFAULT_USER_PREFERENCES, ...preferences })
    }
  }, [preferences])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data?.error?.message || 'Update failed')
      setMessage('Name updated')
      setProfile((p) => (p ? { ...p, name } : p))
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    try {
      await updatePreferences(prefForm)
      setMessage('Preferences updated')
    } catch (err: any) {
      setError(err?.message || 'Failed to update preferences')
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data?.error?.message || 'Password change failed')
      setMessage('Password updated')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e: any) {
      setError(e.message || 'Password change failed')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brandPrimary'

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-brandBg text-sm text-gray-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-brandBg">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-white px-8 pb-4 pt-8">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">← Dashboard</Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl space-y-6">
          {(message || error) && (
            <div className={`rounded-md px-4 py-3 text-sm font-medium ${error ? 'border border-red-100 bg-red-50 text-red-600' : 'border border-emerald-100 bg-emerald-50 text-emerald-600'}`}>
              {error || message}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Account
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{profile?.email}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Member since</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Display name
            </div>
            <form onSubmit={updateProfile} className="space-y-4">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving…' : 'Save name'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Change password
            </div>
            <form onSubmit={changePassword} className="space-y-4">
              <input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
              <input type="password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Preferences
            </div>
            <form onSubmit={savePreferences} className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={prefForm.hideCompletedAssignments ?? false}
                  onChange={(e) => setPrefForm((prev) => ({ ...prev, hideCompletedAssignments: e.target.checked }))}
                />
                Hide completed assignments by default
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className={inputCls}
                  value={prefForm.defaultAssignmentType}
                  onChange={(e) => setPrefForm((prev) => ({ ...prev, defaultAssignmentType: e.target.value }))}
                >
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Project</option>
                  <option value="exam">Exam</option>
                </select>
                <select
                  className={inputCls}
                  value={prefForm.defaultDifficulty}
                  onChange={(e) => setPrefForm((prev) => ({ ...prev, defaultDifficulty: e.target.value }))}
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="crushing">Crushing</option>
                  <option value="brutal">Brutal</option>
                </select>
              </div>
              <button type="submit" disabled={prefsSaving} className="btn-primary text-sm">
                {prefsSaving ? 'Saving…' : 'Save preferences'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
