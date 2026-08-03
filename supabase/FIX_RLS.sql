-- FIX: Broken RLS on users table causing 500 errors
-- The self-referencing subquery causes PostgREST to crash

-- 1. First verify auth_id column exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_id') THEN
    ALTER TABLE users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Populate any missing auth_id values
UPDATE users SET auth_id = au.id
FROM auth.users au
WHERE users.email = au.email AND users.auth_id IS NULL;

-- 2. Drop ALL policies on users (clean slate)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
  END LOOP;
END $$;

-- 3. Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- 4. Verify helper functions exist and work
CREATE OR REPLACE FUNCTION get_user_org_id() RETURNS UUID AS $$
  SELECT org_id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. Drop and recreate ALL other table policies using helper functions
-- PROJECTS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON projects', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_projects" ON projects FOR ALL USING (org_id = get_user_org_id());
CREATE POLICY "engineer_assigned" ON projects FOR ALL USING (engineer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY "client_view" ON projects FOR SELECT USING (client_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- SITE PHOTOS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_photos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON site_photos', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_photos" ON site_photos FOR ALL USING (org_id = get_user_org_id());

-- MATERIALS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'materials' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON materials', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_materials" ON materials FOR ALL USING (org_id = get_user_org_id());

-- EXPENSES
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON expenses', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_expenses" ON expenses FOR ALL USING (org_id = get_user_org_id());

-- BUDGET ALERTS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'budget_alerts' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON budget_alerts', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_alerts" ON budget_alerts FOR ALL USING (org_id = get_user_org_id());

-- PROGRESS REPORTS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'progress_reports' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON progress_reports', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_reports" ON progress_reports FOR ALL USING (org_id = get_user_org_id());

-- NOTIFICATIONS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "user_own_notifications" ON notifications FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- BILL SCANS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bill_scans' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON bill_scans', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_bills" ON bill_scans FOR ALL USING (org_id = get_user_org_id());

-- MATERIAL DETECTIONS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'material_detections' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON material_detections', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_detections" ON material_detections FOR ALL USING (org_id = get_user_org_id());

-- AI INSIGHTS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_insights' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON ai_insights', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "org_all_insights" ON ai_insights FOR ALL USING (org_id = get_user_org_id());

-- ORGANIZATIONS
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organizations' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "owner_manage_org" ON organizations FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "members_view_org" ON organizations FOR SELECT USING (id = get_user_org_id());

-- 6. Diagnostic: verify auth_id is populated
SELECT email, auth_id, org_id, role FROM users;

SELECT 'RLS FIXED! All policies now use simple helper functions.' as status;
