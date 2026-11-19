import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const migration=readFileSync(resolve(process.cwd(),'supabase/migrations/20261119090000_verified_family_admin_and_profile_guard.sql'),'utf8');
const gateway=readFileSync(resolve(process.cwd(),'src/backend/supabase/supabaseProfileGateway.ts'),'utf8');
describe('verified family admin safeguards',()=>{
  it('requires trusted Supabase email confirmation',()=>{
    expect(migration).toContain('new.email_confirmed_at is not null');
    expect(migration).toContain("'ajkdentureventure@gmail.com'");
    expect(migration).toContain('from auth.users as u');
    expect(migration).not.toContain('raw_user_meta_data');
  });
  it('blocks browser role and billing promotion',()=>{
    expect(migration).toContain('revoke update on table public.profiles');
    expect(migration).toContain('grant update (full_name, avatar_url, updated_at)');
    expect(migration).toContain("and role = 'user'");
    expect(migration).toContain('billing_plan is null');
  });
  it('browser profile gateway cannot upsert privileged role',()=>{
    expect(gateway).not.toContain('.upsert({');
    expect(gateway).not.toContain("role: 'user'");
    expect(gateway).toContain("Pick<Profile, 'full_name' | 'avatar_url'>");
  });
});
