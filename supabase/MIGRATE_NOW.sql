-- ============================================================
-- BuildTrack AI: Combined Migration Script (Fixed)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- ============================================================
-- PART 1: Schema Changes
-- ============================================================

-- 0. DROP ALL EXISTING POLICIES FIRST (explicit list)
-- This must happen before any enum changes

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Also drop any policies on organizations if it already exists
DROP POLICY IF EXISTS "Owners can manage their org" ON organizations;
DROP POLICY IF EXISTS "Members can view their org" ON organizations;

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

-- 2. Add auth_id to users table (links public.users to auth.users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_id') THEN
    ALTER TABLE users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Populate auth_id for existing demo users by matching email
UPDATE users SET auth_id = au.id
FROM auth.users au
WHERE users.email = au.email AND users.auth_id IS NULL;

-- 3. Migrate user_role enum: 'admin' → 'owner'
-- Drop functions that depend on old user_role type
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_org_owner() CASCADE;
DROP FUNCTION IF EXISTS get_user_org_id() CASCADE;

-- Now safe to alter the enum
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users ALTER COLUMN role TYPE TEXT;

-- Drop old enum, create new one
DROP TYPE IF EXISTS user_role;
CREATE TYPE user_role AS ENUM ('owner', 'site_engineer', 'client');

-- Convert data and column
UPDATE users SET role = 'owner' WHERE role = 'admin';
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'site_engineer'::user_role;

-- 4. Add org_id to users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'org_id') THEN
    ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

-- 5. Add org_id + engineer_id to projects
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

-- 6. Add org_id to all other tables
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

-- 7. Helper functions
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

SELECT 'PART 1 COMPLETE: Schema changes applied' as status;

-- ============================================================
-- PART 2: RLS Policies
-- ============================================================

-- USERS
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Org members can view each other" ON users
  FOR SELECT USING (
    org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Org owners can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- ORGANIZATIONS
CREATE POLICY "Owners can manage their org" ON organizations
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Members can view their org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM users WHERE auth_id = auth.uid())
  );

-- PROJECTS
CREATE POLICY "Org owners can manage all projects" ON projects
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage assigned projects" ON projects
  FOR ALL USING (
    engineer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Engineers can view org projects" ON projects
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view assigned projects" ON projects
  FOR SELECT USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Clients can view org projects" ON projects
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- SITE PHOTOS
CREATE POLICY "Org owners can manage all photos" ON site_photos
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org photos" ON site_photos
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org photos" ON site_photos
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- MATERIALS
CREATE POLICY "Org owners can manage all materials" ON materials
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org materials" ON materials
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org materials" ON materials
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- EXPENSES
CREATE POLICY "Org owners can manage all expenses" ON expenses
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org expenses" ON expenses
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org expenses" ON expenses
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- BUDGET ALERTS
CREATE POLICY "Org owners can manage budget alerts" ON budget_alerts
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Org members can view budget alerts" ON budget_alerts
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid())
  );

-- PROGRESS REPORTS
CREATE POLICY "Org owners can manage all reports" ON progress_reports
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org reports" ON progress_reports
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org reports" ON progress_reports
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = notifications.user_id));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = notifications.user_id));

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- BILL SCANS
CREATE POLICY "Org owners can manage bill scans" ON bill_scans
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org bill scans" ON bill_scans
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

-- MATERIAL DETECTIONS
CREATE POLICY "Org owners can manage detections" ON material_detections
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org detections" ON material_detections
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

-- AI INSIGHTS
CREATE POLICY "Org owners can manage insights" ON ai_insights
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Org members can view insights" ON ai_insights
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid())
  );

SELECT 'PART 2 COMPLETE: RLS policies applied' as status;

-- ============================================================
-- PART 3: Seed Demo Data
-- ============================================================

-- STEP 1: Create demo organization
INSERT INTO organizations (id, name, owner_id, plan)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BuildTrack Demo',
  au.id,
  'pro'
