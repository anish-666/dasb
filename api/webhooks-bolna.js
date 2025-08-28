// api/webhooks-bolna.js
module.exports.handler = async (event, ctx) => {
  const mod = await import('./webhooks/bolna.js')
  const fn = mod.handler || (mod.default && (mod.default.handler || mod.default)) || mod.default
  if (typeof fn !== 'function') return { statusCode: 500, body: 'webhook handler not found' }
  return fn(event, ctx)
}
