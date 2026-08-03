-- Add INSERT policy for users table
-- Admins can insert profiles, and allow setup operations
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- Also allow any authenticated user to insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);
