"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json()
        setProfile(data)
        setName(data?.name ?? '')
      } catch (e) {
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
      if (!res.ok) throw new Error(data?.error || 'Update failed')
      setMessage('Name updated')
      setProfile((p) => (p ? { ...p, name } : p))
    } catch (e: any) {
      setError(e.message || 'Update failed')
    } finally {
      setSaving(false)
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
      if (!res.ok) throw new Error(data?.error || 'Password change failed')
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
      <div className="page-content max-w-3xl">
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
        <div className="page-card mb-8">
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
        <div className="page-card mb-8">
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
        <div className="page-card">
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
      </div>
    </div>
  )
}
