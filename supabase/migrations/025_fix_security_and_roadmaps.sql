-- Fix SECURITY DEFINER functions to validate org_id from auth
-- Also fix roadmaps table

-- Helper: get current user's org_id (used by all functions)
CREATE OR REPLACE FUNCTION get_current_user_org_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT org_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- ROADMAPS: add org_id if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roadmaps' AND column_name = 'org_id') THEN
    ALTER TABLE public.roadmaps ADD COLUMN org_id UUID REFERENCES public.organizations(id);
    UPDATE public.roadmaps SET org_id = (SELECT org_id FROM public.projects WHERE id = project_id) WHERE org_id IS NULL;
    ALTER TABLE public.roadmaps ALTER COLUMN org_id SET NOT NULL;
  END IF;
END $$;

-- USERS
CREATE OR REPLACE FUNCTION get_user_profile(user_auth_id UUID DEFAULT NULL, user_email TEXT DEFAULT NULL)
RETURNS SETOF users LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.users WHERE auth_id = COALESCE(user_auth_id, auth.uid()) OR email = COALESCE(user_email, (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())) LIMIT 1;
$$;

-- PROJECTS (validate org_id)
CREATE OR REPLACE FUNCTION get_all_projects(p_org_id UUID)
RETURNS SETOF projects LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.projects WHERE org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_project(p_id UUID)
RETURNS SETOF projects LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.projects WHERE id = p_id AND org_id = get_current_user_org_id();
$$;

-- EXPENSES (validate org_id)
CREATE OR REPLACE FUNCTION get_all_expenses(p_org_id UUID)
RETURNS SETOF expenses LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.expenses WHERE org_id = get_current_user_org_id() ORDER BY date DESC;
$$;

CREATE OR REPLACE FUNCTION get_project_expenses(p_project_id UUID)
RETURNS SETOF expenses LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.expenses WHERE project_id = p_project_id AND org_id = get_current_user_org_id() ORDER BY date DESC;
$$;

-- MATERIALS (validate org_id)
CREATE OR REPLACE FUNCTION get_all_materials(p_org_id UUID)
RETURNS SETOF materials LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.materials WHERE org_id = get_current_user_org_id() ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION get_project_materials(p_project_id UUID)
RETURNS SETOF materials LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.materials WHERE project_id = p_project_id AND org_id = get_current_user_org_id() ORDER BY name;
$$;

-- PHOTOS (validate org_id)
CREATE OR REPLACE FUNCTION get_project_photos(p_project_id UUID)
RETURNS SETOF site_photos LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.site_photos WHERE project_id = p_project_id AND org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

-- PROGRESS (validate org_id)
CREATE OR REPLACE FUNCTION get_project_progress(p_project_id UUID)
RETURNS SETOF progress_reports LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.progress_reports WHERE project_id = p_project_id AND org_id = get_current_user_org_id() ORDER BY report_date DESC;
$$;

-- NOTIFICATIONS (validate user_id)
CREATE OR REPLACE FUNCTION get_notifications(p_user_id UUID)
RETURNS SETOF notifications LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.notifications WHERE user_id = get_current_user_id() ORDER BY created_at DESC;
$$;

-- BUDGET ALERTS (validate org_id)
CREATE OR REPLACE FUNCTION get_all_budget_alerts(p_org_id UUID)
RETURNS SETOF budget_alerts LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.budget_alerts WHERE org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_project_budget_alerts(p_project_id UUID)
RETURNS SETOF budget_alerts LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.budget_alerts WHERE project_id = p_project_id AND org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

-- BILL SCANS (validate org_id)
CREATE OR REPLACE FUNCTION get_all_bill_scans(p_org_id UUID)
RETURNS SETOF bill_scans LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.bill_scans WHERE org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

-- ROADMAPS (validate org_id)
CREATE OR REPLACE FUNCTION get_all_roadmaps(p_org_id UUID)
RETURNS SETOF roadmaps LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.roadmaps WHERE org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_project_roadmaps(p_project_id UUID)
RETURNS SETOF roadmaps LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.roadmaps WHERE project_id = p_project_id AND org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

-- ACTIVITY LOGS (validate org_id)
CREATE OR REPLACE FUNCTION get_activity_logs(p_org_id UUID)
RETURNS SETOF activity_logs LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.activity_logs WHERE org_id = get_current_user_org_id() ORDER BY created_at DESC LIMIT 50;
$$;

-- TEAM (validate org_id)
CREATE OR REPLACE FUNCTION get_org_users(p_org_id UUID)
RETURNS SETOF users LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT * FROM public.users WHERE org_id = get_current_user_org_id() ORDER BY created_at DESC;
$$;

-- EXPENSES CHART (validate org_id)
CREATE OR REPLACE FUNCTION get_expenses_for_chart(p_org_id UUID, p_since DATE)
RETURNS TABLE(amount DECIMAL, date DATE) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT e.amount, e.date FROM public.expenses e WHERE e.org_id = get_current_user_org_id() AND e.date >= p_since ORDER BY e.date;
$$;

-- Grant all
DO $$ DECLARE fn RECORD; BEGIN FOR fn IN SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f' LOOP BEGIN EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO anon, authenticated', fn.proname); EXCEPTION WHEN OTHERS THEN NULL; END; END LOOP; END $$;

-- TEAM MEMBER INSERT (for API route)
CREATE OR REPLACE FUNCTION insert_team_member(p_email TEXT, p_full_name TEXT, p_role TEXT, p_org_id UUID, p_auth_id UUID DEFAULT NULL)
RETURNS SETOF users LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.users (email, full_name, role, org_id, auth_id, phone) VALUES (p_email, p_full_name, p_role::user_role, p_org_id, p_auth_id, '') RETURNING *;
$$;

CREATE OR REPLACE FUNCTION insert_user_log(p_org_id UUID, p_user_id UUID, p_action TEXT, p_entity_type TEXT, p_entity_id UUID, p_entity_name TEXT, p_details JSONB)
RETURNS SETOF activity_logs LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.activity_logs (org_id, user_id, action, entity_type, entity_id, entity_name, details) VALUES (p_org_id, p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_details) RETURNING *;
$$;

GRANT EXECUTE ON FUNCTION insert_team_member TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_user_log TO anon, authenticated;
