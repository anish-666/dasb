// api/auth-login.mjs
// Universal shim: works whether ./auth/login.js is ESM (named export) or CommonJS.
export async function handler(event, context) {
  const mod = await import('./auth/login.js');   // may load as ESM or CJS
  const fn =
    mod.handler ||                 // ESM: named export
    (mod.default && (mod.default.handler || mod.default)) || // CJS: module.exports.handler OR module.exports = handler
    mod.default;                   // ESM: default export (not used here, but safe)
  if (typeof fn !== 'function') {
    return { statusCode: 500, body: 'Auth function not found' };
  }
  return fn(event, context);
}
