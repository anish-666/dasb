// lib/auth.js
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret'

function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET)
}
function verifyJwtOptional(token) {
  try { return verifyJwt(token) } catch { return null }
}

module.exports = { signJwt, verifyJwt, verifyJwtOptional }
