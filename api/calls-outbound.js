// api/calls-outbound.js
module.exports.handler = async (event, context) => {
  const mod = await import('./calls/outbound.js') // ESM handler below
  const fn = mod.handler || (mod.default && (mod.default.handler || mod.default)) || mod.default
  if (typeof fn !== 'function') return { statusCode: 500, body: 'calls outbound handler not found' }
  return fn(event, context)
}
