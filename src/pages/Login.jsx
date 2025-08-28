import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = React.useState('admin@demo.com')
  const [password, setPassword] = React.useState('demo123')
  const [err, setErr] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()

  // If you set VITE_API_BASE="/.netlify/functions" in Netlify env,
  // this will call /.netlify/functions/auth-login (no redirects needed).
  // Otherwise it calls /api/auth/login (requires redirects in netlify.toml).
  const base = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
  const useFunctions = base.includes('/.netlify/functions')

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const path = useFunctions ? '/auth-login' : '/api/auth/login'
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const txt = await res.text()
      if (!res.ok) {
        try {
          const j = JSON.parse(txt)
          setErr(j.error || 'Login failed')
        } catch {
          setErr(txt || 'Login failed')
        }
        return
      }
      const data = JSON.parse(txt)
      localStorage.setItem('docvai_token', data.token)
      navigate('/')
    } catch (e) {
      setErr('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h1 className="text-xl font-semibold">DocVAi Login</h1>
        <div>
          <label className="text-sm">Email</label>
          <input
            className="w-full border rounded p-2"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input
            type="password"
            className="w-full border rounded p-2"
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-black text-white rounded p-2" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-xs text-gray-500">Tip: admin@demo.com / demo123</p>
      </form>
    </div>
  )
}
