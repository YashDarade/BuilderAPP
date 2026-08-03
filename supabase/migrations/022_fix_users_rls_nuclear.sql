-- Nuclear fix: drop ALL policies on users, recreate cleanly

-- Drop all existing policies on users
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
  END LOOP;
END $$;

-- 1. Users can always see their own row
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- 2. Org members can see each other (uses auth_id match OR email match)
CREATE POLICY "Org members can view each other" ON users
  FOR SELECT USING (
    org_id IS NOT NULL
    AND (
      auth_id IN (SELECT au.id FROM auth.users au WHERE au.id = auth.uid())
      OR email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
    )
  );

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- 4. Owner can insert team members
CREATE POLICY "Owner can add team members" ON users
  FOR INSERT WITH CHECK (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- 5. Owner can update any org member
CREATE POLICY "Owner can update team members" ON users
  FOR UPDATE USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

-- 6. Owner can remove org members (not themselves)
CREATE POLICY "Owner can remove team members" ON users
  FOR DELETE USING (
    org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    AND auth_id != auth.uid()
  );
