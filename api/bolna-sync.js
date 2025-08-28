module.exports.handler = async (event, ctx) => {
  const mod = await import('./agents/index.js') // re-use the same handler with ?refresh=1
  event.rawUrl = (event.rawUrl || 'https://local/agents?refresh=1').replace(/(\?|$)/, '?refresh=1')
  const fn = mod.handler || (mod.default && (mod.default.handler || mod.default)) || mod.default
  return fn(event, ctx)
}
