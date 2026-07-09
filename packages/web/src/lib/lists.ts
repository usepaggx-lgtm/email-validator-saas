import { authFetch } from './utils'

export const apiGetLists = () => authFetch('/api/lists')
export const apiCreateList = (name: string) => authFetch('/api/lists', { method: 'POST', body: JSON.stringify({ name }) })
export const apiDeleteList = (id: string) => authFetch(`/api/lists/${id}`, { method: 'DELETE' })
export const apiGetList = (id: string, params?: string) => authFetch(`/api/lists/${id}${params || ''}`)
export const apiAddContacts = (id: string, contacts: any[]) => authFetch(`/api/lists/${id}/contacts`, { method: 'POST', body: JSON.stringify({ contacts }) })
export async function apiExportList(id: string, status?: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ev_token') : null
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
  const res = await fetch(`${API}/api/lists/${id}/export${status ? `?status=${status}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `list-export-${status || 'all'}.csv`; a.click()
  URL.revokeObjectURL(url)
}
