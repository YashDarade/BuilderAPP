-- ============================================================
-- MIGRATION 030: SOFT DELETES
-- Adds deleted_at, deleted_by to all deletable tables
-- Converts hard deletes to soft deletes
-- Adds restore and permanent purge functions
-- Filters soft-deleted records from all read queries
-- ============================================================

-- ============================================================
-- 1. ADD SOFT DELETE COLUMNS TO ALL TABLES
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.site_photos
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.progress_reports
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================================
-- 2. CONVERT DELETE FUNCTIONS TO SOFT DELETE
-- ============================================================

CREATE OR REPLACE FUNCTION delete_project(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.projects
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_expense(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.expenses
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_material(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.materials
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_photo(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.site_photos
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_roadmap(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.roadmaps
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_user(p_user_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.users
  SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
  WHERE id = p_user_id AND org_id = public.get_current_user_org_id();
$$;

-- ============================================================
-- 3. ADD SOFT DELETE FILTERS TO ALL READ FUNCTIONS
-- ============================================================

-- PROJECTS
CREATE OR REPLACE FUNCTION get_all_projects(p_org_id UUID)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.projects WHERE org_id = p_org_id AND deleted_at IS NULL ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION get_project(p_id UUID)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.projects WHERE id = p_id; $$;

-- EXPENSES
CREATE OR REPLACE FUNCTION get_all_expenses(p_org_id UUID)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.expenses WHERE org_id = p_org_id AND deleted_at IS NULL ORDER BY date DESC; $$;

CREATE OR REPLACE FUNCTION get_project_expenses(p_project_id UUID)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.expenses WHERE project_id = p_project_id AND deleted_at IS NULL ORDER BY date DESC; $$;

-- MATERIALS
CREATE OR REPLACE FUNCTION get_all_materials(p_org_id UUID)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.materials WHERE org_id = p_org_id AND deleted_at IS NULL ORDER BY name; $$;

CREATE OR REPLACE FUNCTION get_project_materials(p_project_id UUID)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.materials WHERE project_id = p_project_id AND deleted_at IS NULL ORDER BY name; $$;

-- SITE PHOTOS
CREATE OR REPLACE FUNCTION get_project_photos(p_project_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.site_photos WHERE project_id = p_project_id AND deleted_at IS NULL ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION get_all_photos(p_org_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT sp.*
  FROM site_photos sp
  WHERE sp.org_id = get_current_user_org_id() AND sp.deleted_at IS NULL
  ORDER BY sp.created_at DESC;
$$;

-- PROGRESS REPORTS
CREATE OR REPLACE FUNCTION get_project_progress(p_project_id UUID)
RETURNS SETOF progress_reports
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.progress_reports WHERE project_id = p_project_id AND deleted_at IS NULL ORDER BY report_date DESC; $$;

CREATE OR REPLACE FUNCTION get_all_reports(p_org_id UUID)
RETURNS SETOF progress_reports
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT pr.*
  FROM progress_reports pr
  WHERE pr.org_id = get_current_user_org_id() AND pr.deleted_at IS NULL
  ORDER BY pr.report_date DESC;
$$;

-- ROADMAPS
CREATE OR REPLACE FUNCTION get_all_roadmaps(p_org_id UUID)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.roadmaps WHERE org_id = p_org_id AND deleted_at IS NULL ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION get_project_roadmaps(p_project_id UUID)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.roadmaps WHERE project_id = p_project_id AND deleted_at IS NULL ORDER BY created_at DESC; $$;

-- TEAM MEMBERS
CREATE OR REPLACE FUNCTION get_org_users(p_org_id UUID)
RETURNS SETOF users
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.users WHERE org_id = p_org_id AND deleted_at IS NULL ORDER BY created_at DESC; $$;

-- EXPENSES FOR CHART
CREATE OR REPLACE FUNCTION get_expenses_for_chart(p_org_id UUID, p_since DATE)
RETURNS TABLE(amount DECIMAL, date DATE)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT e.amount, e.date FROM public.expenses e WHERE e.org_id = p_org_id AND e.date >= p_since AND e.deleted_at IS NULL ORDER BY e.date; $$;

-- ============================================================
-- 4. RESTORE FUNCTIONS (owner-only)
-- ============================================================

CREATE OR REPLACE FUNCTION restore_project(p_id UUID)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.projects SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION restore_expense(p_id UUID)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.expenses SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION restore_material(p_id UUID)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.materials SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION restore_photo(p_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.site_photos SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION restore_roadmap(p_id UUID)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.roadmaps SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION restore_user(p_user_id UUID)
RETURNS SETOF users
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.users SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_user_id AND org_id = public.get_current_user_org_id()
  RETURNING *;
$$;

-- ============================================================
-- 5. GET DELETED ITEMS (owner-only view)
-- ============================================================

CREATE OR REPLACE FUNCTION get_deleted_projects(p_org_id UUID)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.projects WHERE org_id = p_org_id AND deleted_at IS NOT NULL ORDER BY deleted_at DESC; $$;

CREATE OR REPLACE FUNCTION get_deleted_expenses(p_org_id UUID)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.expenses WHERE org_id = p_org_id AND deleted_at IS NOT NULL ORDER BY deleted_at DESC; $$;

CREATE OR REPLACE FUNCTION get_deleted_materials(p_org_id UUID)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.materials WHERE org_id = p_org_id AND deleted_at IS NOT NULL ORDER BY deleted_at DESC; $$;

CREATE OR REPLACE FUNCTION get_deleted_photos(p_org_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.site_photos WHERE org_id = p_org_id AND deleted_at IS NOT NULL ORDER BY deleted_at DESC; $$;

CREATE OR REPLACE FUNCTION get_deleted_roadmaps(p_org_id UUID)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.roadmaps WHERE org_id = p_org_id AND deleted_at IS NOT NULL ORDER BY deleted_at DESC; $$;

CREATE OR REPLACE FUNCTION get_deleted_users(p_org_id UUID)
RETURNS SETOF users
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.users WHERE org_id = p_org_id AND deleted_at IS NOT NULL ORDER BY deleted_at DESC; $$;

-- ============================================================
-- 6. CASCADE SOFT DELETE — when project is deleted, delete its children
-- ============================================================

CREATE OR REPLACE FUNCTION delete_project_cascade(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT public.delete_project(p_id);

  UPDATE public.expenses SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  ) WHERE project_id = p_id AND deleted_at IS NULL;

  UPDATE public.materials SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  ) WHERE project_id = p_id AND deleted_at IS NULL;

  UPDATE public.site_photos SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  ) WHERE project_id = p_id AND deleted_at IS NULL;

  UPDATE public.progress_reports SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  ) WHERE project_id = p_id AND deleted_at IS NULL;

  UPDATE public.roadmaps SET deleted_at = now(), deleted_by = (
    SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  ) WHERE project_id = p_id AND deleted_at IS NULL;
$$;
