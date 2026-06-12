#!/usr/bin/env node
/**
 * Import Firestore export JSON into Supabase Postgres via service role.
 *
 * Usage: node scripts/migration/import-supabase.mjs [--in migration/export-firestore.json]
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const inArg = process.argv.find((arg) => arg.startsWith('--in='));
const inPath = inArg?.slice('--in='.length) ?? join(process.cwd(), 'migration/export-firestore.json');

function getAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function mapProject(doc) {
  return {
    id: doc.id,
    user_id: doc.ownerId ?? doc.user_id ?? doc.userId,
    name: doc.name,
    description: doc.description ?? null,
    manifest: doc.manifest ?? {},
    collaborators: Array.isArray(doc.collaborators) ? doc.collaborators : [],
    collab_snapshot: doc.collabSnapshot ?? doc.collab_snapshot ?? null,
    created_at: doc.created_at ?? new Date().toISOString(),
    updated_at: doc.updated_at ?? doc.created_at ?? new Date().toISOString(),
  };
}

async function upsertRows(client, table, rows, onConflict = 'id') {
  if (!rows.length) return;
  const { error } = await client.from(table).upsert(rows, { onConflict });
  if (error) throw error;
}

async function main() {
  const payload = JSON.parse(readFileSync(inPath, 'utf8'));
  const client = getAdminClient();
  const collections = payload.collections ?? {};

  if (collections.profiles?.length) {
    await upsertRows(
      client,
      'profiles',
      collections.profiles.map((row) => ({
        id: row.id,
        email: row.email ?? null,
        full_name: row.full_name ?? row.fullName ?? null,
        avatar_url: row.avatar_url ?? row.avatarUrl ?? null,
        role: row.role ?? 'user',
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
      }))
    );
  }

  if (collections.projects?.length) {
    await upsertRows(client, 'projects', collections.projects.map(mapProject));
  }

  for (const [table, key] of [
    ['specs', 'specs'],
    ['registry', 'registry'],
    ['change_requests', 'change_requests'],
    ['releases', 'releases'],
    ['audit_logs', 'audit_logs'],
    ['route_manifest', 'route_manifest'],
  ]) {
    if (collections[key]?.length) {
      await upsertRows(client, table, collections[key]);
    }
  }

  if (collections.billing?.length) {
    await upsertRows(
      client,
      'billing',
      collections.billing.map((row) => ({
        id: row.id,
        plan: row.plan ?? 'starter',
        status: row.status ?? 'none',
        stripe_customer_id: row.stripeCustomerId ?? row.stripe_customer_id ?? null,
        stripe_subscription_id: row.stripeSubscriptionId ?? row.stripe_subscription_id ?? null,
        current_period_end: row.currentPeriodEnd ?? row.current_period_end ?? null,
        trial_end: row.trialEnd ?? row.trial_end ?? null,
        updated_at: row.updated_at ?? new Date().toISOString(),
      }))
    );
  }

  if (collections.optimization_batches?.length) {
    await upsertRows(
      client,
      'optimization_batches',
      collections.optimization_batches.map((row) => ({
        id: row.id,
        user_id: row.userId ?? row.user_id,
        batch: row.batch ?? row,
        created_at: row.createdAt ?? row.created_at ?? new Date().toISOString(),
      }))
    );
  }

  console.log('[PASS] Supabase import completed from', inPath);
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
