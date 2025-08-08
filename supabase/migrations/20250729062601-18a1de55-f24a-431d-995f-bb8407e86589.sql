-- Fix infinite recursion by using security definer functions
-- First, create helper functions to check project membership without circular references

CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner_or_manager(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = _project_id AND user_id = _user_id AND role IN ('owner', 'manager')
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view projects they're members of" ON public.projects;
DROP POLICY IF EXISTS "Project owners, managers and admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can view project tasks for their projects" ON public.project_tasks;
DROP POLICY IF EXISTS "Project members can manage project tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can view task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can manage task assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON public.project_members;

-- Create simplified policies using security definer functions

-- Projects policies
CREATE POLICY "Users can view projects they're members of" ON public.projects
  FOR SELECT USING (
    public.is_project_member(id, auth.uid()) OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'project_manager')
  );

CREATE POLICY "Project owners, managers and admins can update projects" ON public.projects
  FOR UPDATE USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'project_manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.is_project_owner_or_manager(id, auth.uid())
  );

CREATE POLICY "Admins and project managers can delete projects" ON public.projects
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'project_manager') OR
    created_by = auth.uid()
  );

-- Tasks policies  
CREATE POLICY "Users can view tasks in their projects" ON public.tasks
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.task_assignments ta
      WHERE ta.task_id = tasks.id AND ta.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.project_tasks pt
      WHERE pt.task_id = tasks.id AND public.is_project_member(pt.project_id, auth.uid())
    ) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete tasks they created or admins" ON public.tasks
  FOR DELETE USING (
    created_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'project_manager')
  );

-- Project tasks policies
CREATE POLICY "Users can view project tasks for their projects" ON public.project_tasks
  FOR SELECT USING (
    public.is_project_member(project_id, auth.uid()) OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Project members can manage project tasks" ON public.project_tasks
  FOR ALL USING (
    public.is_project_member(project_id, auth.uid()) OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'project_manager')
  );

-- Task assignments policies
CREATE POLICY "Users can view task assignments" ON public.task_assignments
  FOR SELECT USING (
    user_id = auth.uid() OR
    assigned_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.project_tasks pt
      WHERE pt.task_id = task_assignments.task_id AND public.is_project_member(pt.project_id, auth.uid())
    )
  );

CREATE POLICY "Users can manage task assignments" ON public.task_assignments
  FOR ALL USING (
    assigned_by = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'project_manager')
  );

-- Project members policies (simplified to avoid recursion)
CREATE POLICY "Users can view project members of their projects" ON public.project_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin') OR
    project_id IN (
      SELECT project_id FROM public.project_members pm2 
      WHERE pm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners and admins can manage members" ON public.project_members
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'project_manager') OR
    project_id IN (
      SELECT project_id FROM public.project_members pm2 
      WHERE pm2.user_id = auth.uid() AND pm2.role = 'owner'
    )
  );