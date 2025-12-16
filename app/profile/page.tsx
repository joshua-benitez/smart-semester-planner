"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { DEFAULT_USER_PREFERENCES, UserPreferences } from '@/types/user'

type Profile = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export default function ProfilePage() {
  // lightweight account settings page (name + password) hitting the profile API
  const { data: session } = useSession()
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading profile…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-content max-w-5xl">
        <div className="header-card">
          <div className="page-header">
            <div>
              <h1 className="page-title">Profile</h1>
              <p className="page-description">Manage your account settings</p>
            </div>
          </div>
        </div>

        {(message || error) && (
          <div className={`page-card ${error ? 'border-red-500/40 bg-red-500/10' : 'border-emerald-500/40 bg-emerald-500/10'}`}>
            <div className="text-sm">{error || message}</div>
          </div>
        )}

        {/* Account Info */}
        <div className="page-card mb-8 border border-white/10 bg-cardBg">
          <h2 className="text-xl font-bold mb-4">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-white/70 text-sm">Email</div>
              <div className="text-white font-medium">{profile?.email}</div>
            </div>
            <div>
              <div className="text-white/70 text-sm">Member Since</div>
              <div className="text-white font-medium">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</div>
            </div>
          </div>
        </div>

        {/* Update name */}
        <div className="page-card mb-8 border border-white/10 bg-cardBg">
          <h2 className="text-xl font-bold mb-4">Display Name</h2>
          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label className="form-label">Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-secondary">
                {saving ? 'Saving…' : 'Save Name'}
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="page-card mb-8 border border-white/10 bg-cardBg">
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="form-grid">
              <div>
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div>
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-secondary">
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="page-card border border-white/10 bg-cardBg">
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          <form onSubmit={savePreferences} className="space-y-4">
            <div className="form-grid">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/30 bg-panelBg"
                  checked={prefForm.hideCompletedAssignments ?? false}
                  onChange={(e) => setPrefForm((prev) => ({ ...prev, hideCompletedAssignments: e.target.checked }))}
                />
                <span className="text-white/80 text-sm">Hide completed assignments by default</span>
              </label>
              <div>
                <label className="form-label">Theme</label>
                <select
                  className="form-input"
                  value={prefForm.theme}
                  onChange={(e) => setPrefForm((prev) => ({ ...prev, theme: e.target.value as UserPreferences['theme'] }))}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label className="form-label">Default Assignment Type</label>
                <select
                  className="form-input"
                  value={prefForm.defaultAssignmentType}
                  onChange={(e) => setPrefForm((prev) => ({ ...prev, defaultAssignmentType: e.target.value }))}
                >
                  <option value="homework">Homework</option>
                  <option value="quiz">Quiz</option>
                  <option value="project">Project</option>
                  <option value="exam">Exam</option>
                </select>
              </div>
              <div>
                <label className="form-label">Default Difficulty</label>
                <select
                  className="form-input"
                  value={prefForm.defaultDifficulty}
                  onChange={(e) => setPrefForm((prev) => ({ ...prev, defaultDifficulty: e.target.value }))}
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="crushing">Crushing</option>
                  <option value="brutal">Brutal</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={prefsSaving} className="btn-secondary">
                {prefsSaving ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
