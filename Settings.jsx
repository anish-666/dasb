import React from 'react'

const WEBHOOK = `${import.meta.env.VITE_API_BASE || ''}/api/webhooks/bolna`.replace(/\/$/, '')

export default function Settings() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="bg-white p-4 rounded shadow mt-4 space-y-2">
        <div className="text-sm text-gray-600">Webhook URL</div>
        <code className="block bg-gray-50 p-2 rounded text-sm">{WEBHOOK}</code>
        <p className="text-xs text-gray-500">Set this in Bolna console for DocVAi.</p>
        <div className="pt-4">
          <div className="text-sm text-gray-600">Defaults & Env flags</div>
          <ul className="text-sm list-disc pl-5">
            <li>Default Agent ID: {import.meta.env.VITE_DEFAULT_AGENT_ID || 'uses server env BOLNA_AGENT_ID'}</li>
            <li>Caller ID: {import.meta.env.VITE_DEFAULT_CALLER_ID || 'uses server env OUTBOUND_CALLER_ID'}</li>
            <li>Public Site URL: {import.meta.env.VITE_PUBLIC_SITE_URL || 'uses server env PUBLIC_SITE_URL'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
