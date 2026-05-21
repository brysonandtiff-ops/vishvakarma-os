-- Vishvakarma.OS production auth baseline
-- Adds profile creation and row-level security policies for user-owned app data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

do $$
begin
  if to_regclass('public.projects') is not null then
    alter table public.projects enable row level security;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'projects' and column_name = 'user_id') then
      alter table public.projects add column user_id uuid references auth.users(id) on delete cascade;
    end if;
    alter table public.projects alter column user_id set default auth.uid();
    drop policy if exists "projects_owner_all" on public.projects;
    create policy "projects_owner_all" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if to_regclass('public.change_requests') is not null then
    alter table public.change_requests enable row level security;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'change_requests' and column_name = 'user_id') then
      alter table public.change_requests add column user_id uuid references auth.users(id) on delete cascade;
    end if;
    alter table public.change_requests alter column user_id set default auth.uid();
    drop policy if exists "change_requests_owner_all" on public.change_requests;
    create policy "change_requests_owner_all" on public.change_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if to_regclass('public.registry') is not null then
    alter table public.registry enable row level security;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'registry' and column_name = 'user_id') then
      alter table public.registry add column user_id uuid references auth.users(id) on delete cascade;
    end if;
    alter table public.registry alter column user_id set default auth.uid();
    drop policy if exists "registry_owner_all" on public.registry;
    create policy "registry_owner_all" on public.registry for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if to_regclass('public.releases') is not null then
    alter table public.releases enable row level security;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'releases' and column_name = 'user_id') then
      alter table public.releases add column user_id uuid references auth.users(id) on delete cascade;
    end if;
    alter table public.releases alter column user_id set default auth.uid();
    drop policy if exists "releases_owner_all" on public.releases;
    create policy "releases_owner_all" on public.releases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if to_regclass('public.audit_logs') is not null then
    alter table public.audit_logs enable row level security;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'user_id') then
      alter table public.audit_logs add column user_id uuid references auth.users(id) on delete cascade;
    end if;
    alter table public.audit_logs alter column user_id set default auth.uid();
    drop policy if exists "audit_logs_owner_read" on public.audit_logs;
    create policy "audit_logs_owner_read" on public.audit_logs for select using (auth.uid() = user_id);
    drop policy if exists "audit_logs_owner_insert" on public.audit_logs;
    create policy "audit_logs_owner_insert" on public.audit_logs for insert with check (auth.uid() = user_id);
  end if;
end $$;
