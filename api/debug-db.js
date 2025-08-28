// api/debug-db.js
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
}

function j(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', ...cors }, body: JSON.stringify(body) }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }
  try {
    const { sql } = await import('../lib/db.js')
    const [dbrow] = await sql`select current_database() as db, current_schema() as schema`
    const cols = await sql`
      select column_name, data_type
      from information_schema.columns
      where table_schema = current_schema()
        and table_name = 'calls'
      order by column_name
    `
    const [cnt] = await sql`select count(*)::int as n from calls`
    return j(200, { db: dbrow.db, schema: dbrow.schema, calls_columns: cols, calls_count: cnt.n })
  } catch (e) {
    return j(500, { error: String(e && e.message || e) })
  }
}
