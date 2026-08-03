-- Team Management: tighten RLS on users table
-- Run this in Supabase SQL Editor

-- Drop the open INSERT policy (security risk)
DROP POLICY IF EXISTS "Org owners can insert users" ON users;

-- Owner can insert users into their org
CREATE POLICY "Owner can add team members" ON users
  FOR INSERT WITH CHECK (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- Owner can update any org member's role/info
CREATE POLICY "Owner can update team members" ON users
  FOR UPDATE USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- Owner can remove org members (but not themselves)
CREATE POLICY "Owner can remove team members" ON users
  FOR DELETE USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    AND auth_id != auth.uid()
  );
