const state = { base: '' }

function headers() {
  const h = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('docvai_token')
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export const api = {
  setBase(b) { state.base = (b || '').replace(/\/$/, '') },
  async login(email, password) {
    const res = await fetch(`${state.base}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    localStorage.setItem('docvai_token', data.token)
    return data
  },
  async get(path) {
    const res = await fetch(`${state.base}${path}`, { headers: headers() })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async post(path, body) {
    const res = await fetch(`${state.base}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body || {}) })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}
