-- Migration 026: Add get_all_reports and get_all_photos SECURITY DEFINER functions
-- These allow the reports and photos pages to load all org data without a projectId

-- ============================================================
-- GET ALL REPORTS (for reports page - no projectId filter)
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_reports(p_org_id UUID)
RETURNS SETOF progress_reports
LANGUAGE sql
SECURITY DEFINER STABLE
AS $$
  SELECT pr.*
  FROM progress_reports pr
  WHERE pr.org_id = get_current_user_org_id()
  ORDER BY pr.report_date DESC;
$$;

GRANT EXECUTE ON FUNCTION get_all_reports TO anon, authenticated;

-- ============================================================
-- GET ALL PHOTOS (for photos page - no projectId filter)
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_photos(p_org_id UUID)
RETURNS SETOF site_photos
LANGUAGE sql
SECURITY DEFINER STABLE
AS $$
  SELECT sp.*
  FROM site_photos sp
  WHERE sp.org_id = get_current_user_org_id()
  ORDER BY sp.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_all_photos TO anon, authenticated;
