-- SECURITY DEFINER function to bypass Supabase's table permission issue
-- Runs as owner (postgres), bypasses RLS and table grants

CREATE OR REPLACE FUNCTION get_user_profile(user_auth_id UUID DEFAULT NULL, user_email TEXT DEFAULT NULL)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.users
  WHERE auth_id = COALESCE(user_auth_id, auth.uid())
     OR email = COALESCE(user_email, (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_user_profile TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_org_users(user_org_id UUID)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.users WHERE org_id = user_org_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_org_users TO authenticated;

CREATE OR REPLACE FUNCTION get_all_projects(user_org_id UUID)
RETURNS SETOF projects
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.projects WHERE org_id = user_org_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_all_projects TO authenticated;

CREATE OR REPLACE FUNCTION get_project_materials(p_project_id UUID)
RETURNS SETOF materials
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.materials WHERE project_id = p_project_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_project_materials TO authenticated;

CREATE OR REPLACE FUNCTION get_project_expenses(p_project_id UUID)
RETURNS SETOF expenses
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.expenses WHERE project_id = p_project_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_project_expenses TO authenticated;

CREATE OR REPLACE FUNCTION get_project_photos(p_project_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.site_photos WHERE project_id = p_project_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_project_photos TO authenticated;

CREATE OR REPLACE FUNCTION get_project_progress(p_project_id UUID)
RETURNS SETOF progress_reports
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.progress_reports WHERE project_id = p_project_id ORDER BY report_date DESC;
$$;

GRANT EXECUTE ON FUNCTION get_project_progress TO authenticated;

CREATE OR REPLACE FUNCTION get_project_budget_alerts(p_project_id UUID)
RETURNS SETOF budget_alerts
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.budget_alerts WHERE project_id = p_project_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_project_budget_alerts TO authenticated;

CREATE OR REPLACE FUNCTION get_notifications(p_user_id UUID)
RETURNS SETOF notifications
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.notifications WHERE user_id = p_user_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_notifications TO authenticated;

CREATE OR REPLACE FUNCTION get_activity_logs(p_org_id UUID)
RETURNS SETOF activity_logs
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.activity_logs WHERE org_id = p_org_id ORDER BY created_at DESC LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_activity_logs TO authenticated;

CREATE OR REPLACE FUNCTION get_roadmaps(p_org_id UUID)
RETURNS SETOF roadmaps
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.roadmaps WHERE org_id = p_org_id ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_roadmaps TO authenticated;
