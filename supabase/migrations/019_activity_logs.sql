-- ============================================================
-- ACTIVITY LOG TABLE
-- Tracks who created/edited/deleted what
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'material', 'expense', 'photo', 'report', 'roadmap', 'bill_scan')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_id ON public.activity_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- 3. RLS policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view activity logs"
ON public.activity_logs FOR SELECT
USING (org_id = (SELECT org_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1));

CREATE POLICY "Org members can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (org_id = (SELECT org_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1));

-- 4. Grant permissions
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
