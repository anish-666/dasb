// api/calls-outbound.js (CJS)
const { sql } = require('../lib/db.js')
const { startCall } = require('../lib/bolna.js')
const { verifyJwtOptional } = require('../lib/auth.js') // ok if you only have verifyJwt; see note below
const { randomUUID } = require('crypto')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
  'Content-Type': 'application/json'
}

function getTenantFromAuth(event) {
  // Admin override for quick testing
  const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key']
  if (admin && admin === (process.env.JWT_SECRET || '')) return 't_demo'

  const auth = event.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) return null
  try {
    // if you only have verifyJwt(token) -> change next line to: const u = verifyJwt(token)
    const u = verifyJwtOptional ? verifyJwtOptional(auth.slice(7)) : null
    return u?.t || 't_demo'
  } catch {
    return null
  }
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }

  const tenant_id = getTenantFromAuth(event) || 't_demo'

  try {
    const body = JSON.parse(event.body || '{}')
    let { numbers, agentId } = body
    if (!Array.isArray(numbers) || numbers.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'numbers array required' }) }
    }
    agentId = agentId || process.env.BOLNA_AGENT_ID
    if (!agentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'agentId missing' }) }
    }

    const created = []
    const provider = []

    // Insert each call in our DB (using your schema) and then call Bolna
    for (const raw of numbers) {
      const phone = String(raw).trim()
      const id = randomUUID()

      // DB insert (your columns)
      await sql`
        insert into calls (id, tenant_id, agent_id, phone, direction, status, started_at)
        values (${id}, ${tenant_id}, ${agentId}, ${phone}, 'outbound', 'created', now())
      `

      created.push(id)

      // Provider call
      try {
        const r = await startCall({ agent_id: agentId, recipient_phone_number: phone })
        // If provider returns an id, store it
        if (r?.id) {
          await sql`
            update calls set provider_agent_id = ${agentId}, provider_call_id = ${r.id}
            where id = ${id}
          `
        }
        provider.push({ phone, ok: true, status: r?.status || 200, id: r?.id || null, tried: '/call' })
      } catch (e) {
        provider.push({ phone, ok: false, status: 0, id: null, tried: '/call', error: String(e?.message || e) })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, created_count: created.length, created, provider })
    }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e?.message || e) }) }
  }
}
