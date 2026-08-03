-- ============================================================
-- STORAGE BUCKET: bill-scans
-- Run in Supabase SQL Editor
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bill-scans',
  'bill-scans',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Org members can view bill scans"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bill-scans'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
);

CREATE POLICY "Org members can upload bill scans"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bill-scans'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
);

