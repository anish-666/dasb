# DocVAi (Bolna AI Dashboard)

Chatdash-style, white-label dashboard for DocVAi. React+Vite SPA, Netlify Functions (Node 18), Neon/Postgres via `postgres`, JWT demo auth, multitenant (`tenant_id`), and Bolna webhooks.

## Quick start

1. **Create Neon DB**, then run migrations + seed:

```bash
psql "$DATABASE_URL" -f db/migrations.sql
psql "$DATABASE_URL" -f db/seed.sql
```

2. **Set environment variables (Netlify → Site settings → Environment variables)**

```
DATABASE_URL=postgres://neondb_owner:npg_BIdL06cnZPpy@ep-holy-fog-adwy7d1f-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=supersecretjwtkey123
BOLNA_API_KEY=bn-3395cb6c11194fcca5153e09355f04e6
BOLNA_AGENT_ID=8c87d6d3-e607-42d1-bf32-3c7058cab0c0
OUTBOUND_CALLER_ID=+918035316096
PUBLIC_SITE_URL=https://docvai-dashboard.netlify.app
DEMO_USERS=admin@demo.com:demo123:t_demo,client1@demo.com:client123:t_client1
VITE_API_BASE=
```

3. **Deploy to Netlify**

- Connect the repo, Netlify will build with `npm run build` and publish `dist`.
- Functions live under `/api` (configured in `netlify.toml`).

4. **Smoke test**

- Open `/api/status` → `{ ok: true, ts }`
- Open `/api/debug-health` → verify `dbOk:true` and env flags.

5. **Set Bolna webhook**

In **Bolna console**, set:
```
https://docvai-dashboard.netlify.app/api/webhooks/bolna
```

> Outbound call creation includes `?call_id=<uuid>&tenant_id=<tenant>` so webhooks update the right rows.

6. **Login**

- Email: `admin@demo.com`  Password: `demo123`
- Explore: Overview, Conversations, Agents, Campaigns, Outbound, Settings.

## API Summary

- `POST /api/auth/login` → `{ token, user }` (env `DEMO_USERS`; JWT `{ e, t }`)
- `GET /api/status` → health ping
- `GET /api/debug-health` → env flags + db ping
- `GET /api/agents` → list tenant agents
- `GET /api/conversations` → list conversations
- `GET /api/conversations/transcript?id=:uuid` → transcript + recording
- `GET /api/analytics/summary` → `{ total_calls, connected, avg_duration }`
- `GET /api/analytics/timeseries?window=7d|30d` → daily buckets
- `GET /api/campaigns` → list campaigns
- `POST /api/campaigns` → create campaign `{ name }`
- `POST /api/calls/outbound` → `{ numbers:[], agentId?, callerId? }` → inserts `calls` and triggers Bolna API
- `POST /api/webhooks/bolna` → receives events:
  - `call.started` → create conversation (in-progress)
  - `call.connected` → mark `calls.success=true`
  - `call.completed` → update durations + mark conversation completed
  - `transcript.ready` → save transcript
  - `recording.ready` → save `recording_url`

All routes handle **CORS** + **OPTIONS**.

## Notes

- Server DB access: Neon driver via `postgres` with SSL.
- Multitenancy: every query filters `tenant_id` from JWT claim `t`.
- Frontend calls same-origin `/api/*` (set `VITE_API_BASE` if proxying).
- For Vercel: this repo targets Netlify; Vercel support would need API rewrites and function adapters.
