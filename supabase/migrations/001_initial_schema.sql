-- BuildTrack AI Database Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'site_engineer', 'client');
CREATE TYPE project_status AS ENUM ('Planning', 'Foundation', 'Structure', 'Brickwork', 'Finishing', 'Completed');
CREATE TYPE photo_category AS ENUM ('Foundation', 'Columns', 'Brickwork', 'Plumbing', 'Electrical', 'Roofing', 'Finishing');
CREATE TYPE expense_category AS ENUM ('Labor', 'Cement', 'Steel', 'Plumbing', 'Electrical', 'Transport', 'Machinery', 'Miscellaneous');
CREATE TYPE material_category AS ENUM ('Cement', 'Steel', 'Sand', 'Bricks', 'Tiles', 'Pipes', 'Paint', 'Electrical');
CREATE TYPE alert_type AS ENUM ('budget_70', 'budget_90', 'budget_exceeded', 'low_stock');
CREATE TYPE notification_type AS ENUM ('low_stock', 'budget_warning', 'new_report', 'milestone');
CREATE TYPE insight_type AS ENUM ('budget_risk', 'material_shortage', 'delay_risk', 'cost_optimization');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE bill_scan_status AS ENUM ('processing', 'completed', 'failed');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'site_engineer',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE SET NULL,
  address TEXT,
  start_date DATE,
  expected_completion_date DATE,
  budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  spent DECIMAL(15,2) NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'Planning',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Photos table
CREATE TABLE site_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  notes TEXT,
  category photo_category NOT NULL,
  gps_lat DECIMAL(10,8),
  gps_lng DECIMAL(11,8),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category material_category NOT NULL,
  quantity_purchased DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantity_remaining DECIMAL(12,2) GENERATED ALWAYS AS (quantity_purchased - quantity_used) STORED,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity_purchased * cost_per_unit) STORED,
  vendor TEXT,
  reorder_level DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  category expense_category NOT NULL,
  vendor TEXT,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bill_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Alerts table
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  threshold_percentage INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Reports table
CREATE TABLE progress_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_completed TEXT,
  material_used TEXT,
  issues TEXT,
  delays TEXT,
  tomorrow_plan TEXT,
  photos TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill Scans table
CREATE TABLE bill_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  vendor_name TEXT,
  amount DECIMAL(15,2),
  date DATE,
  gst_number TEXT,
  confidence_score DECIMAL(5,2),
  status bill_scan_status NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Detections table (for future AI integration)
CREATE TABLE material_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES site_photos(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  count INTEGER NOT NULL,
  confidence_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights table
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  insight_type insight_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity severity_level NOT NULL DEFAULT 'medium',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_site_photos_project_id ON site_photos(project_id);
CREATE INDEX idx_site_photos_category ON site_photos(category);
CREATE INDEX idx_site_photos_created_at ON site_photos(created_at);
CREATE INDEX idx_materials_project_id ON materials(project_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_budget_alerts_project_id ON budget_alerts(project_id);
CREATE INDEX idx_progress_reports_project_id ON progress_reports(project_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_ai_insights_project_id ON ai_insights(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Projects: Admins and engineers can do everything, clients can only view assigned projects
CREATE POLICY "Admins can manage all projects" ON projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Engineers can view and edit assigned projects" ON projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view assigned projects" ON projects
  FOR SELECT USING (
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Site Photos: Admins and engineers can manage, clients can view
CREATE POLICY "Admins can manage all photos" ON site_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Engineers can upload and view photos" ON site_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view project photos" ON site_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = site_photos.project_id
      AND (p.client_id = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Materials: Similar to projects
CREATE POLICY "Admins can manage all materials" ON materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Engineers can manage materials" ON materials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view project materials" ON materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = materials.project_id
      AND (p.client_id = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Expenses: Similar to projects
CREATE POLICY "Admins can manage all expenses" ON expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Engineers can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view project expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = expenses.project_id
      AND (p.client_id = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Budget Alerts: Admins can manage, others can view
CREATE POLICY "Admins can manage budget alerts" ON budget_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view budget alerts for their projects" ON budget_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_alerts.project_id
      AND (p.client_id = auth.uid() OR p.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Progress Reports: Engineers create, admins manage, clients view
CREATE POLICY "Admins can manage all reports" ON progress_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Engineers can create and view reports" ON progress_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view project reports" ON progress_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = progress_reports.project_id
      AND (p.client_id = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Bill Scans: Admins and engineers can manage
CREATE POLICY "Admins can manage bill scans" ON bill_scans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Engineers can manage bill scans" ON bill_scans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'site_engineer')
  );

-- Material Detections: Similar to photos
CREATE POLICY "Admins can manage detections" ON material_detections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Engineers can manage detections" ON material_detections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'site_engineer')
  );

-- AI Insights: Admins can manage, others can view
CREATE POLICY "Admins can manage insights" ON ai_insights
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view project insights" ON ai_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = ai_insights.project_id
      AND (p.client_id = auth.uid() OR p.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Functions and Triggers

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate budget alerts when expenses are added
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS TRIGGER AS $$
DECLARE
  project_budget DECIMAL;
  project_spent DECIMAL;
  spend_percentage DECIMAL;
BEGIN
  -- Get project budget
  SELECT budget INTO project_budget FROM projects WHERE id = NEW.project_id;
  
  -- Calculate total spent
  SELECT COALESCE(SUM(amount), 0) INTO project_spent
  FROM expenses WHERE project_id = NEW.project_id;
  
  -- Calculate percentage
  spend_percentage := (project_spent / project_budget) * 100;
  
  -- Update project spent amount
  UPDATE projects SET spent = project_spent WHERE id = NEW.project_id;
  
  -- Create alerts based on thresholds
  IF spend_percentage >= 100 THEN
    INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message)
    VALUES (NEW.project_id, 'budget_exceeded', 100, 'Budget has been exceeded!');
  ELSIF spend_percentage >= 90 THEN
    INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message)
    VALUES (NEW.project_id, 'budget_90', 90, 'Budget usage has reached 90%!');
  ELSIF spend_percentage >= 70 THEN
    INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message)
    VALUES (NEW.project_id, 'budget_70', 70, 'Budget usage has reached 70%');
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_expense_created
  AFTER INSERT ON expenses
  FOR EACH ROW EXECUTE FUNCTION check_budget_alerts();

-- Auto-check low stock for materials
CREATE OR REPLACE FUNCTION check_material_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quantity_remaining <= NEW.reorder_level AND NEW.reorder_level > 0 THEN
    INSERT INTO budget_alerts (project_id, alert_type, threshold_percentage, message)
    VALUES (NEW.project_id, 'low_stock', 0, 
            NEW.name || ' stock is low! Remaining: ' || NEW.quantity_remaining || ' ' || NEW.unit);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_material_updated
  AFTER UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION check_material_stock();
