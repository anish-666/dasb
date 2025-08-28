import { withCors } from '../../lib/cors.js'
import { json } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'

export const handler = withCors(async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' })
  const auth = requireAuth(event)
  if (!auth.ok) return json(401, { error: auth.err })
  const t = auth.data.t

  const totals = await sql`
    select
      count(*)::int as total_calls,
      sum(case when success then 1 else 0 end)::int as connected,
      coalesce(avg(nullif(duration_seconds,0)),0)::float as avg_duration
    from calls
    where tenant_id=${t}
  `
  return json(200, totals[0])
})
