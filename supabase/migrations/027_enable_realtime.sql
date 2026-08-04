-- Migration 027: Enable Supabase Realtime on all tables
-- This allows the frontend to subscribe to real-time changes

-- Add all tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE materials;
ALTER PUBLICATION supabase_realtime ADD TABLE site_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE progress_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE roadmaps;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE bill_scans;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
