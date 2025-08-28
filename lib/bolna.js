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
  return { ok: res.ok, status: res.status, body, url }
}

export async function listAgents() {
  // docs say GET /agent/all
  return bolnaFetch('/agent/all', { method: 'GET' })
}

/**
 * Try many common call endpoints & payload shapes.
 * Returns { ok, status, body, attempts: [{path, payload, status, ok, body}] }
 */
export async function startCall({ agentId, to, from }) {
  const shapes = (a, t, f) => ([
    // preferred agent-scoped routes:
    { path: `/agent/${a}/call`,   body: { to } },
    { path: `/agent/${a}/call`,   body: { to_number: t } },
    // generic routes:
    { path: '/agent/call',        body: { agent_id: a, to } },
    { path: '/agent/call',        body: { agent_id: a, to_number: t } },
    { path: '/call/start',        body: { agent_id: a, to } },
    { path: '/call',              body: { agent_id: a, to } },
    { path: '/call',              body: { agent_id: a, to_number: t } },
    { path: '/calls',             body: { agent_id: a, to_number: t } },
    { path: '/v1/calls',          body: { agent_id: a, to_number: t } },
  ]).map(x => {
    const b = { ...x.body }
    // include from only if present; try both keys
    if (f) {
      if ('to_number' in b) b.from_number = f
      else b.from = f
    }
    return { path: x.path, body: b }
  })

  const tries = shapes(agentId, to, from)
  const attempts = []
  for (const t of tries) {
    const res = await bolnaFetch(t.path, { method: 'POST', body: JSON.stringify(t.body) })
    attempts.push({ path: t.path, payload: t.body, status: res.status, ok: res.ok, body: res.body })
    if (res.ok) {
      const id = res.body?.call_id || res.body?.id || res.body?.data?.id || null
      return { ok: true, status: res.status, body: { ...res.body, call_id: id }, attempts }
    }
    if (res.status === 404) continue  // try next shape if endpoint not found
  }
  return { ok: false, status: attempts.at(-1)?.status || 0, body: attempts.at(-1)?.body || {}, attempts }
}
