import { withCors } from '../../lib/cors.js'
import { json } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'
import { randomUUID } from 'crypto'

async function startProviderCall(toNumber, agentProviderId, fromNumber, webhookUrl) {
  const body = {
    agent_id: agentProviderId,
    to_number: toNumber,
    webhook_url: webhookUrl
  }
  if (fromNumber) body.from_number = fromNumber // only send if provided/allowed

  const res = await fetch('https://api.bolna.ai/v1/calls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.BOLNA_API_KEY || '' },
    body: JSON.stringify(body)
  })
  const txt = await res.text()
  let parsed; try { parsed = JSON.parse(txt) } catch { parsed = { raw: txt } }
  // Try common id shapes
  const providerId = parsed.call_id || parsed.id || parsed.data?.id || parsed.result?.id || null
  return { ok: res.ok, status: res.status, body: parsed, providerId }
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
  const fromNumber = payload.callerId || process.env.OUTBOUND_CALLER_ID || '' // may be empty => omitted
  if (!agentProviderId) return json(400, { error: 'missing_agent' })

  const base = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const webhookUrl = `${base}/.netlify/functions/webhooks-bolna`

  // Detect table shape
  const cols = await sql`
    select column_name from information_schema.columns
    where table_schema = current_schema() and table_name = 'calls'
  `
  const has = (c) => cols.some(r => r.column_name === c)
  const hasPhone = has('phone')
  const hasCustomer = has('customer_number')
  const hasStartedAt = has('started_at')
  const hasDurationSec = has('duration_sec')
  const hasDirection = has('direction')
  const hasStatus = has('status')
  const hasDisposition = has('disposition')
  const hasProvAgent = has('provider_agent_id')
  const hasProvCall = has('provider_call_id')
  const hasSummary = has('summary')

  const created = []
  const provider = []

  for (const num of numbers) {
    const id = randomUUID()

    // Insert a local “queued” row (match your schema if possible)
    if (hasPhone) {
      await sql`
        insert into calls (
          id, tenant_id, agent_id,
          ${hasPhone ? sql`phone,` : sql``}
          ${hasProvAgent ? sql`provider_agent_id,` : sql``}
          ${hasDirection ? sql`direction,` : sql``}
          ${hasStatus ? sql`status,` : sql``}
          ${hasDisposition ? sql`disposition,` : sql``}
          ${hasStartedAt ? sql`started_at,` : sql``}
          ${hasDurationSec ? sql`duration_sec,` : sql``}
          ${hasProvCall ? sql`provider_call_id,` : sql``}
          ${hasSummary ? sql`summary,` : sql``}
          recording_url
        ) values (
          ${id}, ${tenantId}, ${agentProviderId},
          ${hasPhone ? sql`${num},` : sql``}
          ${hasProvAgent ? sql`${agentProviderId},` : sql``}
          ${hasDirection ? sql`'outbound',` : sql``}
          ${hasStatus ? sql`'queued',` : sql``}
          ${hasDisposition ? sql`'queued',` : sql``}
          ${hasStartedAt ? sql`now(),` : sql``}
          ${hasDurationSec ? sql`0,` : sql``}
          ${hasProvCall ? sql`null,` : sql``}
          ${hasSummary ? sql`null,` : sql``}
          null
        )
      `
    } else if (hasCustomer) {
      await sql`
        insert into calls (id, tenant_id, agent_id, customer_number, success, duration_seconds, created_at)
        values (${id}, ${tenantId}, ${agentProviderId}, ${num}, false, 0, now())
      `
    } else {
      return json(500, { error: 'calls table missing phone/customer_number column' })
    }

    // Call provider (and keep the raw result)
    const prov = await startProviderCall(num, agentProviderId, fromNumber || undefined, webhookUrl)

    // Persist provider id / error state
    if (hasProvCall || hasStatus || hasSummary) {
      await sql`
        update calls
        set
          ${hasProvCall ? sql`provider_call_id = ${prov.providerId || null},` : sql``}
          ${hasStatus ? sql`status = ${prov.ok ? 'initiated' : 'error'},` : sql``}
          ${hasSummary ? sql`summary = ${prov.ok ? null : JSON.stringify(prov.body).slice(0, 1000)},` : sql``}
          started_at = coalesce(started_at, now())
        where id = ${id}
      `
    }

    created.push(id)
    provider.push({ phone: num, ok: prov.ok, status: prov.status, id: prov.providerId, body: prov.body })
  }

  return json(200, { ok: true, created_count: created.length, created, provider })
})
