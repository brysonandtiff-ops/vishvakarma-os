-- Vishvakarma.OS uses Supabase REST/RLS and does not ship a GraphQL client.
-- Keep pg_graphql installed for platform compatibility, but remove public API access.

revoke execute on function graphql_public.graphql(text, text, jsonb, jsonb)
  from public, anon, authenticated;

revoke usage on schema graphql_public
  from public, anon, authenticated;

comment on schema graphql_public is
  'GraphQL endpoint intentionally disabled for Vishvakarma.OS; application access uses REST with RLS.';
