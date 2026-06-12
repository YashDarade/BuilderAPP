-- BuildTrack AI Seed Data
-- Migration: 002_seed_data

-- Insert demo users
INSERT INTO users (id, email, full_name, role, avatar_url, phone) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@buildtrack.com', 'Rajesh Kumar', 'admin', NULL, '+91 98765 43210'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'engineer@buildtrack.com', 'Priya Sharma', 'site_engineer', NULL, '+91 98765 43211'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'client@buildtrack.com', 'Amit Patel', 'client', NULL, '+91 98765 43212'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'engineer2@buildtrack.com', 'Vikram Singh', 'site_engineer', NULL, '+91 98765 43213'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'client2@buildtrack.com', 'Neha Gupta', 'client', NULL, '+91 98765 43214');

-- Insert demo projects
INSERT INTO projects (id, name, client_name, client_id, address, start_date, expected_completion_date, budget, spent, status, progress, created_by) VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Sunset Villa Complex', 'Amit Patel', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '123 Marine Drive, Mumbai', '2024-01-15', '2025-06-30', 25000000.00, 15750000.00, 'Structure', 45, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Metro Office Tower', 'Neha Gupta', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '456 Business Park, Bangalore', '2024-03-01', '2025-12-31', 75000000.00, 37500000.00, 'Brickwork', 60, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Harbor View Residency', 'Amit Patel', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '789 Coastal Road, Chennai', '2024-06-01', '2025-09-30', 40000000.00, 12000000.00, 'Foundation', 20, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Green Valley Apartments', 'Neha Gupta', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '321 Hill Station Road, Pune', '2024-02-15', '2025-08-15', 55000000.00, 41250000.00, 'Finishing', 80, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Skyline Commercial Hub', 'Amit Patel', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '567 Industrial Area, Hyderabad', '2023-11-01', '2025-05-30', 90000000.00, 81000000.00, 'Finishing', 90, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Riverside Homes', 'Neha Gupta', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '890 River Bank, Kolkata', '2024-08-01', '2026-02-28', 35000000.00, 3500000.00, 'Planning', 5, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- Insert materials
INSERT INTO materials (id, project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level) VALUES
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'OPC 53 Cement', 'Cement', 500, 320, 'bags', 380.00, 'UltraTech Cement', 100),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'TMT Steel Bars 12mm', 'Steel', 200, 150, 'pcs', 850.00, 'Tata Steel', 50),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'River Sand', 'Sand', 100, 75, 'tons', 1200.00, 'Gujarat Minerals', 20),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Red Clay Bricks', 'Bricks', 50000, 35000, 'pcs', 8.00, 'Local Brick Kiln', 10000),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Ceramic Floor Tiles', 'Tiles', 2000, 1200, 'sqft', 45.00, 'Kajaria Ceramics', 500),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'PVC Pipes 4inch', 'Pipes', 500, 380, 'pcs', 250.00, 'Astral Pipes', 100),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'OPC 43 Cement', 'Cement', 300, 80, 'bags', 350.00, 'ACC Cement', 80),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Asian Paints Apex', 'Paint', 200, 160, 'liters', 450.00, 'Asian Paints', 40),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Electrical Wires 2.5sqmm', 'Electrical', 5000, 4200, 'meters', 18.00, 'Havells', 1000),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'TMT Steel Bars 16mm', 'Steel', 300, 270, 'pcs', 1200.00, 'SAIL', 50),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Premium Wall Putty', 'Paint', 150, 140, 'bags', 650.00, 'BASF', 30),
  ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'CPVC Pipes 2inch', 'Pipes', 300, 180, 'pcs', 320.00, 'Astral Pipes', 60);

-- Insert expenses
INSERT INTO expenses (id, project_id, amount, category, vendor, description, date, created_by) VALUES
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 250000.00, 'Labor', 'ABC Contractors', 'Foundation labor charges - Week 1', '2024-01-20', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 190000.00, 'Cement', 'UltraTech Cement', '500 bags OPC 53 cement', '2024-01-22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 170000.00, 'Steel', 'Tata Steel', '200 TMT bars 12mm', '2024-01-25', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 500000.00, 'Labor', 'XYZ Constructions', 'Structure labor - Month 1', '2024-04-01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 400000.00, 'Steel', 'SAIL', '300 TMT bars 16mm', '2024-04-05', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 60000.00, 'Transport', 'Quick Logistics', 'Material transport charges', '2024-04-10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 150000.00, 'Labor', 'Foundation Experts', 'Foundation excavation work', '2024-06-15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 350000.00, 'Paint', 'Asian Paints', 'Premium exterior paint', '2025-01-15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 180000.00, 'Electrical', 'Havells India', 'Wiring and switches', '2025-01-20', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 800000.00, 'Labor', 'Premium Builders', 'Finishing labor charges', '2025-03-01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 250000.00, 'Machinery', 'Heavy Equipment Co.', 'Crane rental - 3 months', '2025-03-10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 85000.00, 'Plumbing', 'Astral Pipes', 'CPVC pipes and fittings', '2024-02-15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 120000.00, 'Miscellaneous', 'Safety First Corp', 'Safety equipment and gear', '2024-04-20', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 95000.00, 'Transport', 'Quick Logistics', 'Final material delivery', '2025-02-01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 450000.00, 'Steel', 'Tata Steel', 'Premium TMT bars', '2025-02-15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

