import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Overview from './pages/Overview.jsx'
import Conversations from './pages/Conversations.jsx'
import ConversationDetail from './pages/ConversationDetail.jsx'
import Agents from './pages/Agents.jsx'
import Campaigns from './pages/Campaigns.jsx'
import Outbound from './pages/Outbound.jsx'
import Settings from './pages/Settings.jsx'
import Nav from './components/Nav.jsx'
import { api } from './lib/api.js'

function RequireAuth({ children }) {
  const token = localStorage.getItem('docvai_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const navigate = useNavigate()
  React.useEffect(() => {
    api.setBase(import.meta.env.VITE_API_BASE || '')
  }, [])

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <RequireAuth>
            <div className="flex">
              <Nav onLogout={() => { localStorage.removeItem('docvai_token'); navigate('/login')} }/>
              <main className="flex-1 p-6 space-y-6">
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/conversations/:id" element={<ConversationDetail />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/outbound" element={<Outbound />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </RequireAuth>
        }/>
      </Routes>
    </div>
  )
}
