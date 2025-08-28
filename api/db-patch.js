// api/db-patch.js
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
}
function j(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', ...cors }, body: JSON.stringify(body) }
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }
  if (event.httpMethod !== 'POST') return j(405, { error: 'method_not_allowed' })
  const key = event.headers['x-admin-key'] || event.headers['X-Admin-Key']
  if (key !== (process.env.JWT_SECRET || 'devsecret')) return j(403, { error: 'forbidden' })
  try {
    const { sql } = await import('../lib/db.js')
    await sql`ALTER TABLE calls ADD COLUMN IF NOT EXISTS success boolean DEFAULT false`
    await sql`ALTER TABLE calls ADD COLUMN IF NOT EXISTS duration_seconds int DEFAULT 0`
    await sql`ALTER TABLE calls ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`
    await sql`ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url text`
    await sql`ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript text`
    await sql`UPDATE calls SET created_at = now() WHERE created_at IS NULL`
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS duration_seconds int DEFAULT 0`
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now()`
    return j(200, { ok: true })
  } catch (e) {
    return j(500, { ok: false, error: String(e && e.message || e) })
  }
}
