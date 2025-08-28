// api/bolna-agents-probe.js
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Content-Type': 'application/json'
}
const BOLNA_BASE = process.env.BOLNA_BASE || 'https://api.bolna.ai'

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }
  const adminKey = event.headers['x-admin-key'] || event.headers['X-Admin-Key']
  if (adminKey !== (process.env.JWT_SECRET || '')) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'forbidden' }) }
  }
  try {
    const res = await fetch(`${BOLNA_BASE}/agent/all`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${process.env.BOLNA_API_KEY || ''}` }
    })
    const text = await res.text()
    return { statusCode: res.status, headers: cors, body: text || '{}' }
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(e?.message || e) }) }
  }
}
