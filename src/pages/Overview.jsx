import React from 'react'
import { api } from '../lib/api.js'

export default function Overview() {
  const [summary, setSummary] = React.useState(null)
  const [series, setSeries] = React.useState([])

  React.useEffect(() => {
    api.get('/api/analytics/summary').then(setSummary)
    api.get('/api/analytics/timeseries?window=7d').then(d => setSeries(d.series || []))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold">Overview</h1>
      {summary && (
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <Card title="Total Calls" value={summary.total_calls} />
          <Card title="Connected" value={summary.connected} />
          <Card title="Avg Duration (s)" value={Math.round(summary.avg_duration)} />
        </div>
      )}
      <div className="bg-white rounded shadow p-4 mt-6">
        <h2 className="font-medium mb-2">Last 7 days</h2>
        <LineChart data={series} />
      </div>
    </div>
  )
}

function Card({ title, value }) {
  return <div className="bg-white p-4 rounded shadow">
    <div className="text-sm text-gray-600">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
}

function LineChart({ data }) {
  if (!data?.length) return <div className="text-sm text-gray-500">No data</div>
  const max = Math.max(...data.map(d=>d.total), 1)
  const points = data.map((d,i)=>{
    const x = (i/(data.length-1))*100
    const y = 100 - ((d.total/max)*100)
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="w-full">
      <svg viewBox="0 0 100 100" className="w-full h-40 bg-gray-50 rounded">
        <polyline fill="none" stroke="black" strokeWidth="1" points={points} />
      </svg>
      <div className="text-xs text-gray-500 mt-2">Daily total calls</div>
    </div>
  )
}
