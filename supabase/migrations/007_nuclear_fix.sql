-- Migration: 007_nuclear_fix
-- Single clean migration that fixes everything

-- ============================================
-- 1. CLEANUP: Drop ALL existing policies
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_user_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- 2. HELPER FUNCTIONS (SECURITY DEFINER bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS uuid AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 3. UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. MINIMAL PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON projects, site_photos, materials TO anon;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- USERS
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- PROJECTS
CREATE POLICY "Admins can manage all projects" ON projects
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Engineers can manage projects" ON projects
  FOR ALL USING (get_user_role() = 'site_engineer');
CREATE POLICY "Clients can view own projects" ON projects
  FOR SELECT USING (client_id = get_user_id() OR get_user_role() = 'admin');

-- SITE PHOTOS
CREATE POLICY "Admins can manage all photos" ON site_photos
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Engineers can manage photos" ON site_photos
  FOR ALL USING (get_user_role() = 'site_engineer');
CREATE POLICY "Clients can view project photos" ON site_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = site_photos.project_id AND p.client_id = get_user_id())
    OR get_user_role() = 'admin'
  );

-- MATERIALS
CREATE POLICY "Admins can manage all materials" ON materials
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Engineers can manage materials" ON materials
  FOR ALL USING (get_user_role() = 'site_engineer');
CREATE POLICY "Clients can view project materials" ON materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = materials.project_id AND p.client_id = get_user_id())
    OR get_user_role() = 'admin'
  );

-- EXPENSES
CREATE POLICY "Admins can manage all expenses" ON expenses
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Engineers can manage expenses" ON expenses
  FOR ALL USING (get_user_role() = 'site_engineer');
CREATE POLICY "Clients can view project expenses" ON expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = expenses.project_id AND p.client_id = get_user_id())
    OR get_user_role() = 'admin'
  );

-- BUDGET ALERTS
CREATE POLICY "Admins can manage budget alerts" ON budget_alerts
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Users can view project alerts" ON budget_alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = budget_alerts.project_id AND (p.client_id = get_user_id() OR p.created_by = get_user_id()))
    OR get_user_role() = 'admin'
  );

-- PROGRESS REPORTS
CREATE POLICY "Admins can manage all reports" ON progress_reports
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Engineers can manage reports" ON progress_reports
  FOR ALL USING (get_user_role() = 'site_engineer');
CREATE POLICY "Clients can view project reports" ON progress_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = progress_reports.project_id AND p.client_id = get_user_id())
    OR get_user_role() = 'admin'
  );

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = get_user_id());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = get_user_id());
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- BILL SCANS
CREATE POLICY "Admins can manage bill scans" ON bill_scans
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Engineers can manage bill scans" ON bill_scans
  FOR ALL USING (get_user_role() = 'site_engineer');

-- MATERIAL DETECTIONS
CREATE POLICY "Admins can manage detections" ON material_detections
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Engineers can manage detections" ON material_detections
  FOR ALL USING (get_user_role() = 'site_engineer');

-- AI INSIGHTS
CREATE POLICY "Admins can manage insights" ON ai_insights
  FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Users can view project insights" ON ai_insights
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = ai_insights.project_id AND (p.client_id = get_user_id() OR p.created_by = get_user_id()))
    OR get_user_role() = 'admin'
  );

