module.exports.handler = async (e,c)=>{const m=await import('./agents/index.js');const f=m.handler||m.default;return f(e,c)}
