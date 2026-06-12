-- Vishvakarma.OS core tables (aligned with src/types and export-supabase.mjs)

create extension if not exists "pgcrypto";

-- Login / user profile data (id matches auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_created_at on public.projects (created_at desc);
create index if not exists idx_projects_user_id on public.projects (user_id);

create table if not exists public.specs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  content text not null default '',
  version text not null default '1.0.0',
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'deprecated', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_specs_category on public.specs (category);
create index if not exists idx_specs_status on public.specs (status);

create table if not exists public.registry (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('component', 'feature', 'tool')),
  description text,
  metadata jsonb,
  status text not null default 'active' check (status in ('active', 'deprecated')),
  created_at timestamptz not null default now()
);

create index if not exists idx_registry_type on public.registry (type);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  type text not null check (type in ('feature', 'bugfix', 'enhancement')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'implemented')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  requester uuid references auth.users (id) on delete set null,
  reviewer uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  implemented_at timestamptz
);

create index if not exists idx_change_requests_status on public.change_requests (status);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  description text,
  change_requests uuid[] not null default '{}',
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'released')),
  evidence_pack jsonb,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_releases_version on public.releases (version);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null
    check (entity_type in ('project', 'spec', 'registry', 'change_request', 'release', 'optimization_batch')),
  entity_id uuid,
  details jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists idx_audit_logs_timestamp on public.audit_logs (timestamp desc);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

create table if not exists public.route_manifest (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  name text not null,
  component text not null,
  category text not null check (category in ('editor', 'governance', 'system')),
  visible boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_route_manifest_category on public.route_manifest (category);
create index if not exists idx_route_manifest_order on public.route_manifest (order_index);
