import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'devsecret'

export function parseDemoUsers() {
  const raw = process.env.DEMO_USERS || ''
  // format: email:password:tenant, separated by commas
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const [email, password, tenant] = s.split(':')
      return { email, password, tenant }
    })
}

export function issueJwt({ email, tenant }) {
  const payload = { e: email, t: tenant }
  return jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '7d' })
}

export function requireAuth(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization
  if (!auth || !auth.startsWith('Bearer ')) return { ok: false, err: 'no_token' }
  const token = auth.slice(7)
  try {
    const data = jwt.verify(token, SECRET)
    return { ok: true, data }
  } catch (e) {
    return { ok: false, err: 'invalid_token' }
  }
}