FROM auth.users au
WHERE au.email = 'admin@buildtrack.com'
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Update demo users with org_id and roles
UPDATE users SET
  org_id = '00000000-0000-0000-0000-000000000001'::uuid,
  role = 'owner'
WHERE email = 'admin@buildtrack.com';

UPDATE users SET
  org_id = '00000000-0000-0000-0000-000000000001'::uuid,
  role = 'site_engineer'
WHERE email = 'site@buildtrack.com';

UPDATE users SET
  org_id = '00000000-0000-0000-0000-000000000001'::uuid,
  role = 'client'
WHERE email = 'client@buildtrack.com';

-- STEP 3-7: Seed projects, materials, expenses, reports, notifications
DO $$
DECLARE
  v_org_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_owner_id UUID;
  v_engineer_id UUID;
  v_client_id UUID;
  v_project1 UUID;
  v_project2 UUID;
  v_project3 UUID;
BEGIN
  SELECT id INTO v_owner_id FROM users WHERE email = 'admin@buildtrack.com';
  SELECT id INTO v_engineer_id FROM users WHERE email = 'site@buildtrack.com';
  SELECT id INTO v_client_id FROM users WHERE email = 'client@buildtrack.com';

  -- Project 1
  INSERT INTO projects (id, name, client_name, client_id, engineer_id, org_id, created_by, address, budget, status, progress, start_date, expected_completion_date)
  VALUES (
    gen_random_uuid(), 'Sunshine Apartments', 'Mr. Sharma', v_client_id, v_engineer_id, v_org_id, v_owner_id,
    '123 MG Road, Pune', 25000000, 'Structure', 45, '2025-01-15', '2025-12-30'
  ) RETURNING id INTO v_project1;

  -- Project 2
  INSERT INTO projects (id, name, client_name, client_id, engineer_id, org_id, created_by, address, budget, status, progress, start_date, expected_completion_date)
  VALUES (
    gen_random_uuid(), 'Green Valley Villas', 'Mrs. Patel', v_client_id, v_engineer_id, v_org_id, v_owner_id,
    '456 Hinjewadi, Pune', 18000000, 'Brickwork', 65, '2025-02-01', '2025-10-15'
  ) RETURNING id INTO v_project2;

  -- Project 3
  INSERT INTO projects (id, name, client_name, client_id, engineer_id, org_id, created_by, address, budget, status, progress, start_date, expected_completion_date)
  VALUES (
    gen_random_uuid(), 'Metro Heights', 'Mr. Kumar', v_client_id, v_engineer_id, v_org_id, v_owner_id,
    '789 Baner Road, Pune', 35000000, 'Planning', 10, '2025-06-01', '2026-06-30'
  ) RETURNING id INTO v_project3;

  -- Materials
  INSERT INTO materials (project_id, org_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES
  (v_project1, v_org_id, 'OPC 53 Cement', 'Cement', 500, 320, 'bags', 380, 'UltraTech Cement', 50),
  (v_project1, v_org_id, 'TMT Steel Bars 12mm', 'Steel', 200, 140, 'pcs', 950, 'Tata Tiscon', 20),
  (v_project1, v_org_id, 'River Sand', 'Sand', 100, 75, 'tons', 1200, 'Local Supplier', 10),
  (v_project2, v_org_id, 'OPC 53 Cement', 'Cement', 300, 210, 'bags', 380, 'UltraTech Cement', 50),
  (v_project2, v_org_id, 'Red Bricks', 'Bricks', 10000, 7500, 'pcs', 8, 'Brick Kiln Co', 1000),
  (v_project2, v_org_id, 'CPVC Pipes', 'Pipes', 150, 90, 'pcs', 250, 'Astral Pipes', 20),
  (v_project3, v_org_id, 'OPC 53 Cement', 'Cement', 200, 20, 'bags', 380, 'UltraTech Cement', 50),
  (v_project3, v_org_id, 'TMT Steel Bars 12mm', 'Steel', 100, 10, 'pcs', 950, 'Tata Tiscon', 20);

  -- Expenses
  INSERT INTO expenses (project_id, org_id, amount, category, vendor, description, date, created_by) VALUES
  (v_project1, v_org_id, 450000, 'Labor', 'Ramesh Contractors', 'Foundation labor charges - Month 1', '2025-02-01', v_owner_id),
  (v_project1, v_org_id, 190000, 'Cement', 'UltraTech Cement', '200 bags OPC 53', '2025-02-05', v_owner_id),
  (v_project1, v_org_id, 133000, 'Steel', 'Tata Tiscon', '140 TMT bars 12mm', '2025-02-10', v_owner_id),
  (v_project1, v_org_id, 38000, 'Transport', 'ABC Logistics', 'Material delivery charges', '2025-02-12', v_owner_id),
  (v_project1, v_org_id, 75000, 'Plumbing', 'AquaFlow', 'Underground plumbing rough-in', '2025-03-01', v_owner_id),
  (v_project2, v_org_id, 350000, 'Labor', 'Suresh Builders', 'Brickwork labor - Phase 1', '2025-04-01', v_owner_id),
  (v_project2, v_org_id, 114000, 'Cement', 'UltraTech Cement', '300 bags OPC 53', '2025-04-05', v_owner_id),
  (v_project2, v_org_id, 60000, 'Miscellaneous', 'Brick Kiln Co', '7500 red bricks', '2025-04-08', v_owner_id),
  (v_project2, v_org_id, 22500, 'Electrical', 'Havells', 'Wiring and conduits', '2025-05-01', v_owner_id),
  (v_project3, v_org_id, 76000, 'Cement', 'UltraTech Cement', '200 bags OPC 53', '2025-06-10', v_owner_id),
  (v_project3, v_org_id, 95000, 'Steel', 'Tata Tiscon', '100 TMT bars 12mm', '2025-06-12', v_owner_id);

  -- Progress Reports
  INSERT INTO progress_reports (project_id, org_id, report_date, work_completed, material_used, issues, delays, tomorrow_plan, created_by) VALUES
  (v_project1, v_org_id, '2025-03-01', 'Foundation concrete pouring completed for Block A. Column reinforcement started.', 'Cement: 50 bags, Steel: 20 bars', 'Minor waterlogging in excavation area', 'Rain caused 2-day delay', 'Complete column reinforcement for Block A', v_engineer_id),
  (v_project1, v_org_id, '2025-03-15', 'Column casting completed for Block A. Second floor slab shuttering in progress.', 'Cement: 30 bags, Steel: 15 bars', 'None', 'None', 'Complete slab shuttering and start reinforcement', v_engineer_id),
  (v_project2, v_org_id, '2025-05-01', 'Ground floor brickwork completed. First floor slab casting done.', 'Bricks: 3000, Cement: 40 bags', 'None', 'None', 'Start first floor brickwork', v_engineer_id),
  (v_project2, v_org_id, '2025-05-15', 'First floor brickwork 80% complete. Electrical conduit laying started.', 'Bricks: 2000, Cement: 25 bags', 'Material delivery delayed by 1 day', 'Truck breakdown', 'Complete brickwork and start plumbing rough-in', v_engineer_id);

  -- Notifications
  INSERT INTO notifications (user_id, org_id, title, message, type, is_read) VALUES
  (v_owner_id, v_org_id, 'Budget Alert', 'Sunshine Apartments has reached 70% budget utilization', 'budget_warning', false),
  (v_owner_id, v_org_id, 'New Report', 'Priya Sharma submitted a daily progress report for Sunshine Apartments', 'new_report', false),
  (v_owner_id, v_org_id, 'Low Stock', 'TMT Steel Bars stock is running low at Sunshine Apartments', 'low_stock', false),
  (v_engineer_id, v_org_id, 'Project Update', 'Green Valley Villas status updated to Brickwork', 'milestone', false),
  (v_client_id, v_org_id, 'Progress Report', 'New progress report available for Sunshine Apartments', 'new_report', false);

END $$;

SELECT 'PART 3 COMPLETE: Demo data seeded' as status;
SELECT 'ALL DONE! Your BuildTrack app is ready.' as final_status;
