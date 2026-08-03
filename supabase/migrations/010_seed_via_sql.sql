-- CLEAN SEED: Run this in Supabase Dashboard > SQL Editor
-- Auth users already exist from GoTrue signup

DELETE FROM notifications;
DELETE FROM budget_alerts;
DELETE FROM progress_reports;
DELETE FROM site_photos;
DELETE FROM expenses;
DELETE FROM materials;
DELETE FROM projects;
DELETE FROM users;

DO $$
DECLARE
  v_admin_auth UUID;
  v_engineer_auth UUID;
  v_client_auth UUID;
  v_admin_id UUID;
  v_engineer_id UUID;
  v_client_id UUID;
  v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID; v_p5 UUID;
BEGIN
  SELECT id INTO v_admin_auth FROM auth.users WHERE email = 'admin@buildtrack.com';
  SELECT id INTO v_engineer_auth FROM auth.users WHERE email = 'site@buildtrack.com';
  SELECT id INTO v_client_auth FROM auth.users WHERE email = 'client@buildtrack.com';

  IF v_admin_auth IS NULL THEN
    RAISE EXCEPTION 'admin@buildtrack.com not found in auth.users';
  END IF;

  INSERT INTO users (auth_id, email, full_name, role, phone) VALUES (v_admin_auth, 'admin@buildtrack.com', 'Rajesh Kumar', 'admin', '+91 98765 43210');
  INSERT INTO users (auth_id, email, full_name, role, phone) VALUES (v_engineer_auth, 'site@buildtrack.com', 'Priya Sharma', 'site_engineer', '+91 98765 43211');
  INSERT INTO users (auth_id, email, full_name, role, phone) VALUES (v_client_auth, 'client@buildtrack.com', 'Amit Patel', 'client', '+91 98765 43212');

  SELECT id INTO v_admin_id FROM users WHERE auth_id = v_admin_auth;
  SELECT id INTO v_engineer_id FROM users WHERE auth_id = v_engineer_auth;
  SELECT id INTO v_client_id FROM users WHERE auth_id = v_client_auth;

  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by) VALUES ('Sunset Villa Complex', 'Amit Patel', v_client_id, '123 Marine Drive, Mumbai', '2024-01-15', '2025-06-30', 25000000.00, 15750000.00, 'Structure', 45, v_admin_id) RETURNING id INTO v_p1;
  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by) VALUES ('Metro Office Tower', 'Neha Gupta', v_client_id, '456 Business Park, Bangalore', '2024-03-01', '2025-12-31', 75000000.00, 37500000.00, 'Brickwork', 60, v_admin_id) RETURNING id INTO v_p2;
  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by) VALUES ('Harbor View Residency', 'Amit Patel', v_client_id, '789 Coastal Road, Chennai', '2024-06-01', '2025-09-30', 40000000.00, 12000000.00, 'Foundation', 20, v_admin_id) RETURNING id INTO v_p3;
  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by) VALUES ('Green Valley Apartments', 'Neha Gupta', v_client_id, '321 Hill Station Road, Pune', '2024-02-15', '2025-08-15', 55000000.00, 41250000.00, 'Finishing', 80, v_admin_id) RETURNING id INTO v_p4;
  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by) VALUES ('Skyline Commercial Hub', 'Amit Patel', v_client_id, '567 Industrial Area, Hyderabad', '2023-11-01', '2025-05-30', 90000000.00, 81000000.00, 'Finishing', 90, v_admin_id) RETURNING id INTO v_p5;
  INSERT INTO projects (name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by) VALUES ('Riverside Homes', 'Neha Gupta', v_client_id, '890 River Bank, Kolkata', '2024-08-01', '2026-02-28', 35000000.00, 3500000.00, 'Planning', 5, v_admin_id);

  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES (v_p1, 'OPC 53 Cement', 'Cement', 500, 320, 'bags', 380.00, 'UltraTech Cement', 100);
  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES (v_p1, 'TMT Steel Bars 12mm', 'Steel', 200, 150, 'pcs', 850.00, 'Tata Steel', 50);
  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES (v_p1, 'River Sand', 'Sand', 100, 75, 'tons', 1200.00, 'Gujarat Minerals', 20);
  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES (v_p2, 'Red Clay Bricks', 'Bricks', 50000, 35000, 'pcs', 8.00, 'Local Brick Kiln', 10000);
  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES (v_p2, 'Ceramic Floor Tiles', 'Tiles', 2000, 1200, 'sqft', 45.00, 'Kajaria Ceramics', 500);
  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES (v_p4, 'Asian Paints Apex', 'Paint', 200, 160, 'liters', 450.00, 'Asian Paints', 40);
  INSERT INTO materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES (v_p5, 'TMT Steel Bars 16mm', 'Steel', 300, 270, 'pcs', 1200.00, 'SAIL', 50);

  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p1, 250000.00, 'Labor', 'ABC Contractors', 'Foundation labor charges', '2024-01-20', v_admin_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p1, 190000.00, 'Cement', 'UltraTech Cement', '500 bags OPC 53 cement', '2024-01-22', v_admin_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p1, 170000.00, 'Steel', 'Tata Steel', '200 TMT bars 12mm', '2024-01-25', v_engineer_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p2, 500000.00, 'Labor', 'XYZ Constructions', 'Structure labor - Month 1', '2024-04-01', v_admin_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p2, 400000.00, 'Steel', 'SAIL', '300 TMT bars', '2024-04-05', v_engineer_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p2, 60000.00, 'Transport', 'Quick Logistics', 'Material transport charges', '2024-04-10', v_admin_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p4, 350000.00, 'Miscellaneous', 'Asian Paints', 'Premium exterior paint', '2025-01-15', v_admin_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p4, 180000.00, 'Electrical', 'Havells India', 'Wiring and switches', '2025-01-20', v_engineer_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p5, 800000.00, 'Labor', 'Premium Builders', 'Finishing labor charges', '2025-03-01', v_admin_id);
  INSERT INTO expenses (project_id, amount, category, vendor, description, date, created_by) VALUES (v_p5, 250000.00, 'Machinery', 'Heavy Equipment Co.', 'Crane rental 1 month', '2025-03-10', v_admin_id);

  INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (v_admin_id, 'Low Stock Alert', 'OPC 53 Cement stock is running low at Site A', 'low_stock', false);
  INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (v_admin_id, 'Budget Warning', 'Metro Office Tower has used 50% of budget', 'budget_warning', false);
  INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (v_admin_id, 'New Report', 'Progress report submitted for Sunset Villa Complex', 'new_report', true);
  INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (v_admin_id, 'Milestone Completed', 'Green Valley Apartments - Foundation completed', 'milestone', true);
  INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (v_engineer_id, 'Report Approved', 'Your progress report for Sunset Villa has been approved', 'new_report', false);
  INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (v_client_id, 'Project Update', 'Sunset Villa Complex progress updated to 45%', 'milestone', false);

  INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message, is_read) VALUES (v_p1, 'budget_70', 63, 'Budget usage at 63% - Sunset Villa Complex', false);
  INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message, is_read) VALUES (v_p2, 'budget_70', 50, 'Budget usage at 50% - Metro Office Tower', false);
  INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message, is_read) VALUES (v_p5, 'budget_90', 90, 'Budget usage at 90% - Skyline Commercial Hub', false);
  INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message, is_read) VALUES (v_p4, 'budget_70', 75, 'Budget usage at 75% - Green Valley Apartments', false);

  RAISE NOTICE 'Seed complete!';
END $$;
