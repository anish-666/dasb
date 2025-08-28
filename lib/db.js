import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) console.warn('[DB] Missing DATABASE_URL')

export const sql = postgres(url, {
  ssl: 'require',
  idle_timeout: 5,
  connect_timeout: 30,
  max: 3
})

export async function pingDb() {
  try {
    await sql`select 1`
    return true
  } catch (e) {
    console.error('[DB] ping failed', e)
    return false
  }
}
