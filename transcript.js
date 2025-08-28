import { withCors } from '../../lib/cors.js'
import { json } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'

export const handler = withCors(async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' })
  const auth = requireAuth(event)
  if (!auth.ok) return json(401, { error: auth.err })

  // Path: /api/conversations/transcript?id=<uuid>
  const id = (new URL(event.rawUrl)).searchParams.get('id')
  if (!id) return json(400, { error: 'missing_id' })

  const convo = (await sql`select * from conversations where id=${id} and tenant_id=${auth.data.t} limit 1`)[0]
  if (!convo) return json(404, { error: 'not_found' })

  const call = (await sql`
    select transcript, recording_url, created_at
    from calls
    where tenant_id=${auth.data.t}
      and agent_id=${convo.agent_id}
      and customer_number=${convo.customer_number}
    order by created_at desc
    limit 1
  `)[0] || {}

  return json(200, { conversation_id: id, transcript: call.transcript || '', recording_url: call.recording_url || '' })
})
