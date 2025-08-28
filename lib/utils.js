export function json(statusCode, obj, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(obj)
  }
}

export function getQuery(event) {
  const url = new URL(event.rawUrl || `https://${event.headers.host}${event.path}`)
  return url.searchParams
}

export function parseBody(event) {
  try { return event.body ? JSON.parse(event.body) : {} } catch { return {} }
}
