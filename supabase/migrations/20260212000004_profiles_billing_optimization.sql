-- Billing columns on profiles + dedicated billing table + optimization batches

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists billing_plan text;

create table if not exists public.billing (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'starter'
    check (plan in ('starter', 'studio', 'enterprise')),
  status text not null default 'none'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'none')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  trial_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_billing_stripe_customer on public.billing (stripe_customer_id);

alter table public.billing enable row level security;

create policy billing_select_own on public.billing
  for select to authenticated
  using (auth.uid() = id);

create policy billing_insert_own on public.billing
  for insert to authenticated
  with check (auth.uid() = id);

create policy billing_update_own on public.billing
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists public.optimization_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  batch jsonb not null default '{}'::jsonb,
  project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_optimization_batches_user on public.optimization_batches (user_id, created_at desc);

alter table public.optimization_batches enable row level security;

create policy optimization_batches_select_own on public.optimization_batches
  for select to authenticated
  using (user_id = auth.uid());

create policy optimization_batches_insert_own on public.optimization_batches
  for insert to authenticated
  with check (user_id = auth.uid());

create policy optimization_batches_update_own on public.optimization_batches
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
