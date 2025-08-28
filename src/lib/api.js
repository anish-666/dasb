// src/lib/api.js
// Maps "/api/foo/bar" -> "/.netlify/functions/foo-bar" when running on Netlify,
// otherwise leaves path alone (e.g., for local dev with netlify dev).
const state = { base: '' }

function headers() {
  const h = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('docvai_token')
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function toFnPath(path) {
  // If VITE_API_BASE explicitly set to "/.netlify/functions", just drop the "/api/"
  // and hyphenate the rest: /api/analytics/summary -> /analytics-summary
  if ((state.base || '').startsWith('/.netlify/functions')) {
    // strip any query string
    const [p, q] = path.split('?')
    const parts = p.replace(/^\/api\//, '').split('/').filter(Boolean)
    const fn = '/' + parts.join('-') + (q ? '?' + q : '')
    return fn
  }
  return path // normal /api/* with working redirects
}

export const api = {
  setBase(b) { state.base = (b || '').replace(/\/$/, '') },
  async login(email, password) {
    const url = (state.base || '').startsWith('/.netlify/functions')
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
