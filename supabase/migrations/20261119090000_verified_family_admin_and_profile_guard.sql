-- OWNER REVIEW CANDIDATE ONLY; DO NOT ASSERT LIVE DATABASE APPLICATION.
-- Require proven Supabase email ownership before special account grant.
begin;
revoke update on table public.profiles from public, anon, authenticated;
grant update (full_name, avatar_url, updated_at) on table public.profiles to authenticated;
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id
    and role = 'user'
    and stripe_customer_id is null
    and billing_plan is null);
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
create or replace function app_private.promote_verified_family_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) = 'ajkdentureventure@gmail.com'
     and new.email_confirmed_at is not null then
    update public.profiles set role = 'admin', updated_at = now()
    where id = new.id and role is distinct from 'admin';
  end if;
  -- OLD is not available on INSERT. Keep this in a separate guarded branch.
  if tg_op = 'UPDATE' then
    if lower(coalesce(old.email, '')) = 'ajkdentureventure@gmail.com'
       and lower(coalesce(new.email, '')) <> 'ajkdentureventure@gmail.com' then
      update public.profiles set role = 'user', updated_at = now()
      where id = new.id and role = 'admin';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function app_private.promote_verified_family_admin() from public, anon, authenticated;
grant usage on schema app_private to supabase_auth_admin;
grant execute on function app_private.promote_verified_family_admin() to supabase_auth_admin;
drop trigger if exists on_auth_user_verified_family_admin on auth.users;
-- on_auth_user_verified_family_admin alphabetically runs after on_auth_user_created.
create trigger on_auth_user_verified_family_admin
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute function app_private.promote_verified_family_admin();
-- Backfill only the owner-approved account IF its real email was confirmed.
update public.profiles as p
set role = 'admin', updated_at = now()
from auth.users as u
where p.id = u.id
  and lower(coalesce(u.email,'')) = 'ajkdentureventure@gmail.com'
  and u.email_confirmed_at is not null
  and p.role is distinct from 'admin';
commit;
