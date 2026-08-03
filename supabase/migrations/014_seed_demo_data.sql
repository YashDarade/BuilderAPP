-- BuildTrack AI: Seed Demo Data (Organization-Scoped)
-- Migration: 014_seed_demo_data
-- Run this AFTER 013 via Dashboard SQL Editor

-- ============================================================
-- STEP 1: Create demo organization
-- ============================================================
INSERT INTO organizations (id, name, owner_id, plan)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'BuildTrack Demo',
  au.id,
  'pro'
FROM auth.users au
WHERE au.email = 'admin@buildtrack.com'
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 2: Update demo users with org_id and new roles
-- ============================================================
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

-- ============================================================
-- STEP 3: Create demo projects (org-scoped)
-- ============================================================
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

  -- ============================================================
  -- STEP 4: Seed materials for each project
  -- ============================================================
  INSERT INTO materials (project_id, org_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES
  (v_project1, v_org_id, 'OPC 53 Cement', 'Cement', 500, 320, 'bags', 380, 'UltraTech Cement', 50),
  (v_project1, v_org_id, 'TMT Steel Bars 12mm', 'Steel', 200, 140, 'pcs', 950, 'Tata Tiscon', 20),
  (v_project1, v_org_id, 'River Sand', 'Sand', 100, 75, 'tons', 1200, 'Local Supplier', 10),
  (v_project2, v_org_id, 'OPC 53 Cement', 'Cement', 300, 210, 'bags', 380, 'UltraTech Cement', 50),
  (v_project2, v_org_id, 'Red Bricks', 'Bricks', 10000, 7500, 'pcs', 8, 'Brick Kiln Co', 1000),
  (v_project2, v_org_id, 'CPVC Pipes', 'Pipes', 150, 90, 'pcs', 250, 'Astral Pipes', 20),
  (v_project3, v_org_id, 'OPC 53 Cement', 'Cement', 200, 20, 'bags', 380, 'UltraTech Cement', 50),
  (v_project3, v_org_id, 'TMT Steel Bars 12mm', 'Steel', 100, 10, 'pcs', 950, 'Tata Tiscon', 20);

  -- ============================================================
  -- STEP 5: Seed expenses for each project
  -- ============================================================
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

  -- ============================================================
  -- STEP 6: Seed progress reports
  -- ============================================================
  INSERT INTO progress_reports (project_id, org_id, report_date, work_completed, material_used, issues, delays, tomorrow_plan, created_by) VALUES
  (v_project1, v_org_id, '2025-03-01', 'Foundation concrete pouring completed for Block A. Column reinforcement started.', 'Cement: 50 bags, Steel: 20 bars', 'Minor waterlogging in excavation area', 'Rain caused 2-day delay', 'Complete column reinforcement for Block A', v_engineer_id),
  (v_project1, v_org_id, '2025-03-15', 'Column casting completed for Block A. Second floor slab shuttering in progress.', 'Cement: 30 bags, Steel: 15 bars', 'None', 'None', 'Complete slab shuttering and start reinforcement', v_engineer_id),
  (v_project2, v_org_id, '2025-05-01', 'Ground floor brickwork completed. First floor slab casting done.', 'Bricks: 3000, Cement: 40 bags', 'None', 'None', 'Start first floor brickwork', v_engineer_id),
  (v_project2, v_org_id, '2025-05-15', 'First floor brickwork 80% complete. Electrical conduit laying started.', 'Bricks: 2000, Cement: 25 bags', 'Material delivery delayed by 1 day', 'Truck breakdown', 'Complete brickwork and start plumbing rough-in', v_engineer_id);

  -- ============================================================
  -- STEP 7: Seed notifications
  -- ============================================================
  INSERT INTO notifications (user_id, org_id, title, message, type, is_read) VALUES
  (v_owner_id, v_org_id, 'Budget Alert', 'Sunshine Apartments has reached 70% budget utilization', 'budget_warning', false),
  (v_owner_id, v_org_id, 'New Report', 'Priya Sharma submitted a daily progress report for Sunshine Apartments', 'new_report', false),
  (v_owner_id, v_org_id, 'Low Stock', 'TMT Steel Bars stock is running low at Sunshine Apartments', 'low_stock', false),
  (v_engineer_id, v_org_id, 'Project Update', 'Green Valley Villas status updated to Brickwork', 'milestone', false),
  (v_client_id, v_org_id, 'Progress Report', 'New progress report available for Sunshine Apartments', 'new_report', false);

END $$;
