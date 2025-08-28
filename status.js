import { withCors } from '../lib/cors.js'
import { json } from '../lib/utils.js'

export const handler = withCors(async () => {
  return json(200, { ok: true, ts: new Date().toISOString() })
})
