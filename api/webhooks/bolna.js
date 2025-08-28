import { sql } from '../../lib/db.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    const body = JSON.parse(event.body || '{}')

    // normalize
    const type = body.type || body.event || body.status || ''
    const call = body.call || body.data || body.payload || body || {}
    const providerId = call.call_id || call.id || body.call_id || body.id || null
    const phone = call.to_number || call.to || call.phone || null
    const recording = call.recording_url || body.recording_url || null
    const transcript = call.transcript || body.transcript || null
    const duration = call.duration_sec || call.duration_seconds || call.duration || null
    const when = call.timestamp || call.created_at || call.completed_at || null

    const cols = await sql`
      select column_name from information_schema.columns
      where table_schema = current_schema() and table_name = 'calls'
    `
    const has = (c) => cols.some(r => r.column_name === c)
    const hasPhone = has('phone')
    const hasProvCall = has('provider_call_id')
    const hasStatus = has('status')
    const hasDisposition = has('disposition')
    const hasStartedAt = has('started_at')
    const hasEndedAt = has('ended_at')
    const hasDurationSec = has('duration_sec')
    const hasRecording = has('recording_url')
    const hasSummary = has('summary')

    // locate the row
    let target
    if (hasProvCall && providerId) {
      target = await sql`select id from calls where provider_call_id = ${providerId} limit 1`
    }
    if (!target?.length && hasPhone && phone) {
      target = await sql`select id from calls where phone = ${phone} order by started_at desc nulls last limit 1`
    }
    if (!target?.length) return { statusCode: 200, body: JSON.stringify({ ok: true, note: 'no matching row' }) }
    const id = target[0].id

    // apply updates
    const set = []
    if (/started/i.test(type)) {
      if (hasStatus) set.push(sql`status='started'`)
      if (hasDisposition) set.push(sql`disposition='in-progress'`)
      if (hasStartedAt && when) set.push(sql`started_at = to_timestamp(${Date.parse(when)/1000})`)
    }
    if (/connected/i.test(type)) {
      if (hasStatus) set.push(sql`status='connected'`)
    }
    if (/completed|ended|finished/i.test(type)) {
      if (hasStatus) set.push(sql`status='completed'`)
      if (hasDisposition) set.push(sql`disposition='completed'`)
      if (hasEndedAt && when) set.push(sql`ended_at = to_timestamp(${Date.parse(when)/1000})`)
      if (hasDurationSec && duration != null) set.push(sql`duration_sec = ${+duration || 0}`)
    }
    if (/recording/i.test(type) && recording && hasRecording) {
      set.push(sql`recording_url = ${recording}`)
    }
    if (/transcript/i.test(type) && transcript && hasSummary) {
      set.push(sql`summary = ${transcript.slice(0, 2000)}`)
    }

    if (set.length) {
      await sql`update calls set ${sql(set)} where id=${id}`
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(e?.message||e) }) }
  }
}
