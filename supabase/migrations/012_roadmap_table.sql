-- Roadmaps table for project roadmap feature
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage roadmaps" ON roadmaps
  FOR ALL USING (get_user_role() = 'admin');

-- Clients can view roadmaps for their projects
CREATE POLICY "Clients can view own project roadmaps" ON roadmaps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = roadmaps.project_id AND p.client_id = get_user_id())
    OR get_user_role() = 'admin'
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON roadmaps TO authenticated;

-- Update trigger
CREATE OR REPLACE FUNCTION update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_roadmap_update
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();
