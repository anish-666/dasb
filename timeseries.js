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
  const window = sp.get('window') === '30d' ? '30 days' : '7 days'

  const rows = await sql`
    with days as (
      select generate_series(date_trunc('day', now() - interval ${sql(window)}), date_trunc('day', now()), interval '1 day') as d
    )
    select
      to_char(d.d, 'YYYY-MM-DD') as date,
      coalesce(c.cnt,0)::int as total,
      coalesce(c.cn,0)::int as connected,
      coalesce(c.ad,0)::float as avg_duration
    from days d
    left join (
      select date_trunc('day', created_at) as day,
             count(*) as cnt,
             sum(case when success then 1 else 0 end) as cn,
             avg(nullif(duration_seconds,0)) as ad
      from calls where tenant_id=${t}
      group by 1
    ) c on c.day = d.d
    order by d.d asc
  `
  return json(200, { window, series: rows })
})
