-- Insert some dummy test profiles and roles
-- Note: These UUIDs are examples - you'll need to replace them with actual user IDs from auth.users

-- First, let's create some sample profiles with dummy user IDs
-- You'll need to replace these UUIDs with real ones from your auth.users table
INSERT INTO public.profiles (user_id, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John', 'Doe'),
  ('22222222-2222-2222-2222-222222222222', 'Jane', 'Smith'),
  ('33333333-3333-3333-3333-333333333333', 'Mike', 'Johnson'),
  ('44444444-4444-4444-4444-444444444444', 'Sarah', 'Wilson'),
  ('55555555-5555-5555-5555-555555555555', 'David', 'Brown')
ON CONFLICT (user_id) DO NOTHING;

-- Add roles for these test users
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'project_manager'),
  ('33333333-3333-3333-3333-333333333333', 'user'),
  ('44444444-4444-4444-4444-444444444444', 'user'),
  ('55555555-5555-5555-5555-555555555555', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create some sample projects
INSERT INTO public.projects (name, description, status, start_date, end_date, created_by) VALUES
  ('Website Redesign', 'Complete redesign of company website', 'active', '2024-01-01', '2024-06-30', '11111111-1111-1111-1111-111111111111'),
  ('Mobile App Development', 'New mobile application for customers', 'active', '2024-02-01', '2024-08-31', '22222222-2222-2222-2222-222222222222'),
  ('Database Migration', 'Migrate legacy database to new system', 'active', '2024-03-01', '2024-05-31', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Add project members
INSERT INTO public.project_members (project_id, user_id, role) 
SELECT p.id, u.user_id, 
  CASE 
    WHEN u.user_id = p.created_by THEN 'owner'
    WHEN u.user_id = '22222222-2222-2222-2222-222222222222' THEN 'manager'
    ELSE 'member'
  END as role
FROM public.projects p
CROSS JOIN (
  SELECT user_id FROM public.profiles 
  WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
  )
) u
ON CONFLICT DO NOTHING;

-- Create some sample tasks
INSERT INTO public.tasks (title, description, status, priority, due_date, created_by) VALUES
  ('Design Homepage Layout', 'Create wireframes and mockups for new homepage', 'todo', 'high', '2024-02-15 10:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('Setup Development Environment', 'Configure local dev environment for mobile app', 'in_progress', 'medium', '2024-02-10 15:00:00+00', '22222222-2222-2222-2222-222222222222'),
  ('Database Schema Design', 'Design new database schema for migration', 'done', 'urgent', '2024-01-25 12:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('User Authentication Module', 'Implement user login and registration', 'todo', 'high', '2024-03-01 09:00:00+00', '22222222-2222-2222-2222-222222222222'),
  ('Content Migration Script', 'Write scripts to migrate existing content', 'in_progress', 'medium', '2024-02-20 14:00:00+00', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Link tasks to projects
INSERT INTO public.project_tasks (project_id, task_id)
SELECT p.id as project_id, t.id as task_id
FROM public.projects p, public.tasks t
WHERE (p.name = 'Website Redesign' AND t.title IN ('Design Homepage Layout', 'Database Schema Design'))
   OR (p.name = 'Mobile App Development' AND t.title IN ('Setup Development Environment', 'User Authentication Module'))
   OR (p.name = 'Database Migration' AND t.title IN ('Database Schema Design', 'Content Migration Script'))
ON CONFLICT DO NOTHING;

-- Assign tasks to users
INSERT INTO public.task_assignments (task_id, user_id, assigned_by, assignment_description)
SELECT t.id, 
  CASE t.title
    WHEN 'Design Homepage Layout' THEN '33333333-3333-3333-3333-333333333333'
    WHEN 'Setup Development Environment' THEN '44444444-4444-4444-4444-444444444444'
    WHEN 'Database Schema Design' THEN '22222222-2222-2222-2222-222222222222'
    WHEN 'User Authentication Module' THEN '33333333-3333-3333-3333-333333333333'
    WHEN 'Content Migration Script' THEN '55555555-5555-5555-5555-555555555555'
  END as user_id,
  t.created_by as assigned_by,
  CASE t.title
    WHEN 'Design Homepage Layout' THEN 'Please focus on mobile-first design'
    WHEN 'Setup Development Environment' THEN 'Use latest React Native version'
    WHEN 'Database Schema Design' THEN 'Ensure backwards compatibility'
    WHEN 'User Authentication Module' THEN 'Implement OAuth2 and JWT'
    WHEN 'Content Migration Script' THEN 'Test with small data sets first'
  END as assignment_description
FROM public.tasks t
ON CONFLICT DO NOTHING;