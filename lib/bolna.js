// lib/bolna.js
const BOLNA_BASE = process.env.BOLNA_BASE || 'https://api.bolna.ai'

async function bolnaFetch(path, init = {}) {
  const url = `${BOLNA_BASE}${path}`
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.BOLNA_API_KEY || ''}`,
    ...(init.headers || {})
  }
  const res = await fetch(url, { ...init, headers })
  const txt = await res.text()
  let body
  try { body = txt ? JSON.parse(txt) : {} } catch { body = { raw: txt } }
  return { ok: res.ok, status: res.status, body }
}

export async function listAgents() {
  // per docs
  return bolnaFetch('/agent/all', { method: 'GET' })
}

// Try multiple known call endpoints; return on first 2xx
export async function startCall({ agentId, to, from }) {
  const tries = [
    { path: '/calls',       body: { agent_id: agentId, to_number: to, from_number: from } },
    { path: '/v1/calls',    body: { agent_id: agentId, to_number: to, from_number: from } },
    { path: '/call/start',  body: { agent_id: agentId, to: to, from: from } },
    { path: '/call',        body: { agent_id: agentId, to: to, from: from } },
  ]
  let last
  for (const t of tries) {
    // omit from_number if falsy
    const b = { ...t.body }
    if (!b.from_number && !b.from) { delete b.from_number; delete b.from }
    const res = await bolnaFetch(t.path, { method: 'POST', body: JSON.stringify(b) })
    last = { ...res, tried: t.path }
    if (res.ok) return last
    if (res.status === 404) continue
  }
  return last
}
