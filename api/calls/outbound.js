// api/calls/outbound.js
import { withCors } from '../../lib/cors.js'
import { json } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'
import { randomUUID } from 'crypto'

async function startProviderCall(toNumber, agentProviderId, fromNumber, webhookUrl) {
  const res = await fetch('https://api.bolna.ai/v1/calls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.BOLNA_API_KEY || ''
    },
    body: JSON.stringify({
      agent_id: agentProviderId,
      to_number: toNumber,
      from_number: fromNumber,
      webhook_url: webhookUrl
    })
  })
  const txt = await res.text()
  let body; try { body = JSON.parse(txt) } catch { body = { raw: txt } }
  return { ok: res.ok, status: res.status, body }
}

export const handler = withCors(async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' })

  const auth = requireAuth(event)
  if (!auth.ok) return json(401, { error: auth.err })
  const tenantId = auth.data.t

  let payload = {}
  try { payload = JSON.parse(event.body || '{}') } catch {}
  const numbers = Array.isArray(payload.numbers) ? payload.numbers.filter(Boolean) : []
  if (!numbers.length) return json(400, { error: 'no_numbers' })

  const agentProviderId = payload.agentId || process.env.BOLNA_AGENT_ID
  const fromNumber = payload.callerId || process.env.OUTBOUND_CALLER_ID
  if (!agentProviderId || !fromNumber) return json(400, { error: 'missing_agent_or_caller' })

  const base = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const webhookUrl = `${base}/.netlify/functions/webhooks-bolna`

  // Detect table shape
  const cols = await sql/*sql*/`
    select column_name from information_schema.columns
    where table_schema = current_schema() and table_name = 'calls'
  `
  const hasPhone           = cols.some(r => r.column_name === 'phone')
  const hasCustomerNumber  = cols.some(r => r.column_name === 'customer_number')
  const hasStartedAt       = cols.some(r => r.column_name === 'started_at')
  const hasDurationSec     = cols.some(r => r.column_name === 'duration_sec')
  const hasDirection       = cols.some(r => r.column_name === 'direction')
  const hasStatus          = cols.some(r => r.column_name === 'status')
  const hasDisposition     = cols.some(r => r.column_name === 'disposition')
  const hasProviderAgentId = cols.some(r => r.column_name === 'provider_agent_id')

  const created = []
  const provider = []

  for (const num of numbers) {
    const id = randomUUID() // ensure NOT NULL id even if DB has no default

    let row
    if (hasPhone) {
      // Your current schema variant
      row = (await sql/*sql*/`
        insert into calls (
          id, tenant_id, agent_id,
          ${hasPhone ? sql`phone,` : sql``}
          ${hasProviderAgentId ? sql`provider_agent_id,` : sql``}
          ${hasDirection ? sql`direction,` : sql``}
          ${hasStatus ? sql`status,` : sql``}
          ${hasDisposition ? sql`disposition,` : sql``}
          ${hasStartedAt ? sql`started_at,` : sql``}
          ${hasDurationSec ? sql`duration_sec,` : sql``}
          provider_call_id
        ) values (
          ${id}, ${tenantId}, ${agentProviderId},
          ${hasPhone ? sql`${num},` : sql``}
          ${hasProviderAgentId ? sql`${agentProviderId},` : sql``}
          ${hasDirection ? sql`'outbound',` : sql``}
          ${hasStatus ? sql`'queued',` : sql``}
          ${hasDisposition ? sql`'queued',` : sql``}
          ${hasStartedAt ? sql`now(),` : sql``}
          ${hasDurationSec ? sql`0,` : sql``}
          null
        )
        returning id
      `)[0]
    } else if (hasCustomerNumber) {
      // Original schema variant
      row = (await sql/*sql*/`
        insert into calls (
          id, tenant_id, agent_id, customer_number, success, duration_seconds, created_at
        ) values (
          ${id}, ${tenantId}, ${agentProviderId}, ${num}, false, 0, now()
        )
        returning id
      `)[0]
    } else {
      return json(500, { error: 'calls table missing phone/customer_number column' })
    }

    created.push(row?.id || id)

    // Fire provider call (best effort)
    const prov = await startProviderCall(num, agentProviderId, fromNumber, webhookUrl)
    provider.push({ phone: num, ...prov })
  }

  return json(200, { ok: true, created_count: created.length, created, provider })
})
