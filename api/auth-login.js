// api/auth-login.js  (CommonJS - no ESM imports)
const jwt = require('jsonwebtoken')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

function j(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...cors },
    body: JSON.stringify(body)
  }
}

function parseDemoUsers() {
  const raw = process.env.DEMO_USERS || ''
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const [email, password, tenant] = s.split(':').map(x => (x || '').trim())
      return { email, password, tenant }
    })
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }
  if (event.httpMethod !== 'POST') return j(405, { error: 'method_not_allowed' })

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch {}
  const { email, password } = body

  const users = parseDemoUsers()
  const found = users.find(u => u.email === email && u.password === password)
  if (!found) return j(401, { error: 'invalid_credentials' })

  const token = jwt.sign({ e: found.email, t: found.tenant }, process.env.JWT_SECRET || 'devsecret', {
    algorithm: 'HS256',
    expiresIn: '7d'
  })

  return j(200, { token, user: { email: found.email, tenant_id: found.tenant } })
}
