import { withCors } from '../../lib/cors.js'
import { json } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'

export const handler = withCors(async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' })
  const auth = requireAuth(event)
  if (!auth.ok) return json(401, { error: auth.err })
  const t = auth.data.t
  const rows = await sql`
    select id, agent_id, customer_number, status, started_at, duration_seconds
    from conversations
    where tenant_id=${t}
    order by started_at desc
    limit 200
  `
  return json(200, { conversations: rows })
})
