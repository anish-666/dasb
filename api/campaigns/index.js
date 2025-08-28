import { withCors } from '../../lib/cors.js'
import { json, parseBody } from '../../lib/utils.js'
import { sql } from '../../lib/db.js'
import { requireAuth } from '../../lib/auth.js'

export const handler = withCors(async (event) => {
  const auth = requireAuth(event)
  if (!auth.ok) return json(401, { error: auth.err })
  const t = auth.data.t

  if (event.httpMethod === 'GET') {
    const rows = await sql`select * from campaigns where tenant_id=${t} order by created_at desc limit 200`
    return json(200, { campaigns: rows })
  }

  if (event.httpMethod === 'POST') {
    const { name, status = 'queued', total = 0 } = parseBody(event)
    if (!name) return json(400, { error: 'name_required' })
    const row = (await sql`
      insert into campaigns (tenant_id, name, status, total, completed)
      values (${t}, ${name}, ${status}, ${total}, 0)
      returning *
    `)[0]
    return json(201, row)
  }

  return json(405, { error: 'method_not_allowed' })
})
