import { withCors } from '../lib/cors.js'
import { json } from '../lib/utils.js'
import { pingDb } from '../lib/db.js'

export const handler = withCors(async () => {
  const dbOk = await pingDb()
  const flags = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    DEMO_USERS: !!process.env.DEMO_USERS,
    BOLNA_API_KEY: !!process.env.BOLNA_API_KEY,
    BOLNA_AGENT_ID: !!process.env.BOLNA_AGENT_ID,
    OUTBOUND_CALLER_ID: !!process.env.OUTBOUND_CALLER_ID,
    PUBLIC_SITE_URL: !!process.env.PUBLIC_SITE_URL
  }
  return json(200, { ok: true, dbOk, env: flags })
})
