import { withCors } from '../../lib/cors.js'
import { json, parseBody } from '../../lib/utils.js'
import { parseDemoUsers, issueJwt } from '../../lib/auth.js'

export const handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' })
  const { email, password } = parseBody(event)
  const users = parseDemoUsers()
  const found = users.find(u => u.email === email && u.password === password)
  if (!found) return json(401, { error: 'invalid_credentials' })
  const token = issueJwt({ email: found.email, tenant: found.tenant })
  return json(200, { token, user: { email: found.email, tenant_id: found.tenant } })
})
