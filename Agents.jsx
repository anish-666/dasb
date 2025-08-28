import React from 'react'
import { api } from '../lib/api.js'

export default function Agents() {
  const [rows, setRows] = React.useState([])
  React.useEffect(()=>{ api.get('/api/agents').then(d=>setRows(d.agents||[])) },[])
  return (
    <div>
      <h1 className="text-2xl font-semibold">Agents</h1>
      <div className="bg-white rounded shadow mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2">ID</th><th>Name</th><th>Provider</th><th>Active</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.provider_agent_id}</td>
                <td className="p-2 text-center">{r.active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-4 text-sm text-gray-500">No agents.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
