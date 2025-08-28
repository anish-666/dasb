create extension if not exists pgcrypto;

create table if not exists agents (
  id text primary key,
  tenant_id text not null,
  name text,
  provider_agent_id text,
  active boolean default true
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  agent_id text,
  customer_number text,
  success boolean default false,
  duration_seconds int default 0,
  created_at timestamptz default now(),
  recording_url text,
  transcript text
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  agent_id text,
  customer_number text,
  status text,
  started_at timestamptz default now(),
  duration_seconds int default 0
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  name text not null,
  status text,
  total int default 0,
  completed int default 0,
  created_at timestamptz default now()
);
