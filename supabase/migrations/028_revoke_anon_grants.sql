-- Migration 028: Revoke anon access to SECURITY DEFINER functions
-- CRITICAL: These functions bypass RLS and should NOT be callable by anonymous users

-- Revoke EXECUTE from anon on ALL public functions
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.proname, n.nspname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM anon', fn.proname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- Re-grant EXECUTE only to authenticated role (not anon)
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.proname, n.nspname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO authenticated', fn.proname);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- Explicitly revoke anon from specific critical functions
REVOKE EXECUTE ON FUNCTION get_user_profile FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_projects FROM anon;
REVOKE EXECUTE ON FUNCTION get_project FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_expenses FROM anon;
REVOKE EXECUTE ON FUNCTION get_project_expenses FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_materials FROM anon;
REVOKE EXECUTE ON FUNCTION get_project_materials FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_photos FROM anon;
REVOKE EXECUTE ON FUNCTION get_project_photos FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_reports FROM anon;
REVOKE EXECUTE ON FUNCTION get_project_progress FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_roadmaps FROM anon;
REVOKE EXECUTE ON FUNCTION get_project_roadmaps FROM anon;
REVOKE EXECUTE ON FUNCTION get_notifications FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_budget_alerts FROM anon;
REVOKE EXECUTE ON FUNCTION get_activity_logs FROM anon;
REVOKE EXECUTE ON FUNCTION get_all_bill_scans FROM anon;
REVOKE EXECUTE ON FUNCTION get_expenses_for_chart FROM anon;
REVOKE EXECUTE ON FUNCTION insert_project FROM anon;
REVOKE EXECUTE ON FUNCTION update_project FROM anon;
REVOKE EXECUTE ON FUNCTION delete_project FROM anon;
REVOKE EXECUTE ON FUNCTION insert_expense FROM anon;
REVOKE EXECUTE ON FUNCTION update_expense FROM anon;
REVOKE EXECUTE ON FUNCTION delete_expense FROM anon;
REVOKE EXECUTE ON FUNCTION insert_material FROM anon;
REVOKE EXECUTE ON FUNCTION update_material FROM anon;
REVOKE EXECUTE ON FUNCTION delete_material FROM anon;
REVOKE EXECUTE ON FUNCTION insert_photo FROM anon;
REVOKE EXECUTE ON FUNCTION delete_photo FROM anon;
REVOKE EXECUTE ON FUNCTION insert_report FROM anon;
REVOKE EXECUTE ON FUNCTION insert_roadmap FROM anon;
REVOKE EXECUTE ON FUNCTION update_roadmap FROM anon;
REVOKE EXECUTE ON FUNCTION delete_roadmap FROM anon;
REVOKE EXECUTE ON FUNCTION insert_activity_log FROM anon;
REVOKE EXECUTE ON FUNCTION insert_team_member FROM anon;
REVOKE EXECUTE ON FUNCTION insert_user_log FROM anon;
REVOKE EXECUTE ON FUNCTION mark_notification_read FROM anon;
REVOKE EXECUTE ON FUNCTION mark_all_notifications_read FROM anon;
REVOKE EXECUTE ON FUNCTION insert_bill_scan FROM anon;
REVOKE EXECUTE ON FUNCTION update_bill_scan FROM anon;

-- Re-grant to authenticated only
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_projects TO authenticated;
GRANT EXECUTE ON FUNCTION get_project TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_expenses TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_expenses TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_materials TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_materials TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_photos TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_photos TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_reports TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_roadmaps TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_roadmaps TO authenticated;
GRANT EXECUTE ON FUNCTION get_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_budget_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_bill_scans TO authenticated;
GRANT EXECUTE ON FUNCTION get_expenses_for_chart TO authenticated;
GRANT EXECUTE ON FUNCTION insert_project TO authenticated;
GRANT EXECUTE ON FUNCTION update_project TO authenticated;
GRANT EXECUTE ON FUNCTION delete_project TO authenticated;
GRANT EXECUTE ON FUNCTION insert_expense TO authenticated;
GRANT EXECUTE ON FUNCTION update_expense TO authenticated;
GRANT EXECUTE ON FUNCTION delete_expense TO authenticated;
GRANT EXECUTE ON FUNCTION insert_material TO authenticated;
GRANT EXECUTE ON FUNCTION update_material TO authenticated;
GRANT EXECUTE ON FUNCTION delete_material TO authenticated;
GRANT EXECUTE ON FUNCTION insert_photo TO authenticated;
GRANT EXECUTE ON FUNCTION delete_photo TO authenticated;
GRANT EXECUTE ON FUNCTION insert_report TO authenticated;
GRANT EXECUTE ON FUNCTION insert_roadmap TO authenticated;
GRANT EXECUTE ON FUNCTION update_roadmap TO authenticated;
GRANT EXECUTE ON FUNCTION delete_roadmap TO authenticated;
GRANT EXECUTE ON FUNCTION insert_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_log TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION insert_bill_scan TO authenticated;
GRANT EXECUTE ON FUNCTION update_bill_scan TO authenticated;
