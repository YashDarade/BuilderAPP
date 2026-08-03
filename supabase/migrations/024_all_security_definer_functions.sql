-- ============================================================
-- SECURITY DEFINER functions to bypass Supabase table permission issue
-- All reads and writes go through these functions
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
-- get_user_profile already exists from migration 023

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_projects(p_org_id UUID)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.projects WHERE org_id = p_org_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION get_project(p_id UUID)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.projects WHERE id = p_id; $$;

CREATE OR REPLACE FUNCTION insert_project(
  p_name TEXT, p_client_name TEXT, p_address TEXT, p_start_date DATE,
  p_expected_completion_date DATE, p_budget DECIMAL, p_status TEXT,
  p_progress INTEGER, p_org_id UUID, p_created_by UUID, p_client_id UUID DEFAULT NULL,
  p_engineer_id UUID DEFAULT NULL
)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.projects (name, client_name, address, start_date, expected_completion_date, budget, status, progress, org_id, created_by, client_id, engineer_id)
  VALUES (p_name, p_client_name, p_address, p_start_date, p_expected_completion_date, p_budget, p_status, p_progress, p_org_id, p_created_by, p_client_id, p_engineer_id)
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_project(p_id UUID, p_name TEXT DEFAULT NULL, p_client_name TEXT DEFAULT NULL, p_address TEXT DEFAULT NULL, p_start_date DATE DEFAULT NULL, p_expected_completion_date DATE DEFAULT NULL, p_budget DECIMAL DEFAULT NULL, p_spent DECIMAL DEFAULT NULL, p_status TEXT DEFAULT NULL, p_progress INTEGER DEFAULT NULL, p_client_id UUID DEFAULT NULL, p_engineer_id UUID DEFAULT NULL)
RETURNS SETOF projects
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.projects SET
    name = COALESCE(p_name, name),
    client_name = COALESCE(p_client_name, client_name),
    address = COALESCE(p_address, address),
    start_date = COALESCE(p_start_date, start_date),
    expected_completion_date = COALESCE(p_expected_completion_date, expected_completion_date),
    budget = COALESCE(p_budget, budget),
    spent = COALESCE(p_spent, spent),
    status = COALESCE(p_status, status),
    progress = COALESCE(p_progress, progress),
    client_id = COALESCE(p_client_id, client_id),
    engineer_id = COALESCE(p_engineer_id, engineer_id),
    updated_at = NOW()
  WHERE id = p_id RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_project(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM public.projects WHERE id = p_id; $$;

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_expenses(p_org_id UUID)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.expenses WHERE org_id = p_org_id ORDER BY date DESC; $$;

CREATE OR REPLACE FUNCTION get_project_expenses(p_project_id UUID)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.expenses WHERE project_id = p_project_id ORDER BY date DESC; $$;

CREATE OR REPLACE FUNCTION insert_expense(p_project_id UUID, p_amount DECIMAL, p_category TEXT, p_vendor TEXT, p_description TEXT, p_date DATE, p_bill_url TEXT, p_created_by UUID, p_org_id UUID)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.expenses (project_id, amount, category, vendor, description, date, bill_url, created_by, org_id)
  VALUES (p_project_id, p_amount, p_category, p_vendor, p_description, p_date, p_bill_url, p_created_by, p_org_id)
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_expense(p_id UUID, p_amount DECIMAL DEFAULT NULL, p_category TEXT DEFAULT NULL, p_vendor TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL, p_date DATE DEFAULT NULL, p_bill_url TEXT DEFAULT NULL)
RETURNS SETOF expenses
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.expenses SET
    amount = COALESCE(p_amount, amount),
    category = COALESCE(p_category, category),
    vendor = COALESCE(p_vendor, vendor),
    description = COALESCE(p_description, description),
    date = COALESCE(p_date, date),
    bill_url = COALESCE(p_bill_url, bill_url)
  WHERE id = p_id RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_expense(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM public.expenses WHERE id = p_id; $$;

-- ============================================================
-- MATERIALS
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_materials(p_org_id UUID)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.materials WHERE org_id = p_org_id ORDER BY name; $$;

CREATE OR REPLACE FUNCTION get_project_materials(p_project_id UUID)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.materials WHERE project_id = p_project_id ORDER BY name; $$;

CREATE OR REPLACE FUNCTION insert_material(p_project_id UUID, p_name TEXT, p_category TEXT, p_quantity_purchased DECIMAL, p_quantity_used DECIMAL, p_unit TEXT, p_cost_per_unit DECIMAL, p_vendor TEXT, p_reorder_level DECIMAL, p_org_id UUID)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.materials (project_id, name, category, quantity_purchased, quantity_used, unit, cost_per_unit, vendor, reorder_level, org_id)
  VALUES (p_project_id, p_name, p_category, p_quantity_purchased, p_quantity_used, p_unit, p_cost_per_unit, p_vendor, p_reorder_level, p_org_id)
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_material(p_id UUID, p_name TEXT DEFAULT NULL, p_category TEXT DEFAULT NULL, p_quantity_purchased DECIMAL DEFAULT NULL, p_quantity_used DECIMAL DEFAULT NULL, p_unit TEXT DEFAULT NULL, p_cost_per_unit DECIMAL DEFAULT NULL, p_vendor TEXT DEFAULT NULL, p_reorder_level DECIMAL DEFAULT NULL)
RETURNS SETOF materials
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.materials SET
    name = COALESCE(p_name, name),
    category = COALESCE(p_category, category),
    quantity_purchased = COALESCE(p_quantity_purchased, quantity_purchased),
    quantity_used = COALESCE(p_quantity_used, quantity_used),
    unit = COALESCE(p_unit, unit),
    cost_per_unit = COALESCE(p_cost_per_unit, cost_per_unit),
    vendor = COALESCE(p_vendor, vendor),
    reorder_level = COALESCE(p_reorder_level, reorder_level),
    updated_at = NOW()
  WHERE id = p_id RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_material(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM public.materials WHERE id = p_id; $$;

-- ============================================================
-- SITE PHOTOS
-- ============================================================
CREATE OR REPLACE FUNCTION get_project_photos(p_project_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.site_photos WHERE project_id = p_project_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION insert_photo(p_project_id UUID, p_url TEXT, p_thumbnail_url TEXT, p_notes TEXT, p_category TEXT, p_gps_lat DECIMAL, p_gps_lng DECIMAL, p_uploaded_by UUID, p_org_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.site_photos (project_id, url, thumbnail_url, notes, category, gps_lat, gps_lng, uploaded_by, org_id)
  VALUES (p_project_id, p_url, p_thumbnail_url, p_notes, p_category, p_gps_lat, p_gps_lng, p_uploaded_by, p_org_id)
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_photo(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM public.site_photos WHERE id = p_id; $$;

-- ============================================================
-- PROGRESS REPORTS
-- ============================================================
CREATE OR REPLACE FUNCTION get_project_progress(p_project_id UUID)
RETURNS SETOF progress_reports
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.progress_reports WHERE project_id = p_project_id ORDER BY report_date DESC; $$;

CREATE OR REPLACE FUNCTION insert_report(p_project_id UUID, p_report_date DATE, p_work_completed TEXT, p_material_used TEXT, p_issues TEXT, p_delays TEXT, p_tomorrow_plan TEXT, p_photos TEXT[], p_created_by UUID, p_org_id UUID)
RETURNS SETOF progress_reports
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.progress_reports (project_id, report_date, work_completed, material_used, issues, delays, tomorrow_plan, photos, created_by, org_id)
  VALUES (p_project_id, p_report_date, p_work_completed, p_material_used, p_issues, p_delays, p_tomorrow_plan, p_photos, p_created_by, p_org_id)
  RETURNING *;
$$;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE OR REPLACE FUNCTION get_notifications(p_user_id UUID)
RETURNS SETOF notifications
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.notifications WHERE user_id = p_user_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION mark_notification_read(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ UPDATE public.notifications SET is_read = true WHERE id = p_id; $$;

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ UPDATE public.notifications SET is_read = true WHERE user_id = p_user_id AND is_read = false; $$;

-- ============================================================
-- BUDGET ALERTS
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_budget_alerts(p_org_id UUID)
RETURNS SETOF budget_alerts
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.budget_alerts WHERE org_id = p_org_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION get_project_budget_alerts(p_project_id UUID)
RETURNS SETOF budget_alerts
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.budget_alerts WHERE project_id = p_project_id ORDER BY created_at DESC; $$;

-- ============================================================
-- BILL SCANS
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_bill_scans(p_org_id UUID)
RETURNS SETOF bill_scans
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.bill_scans WHERE org_id = p_org_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION insert_bill_scan(p_org_id UUID, p_image_url TEXT, p_expense_id UUID, p_vendor_name TEXT, p_amount DECIMAL, p_date DATE, p_gst_number TEXT, p_confidence_score DECIMAL, p_status TEXT)
RETURNS SETOF bill_scans
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.bill_scans (org_id, image_url, expense_id, vendor_name, amount, date, gst_number, confidence_score, status)
  VALUES (p_org_id, p_image_url, p_expense_id, p_vendor_name, p_amount, p_date, p_gst_number, p_confidence_score, p_status)
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_bill_scan(p_id UUID, p_vendor_name TEXT DEFAULT NULL, p_amount DECIMAL DEFAULT NULL, p_date DATE DEFAULT NULL, p_gst_number TEXT DEFAULT NULL, p_confidence_score DECIMAL DEFAULT NULL, p_status TEXT DEFAULT NULL, p_expense_id UUID DEFAULT NULL)
RETURNS SETOF bill_scans
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.bill_scans SET
    vendor_name = COALESCE(p_vendor_name, vendor_name),
    amount = COALESCE(p_amount, amount),
    date = COALESCE(p_date, date),
    gst_number = COALESCE(p_gst_number, gst_number),
    confidence_score = COALESCE(p_confidence_score, confidence_score),
    status = COALESCE(p_status, status),
    expense_id = COALESCE(p_expense_id, expense_id)
  WHERE id = p_id RETURNING *;
$$;

-- ============================================================
-- ROADMAPS
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_roadmaps(p_org_id UUID)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.roadmaps WHERE org_id = p_org_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION get_project_roadmaps(p_project_id UUID)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.roadmaps WHERE project_id = p_project_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION insert_roadmap(p_project_id UUID, p_org_id UUID, p_title TEXT, p_description TEXT, p_phases JSONB, p_created_by UUID)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.roadmaps (project_id, org_id, title, description, phases, created_by)
  VALUES (p_project_id, p_org_id, p_title, p_description, p_phases, p_created_by)
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION update_roadmap(p_id UUID, p_title TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL, p_phases JSONB DEFAULT NULL)
RETURNS SETOF roadmaps
LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.roadmaps SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    phases = COALESCE(p_phases, phases),
    updated_at = NOW()
  WHERE id = p_id RETURNING *;
$$;

CREATE OR REPLACE FUNCTION delete_roadmap(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM public.roadmaps WHERE id = p_id; $$;

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE OR REPLACE FUNCTION get_activity_logs(p_org_id UUID)
RETURNS SETOF activity_logs
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.activity_logs WHERE org_id = p_org_id ORDER BY created_at DESC LIMIT 50; $$;

CREATE OR REPLACE FUNCTION insert_activity_log(p_org_id UUID, p_user_id UUID, p_action TEXT, p_entity_type TEXT, p_entity_id UUID, p_entity_name TEXT, p_details JSONB)
RETURNS SETOF activity_logs
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.activity_logs (org_id, user_id, action, entity_type, entity_id, entity_name, details)
  VALUES (p_org_id, p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_details)
  RETURNING *;
$$;

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE OR REPLACE FUNCTION get_org_users(p_org_id UUID)
RETURNS SETOF users
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT * FROM public.users WHERE org_id = p_org_id ORDER BY created_at DESC; $$;

CREATE OR REPLACE FUNCTION update_user_role(p_user_id UUID, p_role TEXT)
RETURNS SETOF users
LANGUAGE sql SECURITY DEFINER
AS $$ UPDATE public.users SET role = p_role WHERE id = p_user_id RETURNING *; $$;

CREATE OR REPLACE FUNCTION delete_user(p_user_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$ DELETE FROM public.users WHERE id = p_user_id; $$;

-- ============================================================
-- EXPENSES aggregated queries for dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION get_expenses_for_chart(p_org_id UUID, p_since DATE)
RETURNS TABLE(amount DECIMAL, date DATE)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT e.amount, e.date FROM public.expenses e WHERE e.org_id = p_org_id AND e.date >= p_since ORDER BY e.date; $$;

-- ============================================================
-- GRANT EXECUTE to all roles
-- ============================================================
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND EXISTS (
        SELECT 1 FROM pg_proc pp
        JOIN pg_namespace nn ON pp.pronamespace = nn.oid
        WHERE nn.nspname = 'public' AND pp.proname = p.proname
          AND pg_catalog.pg_get_function_result(p.oid) IS NOT NULL
      )
  LOOP
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO anon, authenticated', fn.proname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;
