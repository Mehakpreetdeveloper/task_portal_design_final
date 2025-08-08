-- Create sample projects and tasks that work with existing authenticated users
-- This migration will work with any existing users in your system

-- Create some sample projects (only if there are existing users)
INSERT INTO public.projects (name, description, status, start_date, end_date, created_by) 
SELECT 
  'Website Redesign Project' as name,
  'Complete redesign of company website with modern UI/UX' as description,
  'active' as status,
  '2024-01-01' as start_date,
  '2024-06-30' as end_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.projects (name, description, status, start_date, end_date, created_by) 
SELECT 
  'Mobile App Development' as name,
  'New mobile application for customer engagement' as description,
  'active' as status,
  '2024-02-01' as start_date,
  '2024-08-31' as end_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.projects (name, description, status, start_date, end_date, created_by) 
SELECT 
  'Database Migration' as name,
  'Migrate legacy systems to modern database architecture' as description,
  'active' as status,
  '2024-03-01' as start_date,
  '2024-05-31' as end_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create sample tasks (only if there are existing users)
INSERT INTO public.tasks (title, description, status, priority, due_date, created_by)
SELECT 
  'Design Homepage Layout' as title,
  'Create wireframes and mockups for the new homepage design' as description,
  'todo' as status,
  'high' as priority,
  '2024-02-15 10:00:00+00' as due_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.tasks (title, description, status, priority, due_date, created_by)
SELECT 
  'Setup Development Environment' as title,
  'Configure local development environment for mobile app' as description,
  'in_progress' as status,
  'medium' as priority,
  '2024-02-10 15:00:00+00' as due_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.tasks (title, description, status, priority, due_date, created_by)
SELECT 
  'Database Schema Design' as title,
  'Design new database schema for the migration project' as description,
  'done' as status,
  'urgent' as priority,
  '2024-01-25 12:00:00+00' as due_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.tasks (title, description, status, priority, due_date, created_by)
SELECT 
  'User Authentication Module' as title,
  'Implement secure user login and registration system' as description,
  'todo' as status,
  'high' as priority,
  '2024-03-01 09:00:00+00' as due_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.tasks (title, description, status, priority, due_date, created_by)
SELECT 
  'Content Migration Script' as title,
  'Write automated scripts to migrate existing content' as description,
  'in_progress' as status,
  'medium' as priority,
  '2024-02-20 14:00:00+00' as due_date,
  user_id as created_by
FROM public.profiles 
LIMIT 1
ON CONFLICT DO NOTHING;