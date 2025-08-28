// api/agents-index.js
module.exports.handler = async (event, context) => {
  const mod = await import('./agents/index.js')
  const fn = mod.handler || (mod.default && (mod.default.handler || mod.default)) || mod.default
  if (typeof fn !== 'function') return { statusCode: 500, body: 'agents index not found' }
  return fn(event, context)
}
module.exports.handler = async (e,c)=>{const m=await import('./agents/index.js');const f=m.handler||m.default;return f(e,c)}
