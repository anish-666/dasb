// CJS shim: loads the real handler from nested file regardless of ESM/CJS
module.exports.handler = async (event, context) => {
  const mod = await import('./analytics/summary.js')
  const fn = mod.handler || (mod.default && (mod.default.handler || mod.default)) || mod.default
  if (typeof fn !== 'function') return { statusCode: 500, body: 'analytics summary not found' }
  return fn(event, context)
}
