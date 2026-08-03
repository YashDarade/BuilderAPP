-- Fix: backfill auth_id + add simpler RLS policy for org member visibility

-- 1. Backfill auth_id from auth.users for all public.users
UPDATE users SET auth_id = au.id
FROM auth.users au
WHERE users.email = au.email AND users.auth_id IS NULL;

-- 2. Drop the broken subquery policy and replace with a simpler one
DROP POLICY IF EXISTS "Org members can view each other" ON users;

-- New policy: users can see anyone in the same org (uses auth_id subquery, with email fallback)
CREATE POLICY "Org members can view each other" ON users
  FOR SELECT USING (
    org_id IS NOT NULL AND org_id IN (
      SELECT u.org_id FROM users u
      WHERE u.auth_id = auth.uid()
         OR u.email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
    )
  );
