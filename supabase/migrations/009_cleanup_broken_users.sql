-- STEP 1: Delete ALL broken data
DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM budget_alerts WHERE project_id IN (SELECT id FROM projects WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com')));
DELETE FROM progress_reports WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM site_photos WHERE uploaded_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM expenses WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM materials WHERE project_id IN (SELECT id FROM projects WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com')));
DELETE FROM projects WHERE created_by IN (SELECT id FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com'));
DELETE FROM users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com');
DELETE FROM auth.users WHERE email IN ('admin@buildtrack.com', 'site@buildtrack.com', 'client@buildtrack.com');

NOTIFY pgrst, 'reload schema';
