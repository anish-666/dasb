import React from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function ConversationDetail() {
  const { id } = useParams()
  const [data, setData] = React.useState(null)
  React.useEffect(()=>{ api.get(`/api/conversations/transcript?id=${id}`).then(setData) },[id])

  return (
    <div>
      <h1 className="text-2xl font-semibold">Conversation</h1>
      {!data ? <div>Loading...</div> : (
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-medium mb-2">Transcript</h2>
            <pre className="text-sm whitespace-pre-wrap">{data.transcript || 'No transcript yet.'}</pre>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-medium mb-2">Recording</h2>
            {data.recording_url ? <audio controls src={data.recording_url} className="w-full" /> : <div className="text-sm text-gray-500">Not available</div>}
          </div>
        </div>
      )}
    </div>
  )
}
