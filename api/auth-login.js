// CommonJS shim so it works even if the runtime treats functions as CJS
module.exports.handler = async (event, context) => {
  const mod = await import('./auth/login.js') // ESM module
  return mod.handler(event, context)
}
