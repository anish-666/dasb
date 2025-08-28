import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function Login() {
  const [email, setEmail] = React.useState('admin@demo.com')
  const [password, setPassword] = React.useState('demo123')
  const [err, setErr] = React.useState('')
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    try {
      await api.login(email, password)
      navigate('/')
    } catch (e) {
      setErr('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h1 className="text-xl font-semibold">DocVAi Login</h1>
        <div>
          <label className="text-sm">Email</label>
          <input className="w-full border rounded p-2" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input type="password" className="w-full border rounded p-2" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full bg-black text-white rounded p-2">Sign in</button>
        <p className="text-xs text-gray-500">Tip: admin@demo.com / demo123</p>
      </form>
    </div>
  )
}
