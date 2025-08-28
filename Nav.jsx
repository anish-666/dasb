import React from 'react'
import { NavLink } from 'react-router-dom'

const link = 'block px-4 py-2 rounded hover:bg-gray-100'
const active = 'bg-gray-200 font-semibold'

export default function Nav({ onLogout }) {
  return (
    <aside className="w-60 bg-white border-r h-screen sticky top-0 p-4">
      <div className="text-xl font-bold mb-6">DocVAi</div>
      <nav className="space-y-2">
        <NavLink to="/" end className={({isActive}) => `${link} ${isActive?active:''}`}>Overview</NavLink>
        <NavLink to="/conversations" className={({isActive}) => `${link} ${isActive?active:''}`}>Conversations</NavLink>
        <NavLink to="/agents" className={({isActive}) => `${link} ${isActive?active:''}`}>Agents</NavLink>
        <NavLink to="/campaigns" className={({isActive}) => `${link} ${isActive?active:''}`}>Campaigns</NavLink>
        <NavLink to="/outbound" className={({isActive}) => `${link} ${isActive?active:''}`}>Outbound</NavLink>
        <NavLink to="/settings" className={({isActive}) => `${link} ${isActive?active:''}`}>Settings</NavLink>
      </nav>
      <button className="mt-8 text-sm text-red-600" onClick={onLogout}>Log out</button>
    </aside>
  )
}
