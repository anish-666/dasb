// src/lib/api.js
const state = {
  base:
    (import.meta.env.VITE_API_BASE ??
      (typeof window !== 'undefined' && window.location.hostname.endsWith('netlify.app')
        ? '/.netlify/functions'
        : ''))
      .replace(/\/$/, '')
}

function headers() {
  const h = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('docvai_token')
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function toFnPath(path) {
  if (state.base.startsWith('/.netlify/functions')) {
    const [p, q] = path.split('?')
    const parts = p.replace(/^\/api\//, '').split('/').filter(Boolean)
    const fn = '/' + parts.join('-') + (q ? '?' + q : '')
    return fn
  }
  return path
}

export const api = {
  setBase(b) { state.base = (b || '').replace(/\/$/, '') },
  async login(email, password) {
    const url = state.base.startsWith('/.netlify/functions')
      ? `${state.base}/auth-login`
      : `/api/auth/login`
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    localStorage.setItem('docvai_token', data.token)
    return data
  },
  async get(path) {
    const p = toFnPath(path)
    const res = await fetch(`${state.base}${p}`, { headers: headers() })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async post(path, body) {
    const p = toFnPath(path)
    const res = await fetch(`${state.base}${p}`, { method: 'POST', headers: headers(), body: JSON.stringify(body || {}) })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}
