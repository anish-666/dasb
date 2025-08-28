import { withCors } from '../../lib/cors.js'
import { json } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'
import { listAgents } from '../../lib/bolna.js'

export const handler = withCors(async (event) => {
  const auth = requireAuth(event)
  // Admin override (so you can sync from the browser if needed)
  const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key']
  if (!auth.ok && adminKey === (process.env.JWT_SECRET || '')) {
    auth.ok = true
    auth.data = { t: 't_demo', e: 'admin@demo.com' }
  }
  if (!auth.ok) return json(401, { error: auth.err || 'no_token' })
  const tenant = auth.data.t

  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' })
  const sp = new URL(event.rawUrl).searchParams
  const refresh = sp.get('refresh') === '1' || sp.get('sync') === '1'

  if (refresh) {
    const res = await listAgents()
    const items = Array.isArray(res.body) ? res.body
                : Array.isArray(res.body?.data) ? res.body.data
                : []
    for (const a of items) {
      const pid = String(a.id ?? a.agent_id ?? a.provider_agent_id ?? '').trim()
      const name = String(a.name ?? a.title ?? `Agent ${pid}`).slice(0, 120)
      if (!pid) continue
      await sql`
        insert into agents (id, tenant_id, name, provider_agent_id, active)
        values (${`agent_${pid}`}, ${tenant}, ${name}, ${pid}, true)
        on conflict (id) do update set
          tenant_id = excluded.tenant_id,
          name = excluded.name,
          provider_agent_id = excluded.provider_agent_id,
          active = true
      `
    }
  }

  const rows = await sql`
    select id, tenant_id, name, provider_agent_id, active
    from agents
    where tenant_id = ${tenant}
    order by name asc nulls last
  `
  return json(200, rows)
})
