import { withCors } from '../../lib/cors.js'
import { json } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'

export const handler = withCors(async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'method_not_allowed' })
  const auth = requireAuth(event)
  if (!auth.ok) return json(401, { error: auth.err })
  const t = auth.data.t

  const sp = new URL(event.rawUrl).searchParams
  const days = sp.get('window') === '30d' ? 30 : 7

  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - days)

  // Use started_at (fallback ended_at) since your table doesn't have created_at
  const rows = await sql/*sql*/`
    with days as (
      select generate_series(date_trunc('day', ${start}), date_trunc('day', now()), interval '1 day') as d
    ),
    agg as (
      select
        date_trunc('day', coalesce(started_at, ended_at, now())) as day,
        count(*) as cnt,
        count(*) filter (
          where (status in ('connected','completed','answered','success'))
             or (disposition in ('connected','completed','answered','success'))
        ) as cn,
        avg(nullif(duration_sec,0)) as ad
      from calls
      where tenant_id = ${t}
      group by 1
    )
    select
      to_char(d.d, 'YYYY-MM-DD') as date,
      coalesce(a.cnt,0)::int as total,
      coalesce(a.cn,0)::int as connected,
      coalesce(a.ad,0)::float as avg_duration
    from days d
    left join agg a on a.day = d.d
    order by d.d asc
  `
  return json(200, { window: `${days}d`, series: rows })
})
