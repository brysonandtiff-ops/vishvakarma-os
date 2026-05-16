-- Projects table (stores Project Manifest JSON)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  manifest JSONB NOT NULL, -- Complete Project Manifest
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Specs table (Spec Center)
CREATE TABLE specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, deprecated
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Registry table (Registry Center)
CREATE TABLE registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- component, feature, tool
  description TEXT,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'active', -- active, deprecated
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Change Requests table
CREATE TABLE change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- feature, bugfix, enhancement
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, implemented
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  requester TEXT,
  reviewer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ
);

-- Releases table (Release Center)
CREATE TABLE releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  change_requests UUID[] DEFAULT '{}', -- Array of change request IDs
  status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, released
  evidence_pack JSONB, -- Test results, smoke tests, validation
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- project_created, change_request_accepted, release_created, etc.
  entity_type TEXT NOT NULL, -- project, spec, registry, change_request, release
  entity_id UUID,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Route Manifest table (single source of truth for navigation)
CREATE TABLE route_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  component TEXT NOT NULL,
  category TEXT NOT NULL, -- editor, governance, system
  visible BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_specs_category ON specs(category);
CREATE INDEX idx_specs_status ON specs(status);
CREATE INDEX idx_registry_type ON registry(type);
CREATE INDEX idx_change_requests_status ON change_requests(status);
CREATE INDEX idx_releases_version ON releases(version);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_route_manifest_category ON route_manifest(category);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_manifest ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for v1.0.0)
CREATE POLICY "Public read access" ON projects FOR SELECT USING (true);
CREATE POLICY "Public write access" ON projects FOR ALL USING (true);

CREATE POLICY "Public read access" ON specs FOR SELECT USING (true);
CREATE POLICY "Public write access" ON specs FOR ALL USING (true);

CREATE POLICY "Public read access" ON registry FOR SELECT USING (true);
CREATE POLICY "Public write access" ON registry FOR ALL USING (true);

CREATE POLICY "Public read access" ON change_requests FOR SELECT USING (true);
CREATE POLICY "Public write access" ON change_requests FOR ALL USING (true);

CREATE POLICY "Public read access" ON releases FOR SELECT USING (true);
CREATE POLICY "Public write access" ON releases FOR ALL USING (true);

CREATE POLICY "Public read access" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Public write access" ON audit_logs FOR ALL USING (true);

CREATE POLICY "Public read access" ON route_manifest FOR SELECT USING (true);
CREATE POLICY "Public write access" ON route_manifest FOR ALL USING (true);