-- Insert site photos
INSERT INTO site_photos (id, project_id, url, thumbnail_url, notes, category, gps_lat, gps_lng, uploaded_by) VALUES
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '/photos/foundation-1.jpg', '/photos/thumbs/foundation-1.jpg', 'Foundation excavation completed', 'Foundation', 19.0760, 72.8777, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '/photos/columns-1.jpg', '/photos/thumbs/columns-1.jpg', 'First floor columns pouring', 'Columns', 19.0760, 72.8777, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '/photos/brickwork-1.jpg', '/photos/thumbs/brickwork-1.jpg', 'External wall brickwork in progress', 'Brickwork', 12.9716, 77.5946, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '/photos/plumbing-1.jpg', '/photos/thumbs/plumbing-1.jpg', 'Ground floor plumbing rough-in', 'Plumbing', 12.9716, 77.5946, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', '/photos/electrical-1.jpg', '/photos/thumbs/electrical-1.jpg', 'Electrical wiring first floor', 'Electrical', 18.5204, 73.8567, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', '/photos/finishing-1.jpg', '/photos/thumbs/finishing-1.jpg', 'Interior painting started', 'Finishing', 18.5204, 73.8567, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', '/photos/roofing-1.jpg', '/photos/thumbs/roofing-1.jpg', 'Roof slab casting', 'Roofing', 17.3850, 78.4867, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', '/photos/foundation-2.jpg', '/photos/thumbs/foundation-2.jpg', 'Foundation reinforcement work', 'Foundation', 13.0827, 80.2707, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '/photos/tiles-1.jpg', '/photos/thumbs/tiles-1.jpg', 'Kitchen floor tiling in progress', 'Finishing', 19.0760, 72.8777, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),
  ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', '/photos/finishing-2.jpg', '/photos/thumbs/finishing-2.jpg', 'External facade finishing', 'Finishing', 17.3850, 78.4867, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

-- Insert progress reports
INSERT INTO progress_reports (id, project_id, report_date, work_completed, material_used, issues, delays, tomorrow_plan, created_by) VALUES
  ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '2024-02-01', 'First floor slab casting completed. Column reinforcement for second floor started.', '50 bags cement, 20 TMT bars, 5 tons sand', 'Minor vibration issues during slab casting', 'None', 'Complete second floor column reinforcement', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '2024-05-15', 'Third floor brickwork 80% completed. External wall plastering started on first two floors.', '5000 bricks, 100 bags cement, 200 sqft tiles', 'Supply delay from brick kiln', '2 days delay due to material shortage', 'Complete third floor brickwork', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', '2024-07-01', 'Foundation excavation completed for Block A. Reinforcement work started.', '30 bags cement, 15 TMT bars', 'Unexpected rock formation encountered', '1 day delay for rock breaking', 'Start foundation concrete pouring', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'),
  ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', '2025-01-20', 'Interior painting completed for floors 1-3. Electrical switchboard installation started.', '80 liters paint, 200 meters wire', 'Quality issue with paint batch', 'None', 'Complete electrical installation', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),
  ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', '2025-03-10', 'Facade installation completed. Interior finishing work on final floors in progress.', '500 sqft tiles, 50 bags wall putty', 'None', 'None', 'Complete remaining floor tiling', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

