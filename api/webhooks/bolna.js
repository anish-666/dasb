import { withCors } from '../../lib/cors.js'
import { json, parseBody } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'

export const handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' })

  const body = parseBody(event)
  const url = new URL(event.rawUrl)
  const callId = url.searchParams.get('call_id')
  const tenantId = url.searchParams.get('tenant_id')

  // Expected body: { type: 'call.started'|'call.connected'|'call.completed'|'transcript.ready'|'recording.ready', data: {...} }
  const { type, data = {} } = body || {}
  if (!type) return json(400, { error: 'type_required' })

  try {
    if (type === 'call.started') {
      const call = (await sql`select * from calls where id=${callId} and tenant_id=${tenantId} limit 1`)[0]
      if (call) {
        await sql`
          insert into conversations (tenant_id, agent_id, customer_number, status, duration_seconds)
          values (${tenantId}, ${call.agent_id}, ${call.customer_number}, 'in-progress', 0)
        `
      }
    }

    if (type === 'call.connected') {
      await sql`update calls set success=true where id=${callId} and tenant_id=${tenantId}`
    }

    if (type === 'call.completed') {
      const duration = Number(data?.duration_seconds || data?.duration || 0)
      await sql`update calls set duration_seconds=${duration} where id=${callId} and tenant_id=${tenantId}`
      const call = (await sql`select * from calls where id=${callId} and tenant_id=${tenantId} limit 1`)[0]
      if (call) {
        await sql`
          update conversations
          set status='completed', duration_seconds=${duration}
          where tenant_id=${tenantId} and agent_id=${call.agent_id} and customer_number=${call.customer_number}
          and status is distinct from 'completed'
        `
      }
    }

    if (type === 'transcript.ready') {
      const transcript = data?.transcript || data?.text || ''
      await sql`update calls set transcript=${transcript} where id=${callId} and tenant_id=${tenantId}`
    }

    if (type === 'recording.ready') {
      const url = data?.recording_url || data?.url || ''
      await sql`update calls set recording_url=${url} where id=${callId} and tenant_id=${tenantId}`
    }

    return json(200, { ok: true })
  } catch (e) {
    console.error('Webhook error', e)
    return json(500, { ok: false, error: 'internal_error' })
  }
})
