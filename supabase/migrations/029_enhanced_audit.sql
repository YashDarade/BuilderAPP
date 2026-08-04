-- ============================================================
-- MIGRATION 029: ENHANCED AUDIT SYSTEM
-- Adds old/new values, IP, user_agent to activity_logs
-- Fixes entity_type CHECK to include 'team'
-- Adds org-level guard to all delete functions
-- ============================================================

-- 1. Add new columns to activity_logs
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS old_value JSONB,
  ADD COLUMN IF NOT EXISTS new_value JSONB,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Fix entity_type CHECK to include 'team'
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;
ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_entity_type_check
  CHECK (entity_type IN ('project', 'material', 'expense', 'photo', 'report', 'roadmap', 'bill_scan', 'team'));

-- 3. Update insert_activity_log RPC to accept new params
CREATE OR REPLACE FUNCTION insert_activity_log(
  p_org_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_details JSONB,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS SETOF activity_logs
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.activity_logs (org_id, user_id, action, entity_type, entity_id, entity_name, details, old_value, new_value, ip_address, user_agent)
  VALUES (p_org_id, p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_details, p_old_value, p_new_value, p_ip_address, p_user_agent)
  RETURNING *;
$$;

-- 4. Update insert_user_log RPC (alias) to accept new params
CREATE OR REPLACE FUNCTION insert_user_log(
  p_org_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_details JSONB,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS SETOF activity_logs
LANGUAGE sql SECURITY DEFINER
AS $$
  INSERT INTO public.activity_logs (org_id, user_id, action, entity_type, entity_id, entity_name, details, old_value, new_value, ip_address, user_agent)
  VALUES (p_org_id, p_user_id, p_action, p_entity_type, p_entity_id, p_entity_name, p_details, p_old_value, p_new_value, p_ip_address, p_user_agent)
  RETURNING *;
$$;

-- 5. Add org-level guard to all delete functions (CRITICAL SECURITY FIX)
CREATE OR REPLACE FUNCTION delete_project(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.projects WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_expense(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.expenses WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_material(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.materials WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_photo(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.site_photos WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_roadmap(p_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.roadmaps WHERE id = p_id AND org_id = public.get_current_user_org_id();
$$;

CREATE OR REPLACE FUNCTION delete_user(p_user_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM public.users WHERE id = p_user_id AND org_id = public.get_current_user_org_id();
$$;