-- Insert notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, related_id) VALUES
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Low Stock Alert', 'OPC 53 Cement stock is running low at Sunset Villa Complex', 'low_stock', false, 'm0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Budget Warning', 'Metro Office Tower has used 50% of its budget', 'budget_warning', false, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'New Report', 'Daily progress report submitted for Sunset Villa Complex', 'new_report', true, 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Milestone Completed', 'Green Valley Apartments - Foundation phase completed', 'milestone', true, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Low Stock Alert', 'TMT Steel Bars stock is running low at Metro Office Tower', 'low_stock', false, 'm0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Report Approved', 'Your daily report for Sunset Villa Complex has been approved', 'new_report', false, 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Budget Warning', 'Skyline Commercial Hub has used 90% of its budget', 'budget_warning', false, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'New Project', 'Riverside Homes has been added to your projects', 'milestone', true, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'New Assignment', 'You have been assigned to Harbor View Residency', 'new_report', false, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Low Stock Alert', 'Asian Paints stock is running low at Green Valley Apartments', 'low_stock', false, 'm0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Report Submitted', 'Weekly report submitted for Metro Office Tower', 'new_report', true, 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02'),
  ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Milestone Completed', 'Skyline Commercial Hub - Structure phase completed', 'milestone', false, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05');

-- Insert budget alerts
INSERT INTO budget_alerts (id, project_id, alert_type, threshold_percentage, message, is_read) VALUES
  ('ba0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'budget_70', 63, 'Budget usage at 63% - Sunset Villa Complex', false),
  ('ba0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'budget_70', 50, 'Budget usage at 50% - Metro Office Tower', false),
  ('ba0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'budget_90', 90, 'Budget usage at 90% - Skyline Commercial Hub', false),
  ('ba0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'budget_70', 75, 'Budget usage at 75% - Green Valley Apartments', false),
  ('ba0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'budget_70', 30, 'Budget usage at 30% - Harbor View Residency', true);

-- Insert AI insights
INSERT INTO ai_insights (id, project_id, insight_type, title, description, severity, recommendations) VALUES
  ('ai0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'budget_risk', 'High Budget Consumption Detected', 'Skyline Commercial Hub has consumed 90% of its budget with finishing work still pending. Current trajectory suggests a 15% budget overrun.', 'high', ARRAY['Review remaining work scope', 'Negotiate bulk material discounts', 'Consider value engineering options']),
  ('ai0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'material_shortage', 'Cement Stock Running Low', 'OPC 53 Cement at Sunset Villa Complex has only 180 bags remaining against a reorder level of 100. Current usage rate suggests stock will last 2 more weeks.', 'medium', ARRAY['Place immediate reorder for 300 bags', 'Check alternative suppliers for faster delivery', 'Review consumption rate for potential wastage']),
  ('ai0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'delay_risk', 'Foundation Phase Behind Schedule', 'Harbor View Residency foundation work is 5 days behind schedule due to unexpected rock formation. Recommend additional workforce.', 'high', ARRAY['Deploy 5 additional workers for rock breaking', 'Extend work hours to 10 hours/day', 'Consider mechanical rock breaking equipment']),
  ('ai0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'cost_optimization', 'Material Cost Optimization Opportunity', 'Metro Office Tower has potential to save 8% on tile costs by switching to bulk procurement from Kajaria directly instead of distributor.', 'low', ARRAY['Contact Kajaria direct sales team', 'Compare with current distributor pricing', 'Evaluate quality specifications compatibility']),
  ('ai0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'budget_risk', 'Green Valley Apartments - On Track', 'Project is progressing well with 75% budget utilization and 80% completion. Expected to finish within budget.', 'low', ARRAY['Maintain current pace', 'Continue quality checks', 'Schedule final inspection in 3 weeks']),
  ('ai0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'delay_risk', 'Minor Delays - Recoverable', 'Sunset Villa Complex has minor delays of 2-3 days but these are within acceptable tolerance. No action required at this time.', 'low', ARRAY['Monitor progress daily', 'Ensure material availability', 'Maintain current workforce allocation']);

-- Insert bill scans
INSERT INTO bill_scans (id, expense_id, image_url, vendor_name, amount, date, gst_number, confidence_score, status) VALUES
  ('bs0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '/bills/cement-bill-1.jpg', 'UltraTech Cement', 190000.00, '2024-01-22', '27AABCU9603R1ZM', 95.50, 'completed'),
  ('bs0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', '/bills/steel-bill-1.jpg', 'SAIL', 400000.00, '2024-04-05', '07AAACS1234M1Z5', 88.20, 'completed'),
  ('bs0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', NULL, '/bills/transport-bill-1.jpg', 'Quick Logistics', 60000.00, '2024-04-10', NULL, 72.10, 'completed'),
  ('bs0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', NULL, '/bills/paint-bill-1.jpg', NULL, NULL, NULL, NULL, 45.00, 'failed'),
  ('bs0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', '/bills/paint-bill-2.jpg', 'Asian Paints', 350000.00, '2025-01-15', '27AAAAA1234A1Z4', 92.80, 'completed');
