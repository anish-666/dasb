import React from 'react'
import { api } from '../lib/api.js'

export default function Outbound() {
  const [numbers, setNumbers] = React.useState('')
  const [agentId, setAgentId] = React.useState('')
  const [callerId, setCallerId] = React.useState('')
  const [status, setStatus] = React.useState('')

  async function submit(e){
    e.preventDefault()
    setStatus('')
    const arr = numbers.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean)
    const payload = { numbers: arr }
    if (agentId) payload.agentId = agentId
    if (callerId) payload.callerId = callerId
    const res = await api.post('/api/calls/outbound', payload)
    setStatus(`Created ${res.created} calls`)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Outbound</h1>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow mt-4 space-y-2">
        <textarea className="w-full border rounded p-2 h-32" placeholder="One or more numbers, separated by space or comma"
          value={numbers} onChange={e=>setNumbers(e.target.value)} />
        <div className="grid md:grid-cols-2 gap-2">
          <input className="border rounded p-2" placeholder="Agent ID (optional)" value={agentId} onChange={e=>setAgentId(e.target.value)} />
          <input className="border rounded p-2" placeholder="Caller ID (optional)" value={callerId} onChange={e=>setCallerId(e.target.value)} />
        </div>
        <button className="bg-black text-white rounded px-4 py-2">Start</button>
      </form>
      {status && <div className="mt-2 text-sm text-green-700">{status}</div>}
    </div>
  )
}
