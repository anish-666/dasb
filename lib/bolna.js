// lib/bolna.js
const BOLNA_BASE = process.env.BOLNA_BASE || 'https://api.bolna.ai'
const BOLNA_API_KEY = process.env.BOLNA_API_KEY

function authHeaders() {
  if (!BOLNA_API_KEY) throw new Error('Missing BOLNA_API_KEY')
  return {
    'Authorization': `Bearer ${BOLNA_API_KEY}`,
    'Content-Type': 'application/json'
  }
}

async function listAgents() {
  const res = await fetch(`${BOLNA_BASE}/agent/all`, { headers: authHeaders() })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Bolna listAgents failed: ${res.status} ${t}`)
  }
  return res.json()
}

// POST /call with { agent_id, recipient_phone_number }
async function startCall({ agent_id, recipient_phone_number }) {
  if (!agent_id) throw new Error('agent_id required')
  if (!recipient_phone_number) throw new Error('recipient_phone_number required')

  const res = await fetch(`${BOLNA_BASE}/call`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ agent_id, recipient_phone_number })
  })

  const text = await res.text()
  let body
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }

  if (!res.ok) {
    const msg = typeof body === 'object' ? JSON.stringify(body) : String(body)
    throw new Error(`Bolna startCall failed: ${res.status} ${msg}`)
  }

  const id = body?.id || body?.call_id || body?.data?.id || null
  return { ok: true, status: res.status, id, body }
}

module.exports = { listAgents, startCall }
