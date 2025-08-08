-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can manage task assignments" ON public.task_assignments;

-- Create a simpler policy without self-referencing queries
CREATE POLICY "Users can manage task assignments" 
ON public.task_assignments 
FOR ALL 
USING (
  (assigned_by = auth.uid()) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'project_manager'::app_role) OR 
  has_role(auth.uid(), 'team_lead'::app_role) OR 
  (user_id = auth.uid())
);