-- PART 2: RLS Policies only
-- Run this AFTER Part 1 succeeds.

-- USERS
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Org members can view each other" ON users
  FOR SELECT USING (
    org_id IS NOT NULL AND org_id IN (
      SELECT org_id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Org owners can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- ORGANIZATIONS
CREATE POLICY "Owners can manage their org" ON organizations
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Members can view their org" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM users WHERE auth_id = auth.uid())
  );

-- PROJECTS
CREATE POLICY "Org owners can manage all projects" ON projects
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage assigned projects" ON projects
  FOR ALL USING (
    engineer_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Engineers can view org projects" ON projects
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view assigned projects" ON projects
  FOR SELECT USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Clients can view org projects" ON projects
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- SITE PHOTOS
CREATE POLICY "Org owners can manage all photos" ON site_photos
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org photos" ON site_photos
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org photos" ON site_photos
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- MATERIALS
CREATE POLICY "Org owners can manage all materials" ON materials
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org materials" ON materials
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org materials" ON materials
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- EXPENSES
CREATE POLICY "Org owners can manage all expenses" ON expenses
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org expenses" ON expenses
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org expenses" ON expenses
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- BUDGET ALERTS
CREATE POLICY "Org owners can manage budget alerts" ON budget_alerts
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Org members can view budget alerts" ON budget_alerts
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid())
  );

-- PROGRESS REPORTS
CREATE POLICY "Org owners can manage all reports" ON progress_reports
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org reports" ON progress_reports
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

CREATE POLICY "Clients can view org reports" ON progress_reports
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'client')
  );

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = (SELECT auth_id FROM users WHERE id = notifications.user_id));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = (SELECT auth_id FROM users WHERE id = notifications.user_id));

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- BILL SCANS
CREATE POLICY "Org owners can manage bill scans" ON bill_scans
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org bill scans" ON bill_scans
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

-- MATERIAL DETECTIONS
CREATE POLICY "Org owners can manage detections" ON material_detections
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Engineers can manage org detections" ON material_detections
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'site_engineer')
  );

-- AI INSIGHTS
CREATE POLICY "Org owners can manage insights" ON ai_insights
  FOR ALL USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Org members can view insights" ON ai_insights
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM users WHERE auth_id = auth.uid())
  );

SELECT 'PART 2 COMPLETE' as status;
