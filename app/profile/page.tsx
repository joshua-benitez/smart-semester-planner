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
      } catch (e) {
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

  const inputCls = 'w-full text-[0.82rem] px-3 py-2 rounded-md outline-none transition-colors'
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(230,234,246,0.85)',
  } as React.CSSProperties

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0b0d12', color: 'rgba(230,234,246,0.3)' }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0b0d12' }}>
      <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div>
          <Link href="/dashboard" className="text-[0.72rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>← Dashboard</Link>
          <h1 className="text-[1.1rem] font-semibold tracking-tight text-white/90 mt-2">Profile</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6 max-w-3xl">
        {(message || error) && (
          <div className="mb-4 text-[0.8rem] rounded-md px-3 py-2" style={{ background: error ? 'rgba(248,113,113,0.12)' : 'rgba(34,197,94,0.12)', color: error ? 'rgba(248,113,113,0.9)' : 'rgba(34,197,94,0.9)' }}>
            {error || message}
          </div>
        )}

        <div className="mb-6">
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(230,234,246,0.3)' }}>
            Account
          </div>
          <div className="rounded-md px-3 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-[0.7rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Email</div>
                <div className="text-[0.85rem]" style={{ color: 'rgba(230,234,246,0.85)' }}>{profile?.email}</div>
              </div>
              <div>
                <div className="text-[0.7rem]" style={{ color: 'rgba(230,234,246,0.3)' }}>Member since</div>
                <div className="text-[0.85rem]" style={{ color: 'rgba(230,234,246,0.85)' }}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(230,234,246,0.3)' }}>
            Display name
          </div>
          <form onSubmit={updateProfile} className="space-y-3">
            <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <button type="submit" disabled={saving} className="text-[0.77rem] font-semibold px-3 py-2 rounded-md disabled:opacity-40" style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}>
              {saving ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </div>

        <div className="mb-6">
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(230,234,246,0.3)' }}>
            Change password
          </div>
          <form onSubmit={changePassword} className="space-y-3">
            <input type="password" className={inputCls} style={inputStyle} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
            <input type="password" className={inputCls} style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            <button type="submit" disabled={saving} className="text-[0.77rem] font-semibold px-3 py-2 rounded-md disabled:opacity-40" style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        <div>
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(230,234,246,0.3)' }}>
            Preferences
          </div>
          <form onSubmit={savePreferences} className="space-y-3">
            <label className="flex items-center gap-2 text-[0.8rem]" style={{ color: 'rgba(230,234,246,0.6)' }}>
              <input
                type="checkbox"
                checked={prefForm.hideCompletedAssignments ?? false}
                onChange={(e) => setPrefForm((prev) => ({ ...prev, hideCompletedAssignments: e.target.checked }))}
              />
              Hide completed assignments by default
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className={inputCls}
                style={inputStyle}
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
                style={inputStyle}
                value={prefForm.defaultDifficulty}
                onChange={(e) => setPrefForm((prev) => ({ ...prev, defaultDifficulty: e.target.value }))}
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="crushing">Crushing</option>
                <option value="brutal">Brutal</option>
              </select>
            </div>
            <button type="submit" disabled={prefsSaving} className="text-[0.77rem] font-semibold px-3 py-2 rounded-md disabled:opacity-40" style={{ background: 'rgba(230,234,246,0.9)', color: '#0b0d12' }}>
              {prefsSaving ? 'Saving…' : 'Save preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
