// api/agents-index.js (CJS)
const { sql } = require('../lib/db.js')
const { listAgents } = require('../lib/bolna.js')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Content-Type': 'application/json'
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const admin = event.headers['x-admin-key'] || event.headers['X-Admin-Key']
  const isAdmin = admin && admin === (process.env.JWT_SECRET || '')

  try {
    const url = new URL(event.rawUrl || 'http://x/')
    const refresh = url.searchParams.get('refresh')
    const tenant_id = 't_demo'

    if (refresh && isAdmin) {
      const agents = await listAgents()
      for (const a of agents) {
        const id = `agent_${a.id}`
        const name = a.agent_name || `Agent ${a.id}`
        await sql`
          insert into agents (id, tenant_id, name, provider_agent_id, active)
          values (${id}, ${tenant_id}, ${name}, ${a.id}, true)
          on conflict (id) do update set name = excluded.name, provider_agent_id = excluded.provider_agent_id, active = true
        `
      }
    }

    const rows = await sql`select id, tenant_id, name, provider_agent_id, active from agents where tenant_id = ${tenant_id} order by name asc`
    return { statusCode: 200, headers, body: JSON.stringify(rows) }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e?.message || e) }) }
  }
}
