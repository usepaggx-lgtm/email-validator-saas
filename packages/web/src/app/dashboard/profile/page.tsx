'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Camera, Lock, Loader2, Check, Upload } from 'lucide-react'
import { getUser, setUser, authFetch, apiUpdateProfile, apiChangePassword } from '@/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUserState] = useState<any>(null)
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/login'); return }
    setUserState(u)
    setName(u.name || '')
    if (u.id) setAvatarUrl(`${API}/api/auth/avatar/${u.id}?_t=${Date.now()}`)
  }, [])

  async function handleAvatar(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please select an image'); return }
    if (file.size > 500000) { setError('Image too large (max 500KB)'); return }
    setUploading(true); setError(''); setMsg('')
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const d = await authFetch('/api/auth/avatar', { method: 'POST', body: JSON.stringify({ image: base64 }) })
        if (d.error) { setError(d.error); return }
        setAvatarUrl(`${API}/api/auth/avatar/${user.id}?_t=${Date.now()}`)
        setMsg('Avatar updated!')
      }
      reader.readAsDataURL(file)
    } catch { setError('Upload failed') }
    finally { setUploading(false) }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleAvatar(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setMsg(''); setError('')
    try {
      const d = await apiUpdateProfile(name.trim())
      if (d.error) { setError(d.error); return }
      const updated = { ...user, name: name.trim() }
      setUser(updated); setUserState(updated)
      setMsg('Profile updated!')
    } catch { setError('Failed to update') }
    finally { setSaving(false) }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword || !newPassword) { setError('Fill all fields'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setChangingPwd(true); setMsg(''); setError('')
    try {
      const d = await apiChangePassword(currentPassword, newPassword)
      if (d.error) { setError(d.error); return }
      setMsg('Password changed!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch { setError('Failed to change password') }
    finally { setChangingPwd(false) }
  }

  if (!user) return null

  return (
    <>
      <div className="flex items-center gap-5 mb-8">
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setAvatarUrl('')} />
            ) : (
              user.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            {uploading ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Camera size={14} className="text-gray-500" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400 mt-1">Click the camera icon to change your avatar</p>
        </div>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 text-sm text-green-700 flex items-center gap-2"><Check size={16} />{msg}</div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-600">{error}</div>}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><User size={18} className="text-gray-400" /> Profile Information</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={user.email} disabled
                className="w-full px-4 py-2.5 border border-gray-100 rounded-xl text-sm text-gray-400 bg-gray-50 cursor-not-allowed" />
            </div>
            <button type="submit" disabled={saving || !name.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} className="text-gray-400" /> Change Password</h2>
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>
            <button type="submit" disabled={changingPwd || !currentPassword || !newPassword}
              className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all text-sm disabled:opacity-50">
              {changingPwd ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
