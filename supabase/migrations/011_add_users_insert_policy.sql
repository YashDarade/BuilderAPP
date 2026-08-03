-- Users table policies

-- Allow authenticated users to insert their own profile (auth_id matches their auth uid)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = auth_id
    OR get_user_role() = 'admin'
  );

-- Existing policies remain (SELECT, UPDATE)
-- Users can view own profile
-- Users can update own profile
