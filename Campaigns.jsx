import React from 'react'
import { api } from '../lib/api.js'

export default function Campaigns() {
  const [rows, setRows] = React.useState([])
  const [name, setName] = React.useState('New Campaign')

  async function load(){ const d = await api.get('/api/campaigns'); setRows(d.campaigns||[]) }
  React.useEffect(()=>{ load() },[])

  async function create(e){
    e.preventDefault()
    await api.post('/api/campaigns', { name })
    setName('New Campaign')
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Campaigns</h1>
      <form onSubmit={create} className="bg-white p-4 rounded shadow mt-4 flex gap-2">
        <input className="border rounded p-2 flex-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Campaign name"/>
        <button className="bg-black text-white rounded px-4">Create</button>
      </form>
      <div className="bg-white rounded shadow mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2">Name</th><th>Status</th><th>Total</th><th>Completed</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2 text-center">{r.total}</td>
                <td className="p-2 text-center">{r.completed}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-4 text-sm text-gray-500">No campaigns yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <BatchOutbound />
    </div>
  )
}

function BatchOutbound() {
  const [numbersText, setNumbersText] = React.useState('')
  const [agentId, setAgentId] = React.useState('')
  const [res, setRes] = React.useState(null)

  async function submit(e) {
    e.preventDefault()
    const numbers = numbersText.split(/[\s,]+/).map(s=>s.trim()).filter(Boolean)
    const payload = { numbers }
    if (agentId) payload.agentId = agentId
    const d = await api.post('/api/calls/outbound', payload)
    setRes(d)
  }

  return (
    <div className="bg-white rounded shadow mt-6 p-4">
      <h2 className="font-medium mb-2">Batch Outbound Calls</h2>
      <form onSubmit={submit} className="space-y-2">
        <textarea className="w-full border rounded p-2 h-32" placeholder="+918000000000, +918000000001"
          value={numbersText} onChange={e=>setNumbersText(e.target.value)} />
        <input className="border rounded p-2 w-full" placeholder="Agent ID (optional)" value={agentId} onChange={e=>setAgentId(e.target.value)} />
        <button className="bg-black text-white rounded px-4 py-2">Start Calls</button>
      </form>
      {res && <div className="text-sm text-gray-600 mt-2">Created {res.created} call jobs.</div>}
    </div>
  )
}
