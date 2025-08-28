import React from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function Conversations() {
  const [rows, setRows] = React.useState([])
  React.useEffect(()=>{ api.get('/api/conversations').then(d=>setRows(d.conversations||[])) },[])
  return (
    <div>
      <h1 className="text-2xl font-semibold">Conversations</h1>
      <div className="bg-white rounded shadow mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">When</th><th className="p-2 text-left">Agent</th><th className="p-2">Customer</th><th className="p-2">Status</th><th className="p-2">Duration</th></tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.started_at).toLocaleString()}</td>
                <td className="p-2">{r.agent_id}</td>
                <td className="p-2 text-center">{r.customer_number}</td>
                <td className="p-2 text-center">{r.status}</td>
                <td className="p-2 text-center">{r.duration_seconds}s</td>
                <td className="p-2"><Link to={`/conversations/${r.id}`} className="text-blue-600">Open</Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-4 text-sm text-gray-500">No conversations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
