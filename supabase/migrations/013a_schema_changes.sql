-- PART 1: Schema changes only (no RLS)
-- Run this FIRST. If it succeeds, run Part 2.

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 2. Migrate user_role enum: 'admin' → 'owner'
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE TEXT;

-- Drop all policies that depend on old user_role type
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Drop functions that depend on old user_role type
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_org_owner() CASCADE;

-- Drop old enum, create new one
DROP TYPE IF EXISTS user_role;
CREATE TYPE user_role AS ENUM ('owner', 'site_engineer', 'client');

-- Convert data and column
UPDATE users SET role = 'owner' WHERE role = 'admin';
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'site_engineer'::user_role;

-- 3. Add org_id to users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'org_id') THEN
    ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- 4. Add org_id + engineer_id to projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'org_id') THEN
    ALTER TABLE projects ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'engineer_id') THEN
    ALTER TABLE projects ADD COLUMN engineer_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_engineer_id ON projects(engineer_id);

-- 5. Add org_id to all other tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['site_photos','materials','expenses','budget_alerts','progress_reports','notifications','bill_scans','ai_insights'] LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl AND column_name = 'org_id') THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE', tbl);
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_site_photos_org_id ON site_photos(org_id);
CREATE INDEX IF NOT EXISTS idx_materials_org_id ON materials(org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON expenses(org_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_org_id ON budget_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_org_id ON progress_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(org_id);

-- 6. Helper functions
CREATE OR REPLACE FUNCTION get_user_org_id() RETURNS UUID AS $$
  SELECT org_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_org_owner() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'owner');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'PART 1 COMPLETE' as status;