-- ============================================
-- 6. CLEANUP old demo data
-- ============================================
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM budget_alerts WHERE project_id IN (SELECT id FROM projects WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com')));
DELETE FROM progress_reports WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM site_photos WHERE uploaded_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM expenses WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM materials WHERE project_id IN (SELECT id FROM projects WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com')));
DELETE FROM projects WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com');
DELETE FROM auth.users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com');

-- ============================================
-- 7. CREATE demo users + seed data
-- ============================================
DO $$
DECLARE
  v_admin_auth UUID;
  v_engineer_auth UUID;
  v_client_auth UUID;
  v_admin_id UUID;
  v_engineer_id UUID;
  v_client_id UUID;
  v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID; v_p5 UUID; v_p6 UUID;
  v_p7 UUID; v_p8 UUID;
BEGIN
  -- Auth users
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token, raw_user_meta_data, raw_app_meta_data)
  VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'admin@buildtrack.com', crypt('DEMO1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', jsonb_build_object('full_name', 'Rajesh Kumar', 'role', 'admin', 'phone', '+91 98765 43210'), jsonb_build_object('provider', 'email', 'providers', ARRAY['email']))
  RETURNING id INTO v_admin_auth;

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token, raw_user_meta_data, raw_app_meta_data)
  VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'site@buildtrack.com', crypt('DEMO1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', jsonb_build_object('full_name', 'Priya Sharma', 'role', 'site_engineer', 'phone', '+91 98765 43211'), jsonb_build_object('provider', 'email', 'providers', ARRAY['email']))
  RETURNING id INTO v_engineer_auth;

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change_token_new, recovery_token, raw_user_meta_data, raw_app_meta_data)
  VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', 'client@buildtrack.com', crypt('DEMO1234', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', jsonb_build_object('full_name', 'Amit Patel', 'role', 'client', 'phone', '+91 98765 43212'), jsonb_build_object('provider', 'email', 'providers', ARRAY['email']))
  RETURNING id INTO v_client_auth;

  -- Public profiles
  INSERT INTO users (auth_id, email, full_name, role, phone) VALUES
    (v_admin_auth, 'admin@buildtrack.com', 'Rajesh Kumar', 'admin', '+91 98765 43210'),
    (v_engineer_auth, 'site@buildtrack.com', 'Priya Sharma', 'site_engineer', '+91 98765 43211'),
    (v_client_auth, 'client@buildtrack.com', 'Amit Patel', 'client', '+91 98765 43212');

  SELECT id INTO v_admin_id FROM users WHERE auth_id = v_admin_auth;
  SELECT id INTO v_engineer_id FROM users WHERE auth_id = v_engineer_auth;
  SELECT id INTO v_client_id FROM users WHERE auth_id = v_client_auth;

  -- Projects (admin-created, one at a time for RETURNING)
  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Sunset Villa Complex', 'Amit Patel', v_client_id, '123 Marine Drive, Mumbai', '2024-01-15', '2025-06-30', 25000000.00, 15750000.00, 'Structure', 45, v_admin_id) RETURNING id INTO v_p1;

  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Metro Office Tower', 'Neha Gupta', v_client_id, '456 Business Park, Bangalore', '2024-03-01', '2025-12-31', 75000000.00, 37500000.00, 'Brickwork', 60, v_admin_id) RETURNING id INTO v_p2;

  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Harbor View Residency', 'Amit Patel', v_client_id, '789 Coastal Road, Chennai', '2024-06-01', '2025-09-30', 40000000.00, 12000000.00, 'Foundation', 20, v_admin_id) RETURNING id INTO v_p3;

  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Green Valley Apartments', 'Neha Gupta', v_client_id, '321 Hill Station Road, Pune', '2024-02-15', '2025-08-15', 55000000.00, 41250000.00, 'Finishing', 80, v_admin_id) RETURNING id INTO v_p4;

  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Skyline Commercial Hub', 'Amit Patel', v_client_id, '567 Industrial Area, Hyderabad', '2023-11-01', '2025-05-30', 90000000.00, 81000000.00, 'Finishing', 90, v_admin_id) RETURNING id INTO v_p5;

  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Riverside Homes', 'Neha Gupta', v_client_id, '890 River Bank, Kolkata', '2024-08-01', '2026-02-28', 35000000.00, 3500000.00, 'Planning', 5, v_admin_id) RETURNING id INTO v_p6;

  -- Projects (engineer-created)
  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Sunset Villa Complex', 'Amit Patel', v_client_id, '123 Marine Drive, Mumbai', '2024-01-15', '2025-06-30', 25000000.00, 15750000.00, 'Structure', 45, v_engineer_id) RETURNING id INTO v_p7;

  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by)
  VALUES ('Metro Office Tower', 'Neha Gupta', v_client_id, '456 Business Park, Bangalore', '2024-03-01', '2025-12-31', 75000000.00, 37500000.00, 'Brickwork', 60, v_engineer_id) RETURNING id INTO v_p8;

  -- Materials
  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES
    (v_p1, 'OPC 53 Cement', 'Cement', 500, 320, 'bags', 380.00, 'UltraTech Cement', 100),
    (v_p1, 'TMT Steel Bars 12mm', 'Steel', 200, 150, 'pcs', 850.00, 'Tata Steel', 50),
    (v_p1, 'River Sand', 'Sand', 100, 75, 'tons', 1200.00, 'Gujarat Minerals', 20),
    (v_p1, 'CPVC Pipes 2inch', 'Pipes', 300, 180, 'pcs', 320.00, 'Astral Pipes', 60),
    (v_p2, 'Red Clay Bricks', 'Bricks', 50000, 35000, 'pcs', 8.00, 'Local Brick Kiln', 10000),
    (v_p2, 'Ceramic Floor Tiles', 'Tiles', 2000, 1200, 'sqft', 45.00, 'Kajaria Ceramics', 500),
    (v_p2, 'PVC Pipes 4inch', 'Pipes', 500, 380, 'pcs', 250.00, 'Astral Pipes', 100),
    (v_p3, 'OPC 43 Cement', 'Cement', 300, 80, 'bags', 350.00, 'ACC Cement', 80),
    (v_p4, 'Asian Paints Apex', 'Paint', 200, 160, 'liters', 450.00, 'Asian Paints', 40),
    (v_p4, 'Electrical Wires 2.5sqmm', 'Electrical', 5000, 4200, 'meters', 18.00, 'Havells', 1000),
    (v_p5, 'TMT Steel Bars 16mm', 'Steel', 300, 270, 'pcs', 1200.00, 'SAIL', 50),
    (v_p5, 'Premium Wall Putty', 'Paint', 150, 140, 'bags', 650.00, 'BASF', 30),
    (v_p7, 'OPC 53 Cement', 'Cement', 400, 280, 'bags', 380.00, 'UltraTech Cement', 100),
    (v_p7, 'TMT Steel Bars 12mm', 'Steel', 150, 120, 'pcs', 850.00, 'Tata Steel', 50),
    (v_p8, 'Red Clay Bricks', 'Bricks', 30000, 20000, 'pcs', 8.00, 'Local Brick Kiln', 10000),
    (v_p8, 'Ceramic Floor Tiles', 'Tiles', 1500, 800, 'sqft', 45.00, 'Kajaria Ceramics', 500);

  -- Expenses
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES
    (v_p1, 250000.00, 'Labor', 'ABC Contractors', 'Foundation labor charges', '2024-01-20', v_admin_id),
    (v_p1, 190000.00, 'Cement', 'UltraTech Cement', '500 bags OPC 53 cement', '2024-01-22', v_admin_id),
    (v_p1, 170000.00, 'Steel', 'Tata Steel', '200 TMT bars 12mm', '2024-01-25', v_engineer_id),
    (v_p1, 85000.00, 'Plumbing', 'Astral Pipes', 'CPVC pipes and fittings', '2024-02-15', v_engineer_id),
    (v_p2, 500000.00, 'Labor', 'XYZ Constructions', 'Structure labor - Month 1', '2024-04-01', v_admin_id),
    (v_p2, 400000.00, 'Steel', 'SAIL', '300 TMT bars 16mm', '2024-04-05', v_engineer_id),
    (v_p2, 60000.00, 'Transport', 'Quick Logistics', 'Material transport charges', '2024-04-10', v_admin_id),
    (v_p2, 120000.00, 'Miscellaneous', 'Safety First Corp', 'Safety equipment', '2024-04-20', v_admin_id),
    (v_p3, 150000.00, 'Labor', 'Foundation Experts', 'Foundation excavation', '2024-06-15', v_admin_id),
    (v_p4, 350000.00, 'Miscellaneous', 'Asian Paints', 'Premium exterior paint', '2025-01-15', v_admin_id),
    (v_p4, 180000.00, 'Electrical', 'Havells India', 'Wiring and switches', '2025-01-20', v_engineer_id),
    (v_p4, 95000.00, 'Transport', 'Quick Logistics', 'Final material delivery', '2025-02-01', v_admin_id),
    (v_p5, 800000.00, 'Labor', 'Premium Builders', 'Finishing labor', '2025-03-01', v_admin_id),
    (v_p5, 250000.00, 'Machinery', 'Heavy Equipment Co.', 'Crane rental', '2025-03-10', v_admin_id),
    (v_p5, 450000.00, 'Steel', 'Tata Steel', 'Premium TMT bars', '2025-02-15', v_engineer_id),
    (v_p7, 195000.00, 'Cement', 'UltraTech Cement', '400 bags cement', '2024-02-01', v_engineer_id),
    (v_p7, 127500.00, 'Steel', 'Tata Steel', '150 TMT bars', '2024-02-05', v_engineer_id),
    (v_p8, 160000.00, 'Labor', 'XYZ Constructions', 'Brickwork labor', '2024-05-01', v_engineer_id),
    (v_p8, 54000.00, 'Transport', 'Quick Logistics', 'Brick delivery', '2024-05-10', v_engineer_id);

  -- Site Photos
  INSERT INTO site_photos (project_id, url, thumbnail_url, notes, category, gps_lat, gps_lng, uploaded_by) VALUES
    (v_p1, '/photos/foundation-1.jpg', '/photos/thumbs/foundation-1.jpg', 'Foundation excavation completed', 'Foundation', 19.0760, 72.8777, v_engineer_id),
    (v_p1, '/photos/columns-1.jpg', '/photos/thumbs/columns-1.jpg', 'First floor columns', 'Columns', 19.0760, 72.8777, v_engineer_id),
    (v_p2, '/photos/brickwork-1.jpg', '/photos/thumbs/brickwork-1.jpg', 'External wall brickwork', 'Brickwork', 12.9716, 77.5946, v_engineer_id),
    (v_p2, '/photos/plumbing-1.jpg', '/photos/thumbs/plumbing-1.jpg', 'Ground floor plumbing', 'Plumbing', 12.9716, 77.5946, v_engineer_id),
    (v_p4, '/photos/electrical-1.jpg', '/photos/thumbs/electrical-1.jpg', 'Electrical wiring first floor', 'Electrical', 18.5204, 73.8567, v_engineer_id),
    (v_p4, '/photos/finishing-1.jpg', '/photos/thumbs/finishing-1.jpg', 'Interior painting started', 'Finishing', 18.5204, 73.8567, v_engineer_id),
    (v_p5, '/photos/roofing-1.jpg', '/photos/thumbs/roofing-1.jpg', 'Roof slab casting', 'Roofing', 17.3850, 78.4867, v_engineer_id),
    (v_p3, '/photos/foundation-2.jpg', '/photos/thumbs/foundation-2.jpg', 'Foundation reinforcement', 'Foundation', 13.0827, 80.2707, v_engineer_id),
    (v_p7, '/photos/se-foundation-1.jpg', '/photos/thumbs/se-foundation-1.jpg', 'Foundation progress', 'Foundation', 19.0760, 72.8777, v_engineer_id),
    (v_p8, '/photos/se-brickwork-1.jpg', '/photos/thumbs/se-brickwork-1.jpg', 'Brickwork progress', 'Brickwork', 12.9716, 77.5946, v_engineer_id);

  -- Progress Reports
  INSERT INTO progress_reports (project_id, report_date, work_completed, material_used, issues, delays, tomorrow_plan, created_by) VALUES
    (v_p1, '2024-02-01', 'First floor slab casting completed.', '50 bags cement, 20 TMT bars', 'Minor vibration issues', 'None', 'Complete second floor columns', v_engineer_id),
    (v_p2, '2024-05-15', 'Third floor brickwork 80% completed.', '5000 bricks, 100 bags cement', 'Supply delay', '2 days delay', 'Complete brickwork', v_engineer_id),
    (v_p3, '2024-07-01', 'Foundation excavation completed.', '30 bags cement, 15 TMT bars', 'Rock formation', '1 day delay', 'Start concrete pouring', v_engineer_id),
    (v_p4, '2025-01-20', 'Interior painting completed floors 1-3.', '80 liters paint, 200m wire', 'Quality issue', 'None', 'Complete electrical', v_engineer_id),
    (v_p5, '2025-03-10', 'Facade installation completed.', '500 sqft tiles, 50 bags putty', 'None', 'None', 'Complete floor tiling', v_engineer_id),
    (v_p7, '2024-02-05', 'Foundation reinforcement completed.', '20 bags cement, 10 TMT bars', 'None', 'None', 'Start concrete pouring', v_engineer_id),
    (v_p8, '2024-05-20', 'Brickwork on second floor 60%.', '3000 bricks, 60 bags cement', 'None', 'None', 'Continue brickwork', v_engineer_id);

  -- Notifications
  INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
    (v_admin_id, 'Low Stock Alert', 'OPC 53 Cement stock is running low', 'low_stock', false),
    (v_admin_id, 'Budget Warning', 'Metro Office Tower at 50% budget', 'budget_warning', false),
    (v_admin_id, 'New Report', 'Progress report submitted for Sunset Villa', 'new_report', true),
    (v_admin_id, 'Milestone Completed', 'Green Valley - Foundation completed', 'milestone', true),
    (v_engineer_id, 'Report Approved', 'Your report has been approved', 'new_report', false),
    (v_engineer_id, 'New Assignment', 'You have been assigned to a new project', 'new_report', false),
    (v_client_id, 'Project Update', 'Sunset Villa progress updated to 45%', 'milestone', false),
    (v_client_id, 'Report Available', 'New report available for Harbor View', 'new_report', false);

  -- Budget Alerts
  INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message, is_read) VALUES
    (v_p1, 'budget_70', 63, 'Budget usage at 63% - Sunset Villa', false),
    (v_p2, 'budget_70', 50, 'Budget usage at 50% - Metro Office', false),
    (v_p5, 'budget_90', 90, 'Budget usage at 90% - Skyline Hub', false),
    (v_p4, 'budget_70', 75, 'Budget usage at 75% - Green Valley', false);

END $$;

NOTIFY pgrst, 'reload schema';
