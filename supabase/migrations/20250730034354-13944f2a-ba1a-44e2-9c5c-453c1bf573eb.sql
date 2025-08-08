-- Create test user roles and sample projects for existing authenticated users
-- First, ensure all authenticated users have basic roles
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT au.id, 'project_manager'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Create profiles for users who don't have them
INSERT INTO public.profiles (user_id, first_name, last_name)
SELECT DISTINCT au.id, 
  COALESCE(au.raw_user_meta_data->>'first_name', 'Test'), 
  COALESCE(au.raw_user_meta_data->>'last_name', 'User')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create sample projects for the authenticated users
INSERT INTO public.projects (name, description, status, start_date, end_date, created_by) 
SELECT 
  'Website Redesign Project',
  'Complete redesign of company website with modern UI/UX',
  'active',
  '2024-01-01',
  '2024-06-30',
  au.id
FROM auth.users au
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.projects (name, description, status, start_date, end_date, created_by) 
SELECT 
  'Mobile App Development',
  'New mobile application for customer engagement',
  'active',
  '2024-02-01',
  '2024-08-31',
  au.id
FROM auth.users au
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.projects (name, description, status, start_date, end_date, created_by) 
SELECT 
  'Database Migration',
  'Migrate legacy systems to modern database architecture',
  'on_hold',
  '2024-03-01',
  '2024-05-31',
  au.id
FROM auth.users au
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add project members (make the creator the owner)
INSERT INTO public.project_members (project_id, user_id, role)
SELECT p.id, p.created_by, 'owner'
FROM public.projects p
LEFT JOIN public.project_members pm ON p.id = pm.project_id AND p.created_by = pm.user_id
WHERE pm.id IS NULL
ON CONFLICT DO NOTHING;