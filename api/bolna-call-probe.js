// api/bolna-call-probe.js
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Content-Type': 'application/json'
}
const BOLNA_BASE = process.env.BOLNA_BASE || 'https://api.bolna.ai'

async function post(path, body, key) {
  const res = await fetch(`${BOLNA_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let json; try { json = text ? JSON.parse(text) : {} } catch { json = { raw: text } }
  return { path, payload: body, status: res.status, ok: res.ok, body: json }
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }
  const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key']
  if (adminKey !== (process.env.JWT_SECRET || '')) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'forbidden' }) }
  }
  try {
    const key = process.env.BOLNA_API_KEY || ''
    const url = new URL(event.rawUrl || 'http://x/')
    const agent = url.searchParams.get('agent') || process.env.BOLNA_AGENT_ID || ''
    const to = url.searchParams.get('to') || ''
    const from = url.searchParams.get('from') || ''   // optional

    if (!agent || !to) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'missing agent or to' }) }
    }

    const shapes = (a, t, f) => ([
      { path: `/agent/${a}/call`,  body: { to: t } },
      { path: `/agent/${a}/call`,  body: { to_number: t } },
      { path: `/agent/call`,       body: { agent_id: a, to: t } },
      { path: `/agent/call`,       body: { agent_id: a, to_number: t } },
      { path: `/call/start`,       body: { agent_id: a, to: t } },
      { path: `/call`,             body: { agent_id: a, to: t } },
      { path: `/call`,             body: { agent_id: a, to_number: t } },
      { path: `/calls`,            body: { agent_id: a, to_number: t } },
      { path: `/v1/calls`,         body: { agent_id: a, to_number: t } },
    ]).map(x => {
      const b = { ...x.body }
      if (f) {
        if ('to_number' in b) b.from_number = f
        else b.from = f
      }
      return { path: x.path, body: b }
    })

    const attempts = []
    for (const s of shapes(agent, to, from)) {
      const r = await post(s.path, s.body, key)
      attempts.push(r)
      if (r.ok) return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, hit: r.path, id: r.body?.id || r.body?.call_id, attempts }) }
      if (r.status === 404) continue
    }
    const last = attempts[attempts.length - 1]
    return { statusCode: last?.status || 500, headers: cors, body: JSON.stringify({ ok: false, attempts }) }
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(e?.message || e) }) }
  }
}
