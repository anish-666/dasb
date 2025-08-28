// api/bolna-call-probe.js (CJS)
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

    const payloads = (a, t, f) => {
      const bases = [
        { path: `/agent/${a}/call`,           body: { to: t } },
        { path: `/agent/${a}/call/start`,     body: { to: t } },
        { path: `/agent/${a}/start`,          body: { to: t } },
        { path: `/agent/${a}/dial`,           body: { to: t } },
        { path: `/agent/${a}/outbound`,       body: { to: t } },
        { path: `/agent/${a}/phone`,          body: { to: t } },
        { path: `/agent/${a}/phone/call`,     body: { to: t } },
        { path: `/agent/${a}/conversation/start`, body: { to: t } },
        { path: `/agent/${a}/calls`,          body: { to: t } },

        { path: `/agent/call`,                body: { agent_id: a, to: t } },
        { path: `/agent/call`,                body: { agent_id: a, to_number: t } },

        { path: `/call/start`,                body: { agent_id: a, to: t } },
        { path: `/call`,                      body: { agent_id: a, to: t } },
        { path: `/call`,                      body: { agent_id: a, to_number: t } },

        { path: `/calls`,                     body: { agent_id: a, to_number: t } },
        { path: `/calls/start`,               body: { agent_id: a, to_number: t } },

        { path: `/v1/call`,                   body: { agent_id: a, to_number: t } },
        { path: `/v1/calls`,                  body: { agent_id: a, to_number: t } },

        { path: `/voice/call`,                body: { agent_id: a, to: t } },
        { path: `/telephony/call`,            body: { agent_id: a, to: t } },

        { path: `/start_call`,                body: { agent_id: a, to: t } },
        { path: `/start`,                     body: { agent_id: a, to: t } },
        { path: `/conversation/start`,        body: { agent_id: a, to: t } },
        { path: `/phone/call`,                body: { agent_id: a, to: t } },
        { path: `/outbound/call`,             body: { agent_id: a, to: t } },
      ]

      // try number field variants
      const expand = []
      for (const b of bases) {
        expand.push(b)
        expand.push({ path: b.path, body: { ...b.body, to_number: t } })
        expand.push({ path: b.path, body: { ...b.body, phone: t } })
        expand.push({ path: b.path, body: { ...b.body, phone_number: t } })
        expand.push({ path: b.path, body: { ...b.body, number: t } })
        expand.push({ path: b.path, body: { ...b.body, destination: t } })
        expand.push({ path: b.path, body: { ...b.body, callee: t } })
      }

      // add from if present (both key styles)
      return expand.map(x => {
        const body = { ...x.body }
        if (f) {
          if ('to_number' in body || 'phone_number' in body) body.from_number = f
          else body.from = f
        }
        return { path: x.path, body }
      })
    }

    const attempts = []
    for (const s of payloads(agent, to, from)) {
      const r = await post(s.path, s.body, key)
      attempts.push(r)
      if (r.ok) {
        const id = r.body?.id || r.body?.call_id || r.body?.data?.id || null
        return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, hit: r.path, id, attempts }) }
      }
      if (r.status === 404) continue
    }

    const last = attempts[attempts.length - 1]
    return { statusCode: last?.status || 500, headers: cors, body: JSON.stringify({ ok: false, attempts }) }
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(e?.message || e) }) }
  }
}
