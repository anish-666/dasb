module.exports.handler = async (event, context) => {
  const mod = await import('./analytics/timeseries.js')
  const fn = mod.handler || (mod.default && (mod.default.handler || mod.default)) || mod.default
  if (typeof fn !== 'function') return { statusCode: 500, body: 'analytics timeseries not found' }
  return fn(event, context)
}
