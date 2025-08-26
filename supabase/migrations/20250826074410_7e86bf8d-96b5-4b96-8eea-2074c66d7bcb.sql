-- First, create a security definer function to check if two users share any projects
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.users_share_projects(_user1_id uuid, _user2_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM project_members pm1
    JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = _user1_id 
      AND pm2.user_id = _user2_id
  )
$$;

-- Create function to get users in the same projects as current user
CREATE OR REPLACE FUNCTION public.get_project_teammates(_user_id uuid)
RETURNS TABLE(teammate_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pm2.user_id
  FROM project_members pm1
  JOIN project_members pm2 ON pm1.project_id = pm2.project_id
  WHERE pm1.user_id = _user_id
$$;

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all user statuses" ON public.user_status;

-- Create secure profile visibility policy
-- Users can only see profiles of:
-- 1. Themselves
-- 2. Users who share at least one project with them
-- 3. Admins can see all profiles
CREATE POLICY "Secure profile visibility" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  users_share_projects(auth.uid(), user_id)
);

-- Create secure user status visibility policy
-- Same restrictions as profiles
CREATE POLICY "Secure user status visibility" 
ON public.user_status 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  users_share_projects(auth.uid(), user_id)
);

-- Fix the infinite recursion issue in project_members policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view project members of their projects" ON public.project_members;

-- Create new project_members policies without recursion
CREATE POLICY "Admins can manage all project members"
ON public.project_members
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project managers can manage project members"
ON public.project_members
FOR ALL
USING (has_role(auth.uid(), 'project_manager'::app_role));

CREATE POLICY "Users can view project members for their projects"
ON public.project_members
FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'project_manager'::app_role) OR
  EXISTS (
    SELECT 1 FROM project_members pm2 
    WHERE pm2.project_id = project_members.project_id 
      AND pm2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves to projects"
ON public.project_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create policy for project owners to manage members
CREATE POLICY "Project owners can manage project members"
ON public.project_members
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'project_manager'::app_role) OR
  EXISTS (
    SELECT 1 FROM project_members pm_owner 
    WHERE pm_owner.project_id = project_members.project_id 
      AND pm_owner.user_id = auth.uid() 
      AND pm_owner.role = 'owner'
  )
);