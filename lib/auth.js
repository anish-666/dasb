// lib/auth.js (CommonJS)
const jwt = require('jsonwebtoken');

function parseDemoUsers(env = process.env.DEMO_USERS || '') {
  // DEMO_USERS: "email:password:tenant,email2:pass2:tenant2"
  const users = {};
  env.split(',').map(s => s.trim()).filter(Boolean).forEach(pair => {
    const [email, password, tenant_id] = pair.split(':');
    if (email && password && tenant_id) {
      users[email.toLowerCase()] = { password, tenant_id };
    }
  });
  return users;
}

function issueToken(tenant_id, email) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign({ t: tenant_id, e: email }, secret, { expiresIn: '7d' });
}

function requireAuth(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'missing_bearer' };
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { ok: true, tenant_id: payload.t, email:_
