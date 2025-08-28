import { withCors } from '../../lib/cors.js'
import { json, parseBody } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'

const BOLNA_API = 'https://api.bolna.ai/v1/calls'

export const handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' })
  const auth = requireAuth(event)
  if (!auth.ok) return json(401, { error: auth.err })
  const t = auth.data.t

  const { numbers = [], agentId, callerId } = parseBody(event)
  if (!Array.isArray(numbers) || numbers.length === 0) return json(400, { error: 'numbers_required' })

  const agent_id = agentId || process.env.BOLNA_AGENT_ID
  const from_number = callerId || process.env.OUTBOUND_CALLER_ID
  const baseWebhook = process.env.PUBLIC_SITE_URL + '/api/webhooks/bolna'

  const inserted = []
  for (const to_number of numbers) {
    const callRow = (await sql`
      insert into calls (tenant_id, agent_id, customer_number, success, duration_seconds)
      values (${t}, ${agent_id}, ${to_number}, false, 0) returning *
    `)[0]
    inserted.push(callRow)

    const webhook_url = `${baseWebhook}?call_id=${callRow.id}&tenant_id=${t}`
    await fetch(BOLNA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOLNA_API_KEY}`
      },
      body: JSON.stringify({
        agent_id: agent_id,
        to_number,
        from_number,
        webhook_url
      })
    }).catch(err => {
      console.error('Bolna API error', err)
    })
  }

  return json(200, { ok: true, created: inserted.length, calls: inserted })
})
