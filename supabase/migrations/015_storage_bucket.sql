-- ============================================================
-- STORAGE BUCKET: site-photos
-- Run this in Supabase SQL Editor AFTER the other migrations
-- ============================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-photos',
  'site-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies

-- Anyone in the org can read photos
CREATE POLICY "Org members can view site photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'site-photos'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
);

-- Org members can upload photos
CREATE POLICY "Org members can upload site photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-photos'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
);

-- Org members can delete their own photos
CREATE POLICY "Org members can delete own site photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-photos'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM public.users WHERE auth_id = auth.uid() LIMIT 1
  )
);
