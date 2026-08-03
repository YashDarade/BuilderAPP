-- ============================================================
-- CREATE roadmaps table with org_id + RLS + seed data
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Create the table (with org_id from the start)
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- 2. Org-scoped policy
CREATE POLICY "org_all_roadmaps" ON roadmaps
  FOR ALL USING (org_id = get_user_org_id());

-- 3. Update trigger
CREATE OR REPLACE FUNCTION update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_roadmap_update ON roadmaps;
CREATE TRIGGER on_roadmap_update
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON roadmaps TO authenticated;

-- 4. Seed demo roadmaps for the 3 demo projects
DO $$
DECLARE
  demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
  proj1 UUID;
  proj2 UUID;
  proj3 UUID;
  owner_user_id UUID;
BEGIN
  SELECT id INTO proj1 FROM projects WHERE name = 'Green Valley Residence' AND org_id = demo_org_id LIMIT 1;
  SELECT id INTO proj2 FROM projects WHERE name = 'Metro Commercial Tower' AND org_id = demo_org_id LIMIT 1;
  SELECT id INTO proj3 FROM projects WHERE name = 'Sunset Villa Complex' AND org_id = demo_org_id LIMIT 1;
  SELECT id INTO owner_user_id FROM users WHERE org_id = demo_org_id AND role = 'owner' LIMIT 1;

  IF owner_user_id IS NULL THEN
    SELECT id INTO owner_user_id FROM users WHERE org_id = demo_org_id LIMIT 1;
  END IF;

  IF proj1 IS NOT NULL AND owner_user_id IS NOT NULL THEN
    INSERT INTO roadmaps (project_id, org_id, title, description, phases, created_by)
    VALUES (
      proj1, demo_org_id,
      'Green Valley — Construction Roadmap',
      'End-to-end construction roadmap for the 48-unit residential project.',
      '[
        {"id":"p1","name":"Foundation & Excavation","status":"completed","progress":100,"start_date":"2025-11-01","end_date":"2025-12-15","notes":"Excavation and foundation work completed."},
        {"id":"p2","name":"Structural Framework","status":"in_progress","progress":65,"start_date":"2025-12-16","end_date":"2026-03-30","notes":"RCC frame and slab work in progress."},
        {"id":"p3","name":"Brickwork & Plastering","status":"not_started","progress":0,"start_date":"2026-04-01","end_date":"2026-06-15","notes":"Pending structural completion."},
        {"id":"p4","name":"MEP Rough-in","status":"not_started","progress":0,"start_date":"2026-05-01","end_date":"2026-07-15","notes":"Plumbing and electrical first fix."},
        {"id":"p5","name":"Finishing & Handover","status":"not_started","progress":0,"start_date":"2026-07-16","end_date":"2026-09-30","notes":"Painting, fixtures, final inspection."}
      ]'::jsonb,
      owner_user_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF proj2 IS NOT NULL AND owner_user_id IS NOT NULL THEN
    INSERT INTO roadmaps (project_id, org_id, title, description, phases, created_by)
    VALUES (
      proj2, demo_org_id,
      'Metro Tower — Construction Roadmap',
      'High-rise commercial tower construction phases.',
      '[
        {"id":"p1","name":"Basement & Parking","status":"completed","progress":100,"start_date":"2025-10-01","end_date":"2026-01-15","notes":"2-level basement completed."},
        {"id":"p2","name":"Core & Shell","status":"in_progress","progress":40,"start_date":"2026-01-16","end_date":"2026-06-30","notes":"Core walls and floor slabs in progress."},
        {"id":"p3","name":"Facade & Glazing","status":"not_started","progress":0,"start_date":"2026-05-01","end_date":"2026-08-30","notes":"Curtain wall installation."},
        {"id":"p4","name":"Interior Fit-out","status":"not_started","progress":0,"start_date":"2026-07-01","end_date":"2026-11-30","notes":"Office floors and common areas."}
      ]'::jsonb,
      owner_user_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF proj3 IS NOT NULL AND owner_user_id IS NOT NULL THEN
    INSERT INTO roadmaps (project_id, org_id, title, description, phases, created_by)
    VALUES (
      proj3, demo_org_id,
      'Sunset Villa — Construction Roadmap',
      'Luxury villa construction roadmap with smart-home integration.',
      '[
        {"id":"p1","name":"Site Prep & Foundation","status":"completed","progress":100,"start_date":"2026-01-05","end_date":"2026-02-28","notes":"Grading and raft foundation done."},
        {"id":"p2","name":"Structure & Roofing","status":"in_progress","progress":55,"start_date":"2026-03-01","end_date":"2026-05-31","notes":"Framing and roof trusses underway."},
        {"id":"p3","name":"MEP & Smart Home Wiring","status":"not_started","progress":0,"start_date":"2026-05-15","end_date":"2026-07-15","notes":"Includes smart-home pre-wiring."},
        {"id":"p4","name":"Interior & Landscape","status":"not_started","progress":0,"start_date":"2026-07-01","end_date":"2026-09-30","notes":"Flooring, kitchen, landscaping."}
      ]'::jsonb,
      owner_user_id
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
