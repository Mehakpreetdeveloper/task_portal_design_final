-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'project_manager', 'team_lead', 'user');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');

-- Create task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_tasks junction table (many-to-many)
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, task_id)
);

-- Create task_assignments table (many-to-many)
CREATE TABLE public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, assigned_to)
);

-- Create project_members table (many-to-many)
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, required_role app_role)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = required_role
  );
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT public.has_role(user_uuid, 'admin');
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for projects
CREATE POLICY "Users can view projects they're members of" ON public.projects FOR SELECT USING (
  public.is_admin(auth.uid()) OR 
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
);
CREATE POLICY "Project managers and admins can create projects" ON public.projects FOR INSERT WITH CHECK (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'project_manager')
);
CREATE POLICY "Project creators, managers and admins can update projects" ON public.projects FOR UPDATE USING (
  public.is_admin(auth.uid()) OR 
  public.has_role(auth.uid(), 'project_manager') OR
  created_by = auth.uid()
);
CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Users can view assigned tasks or project tasks" ON public.tasks FOR SELECT USING (
  public.is_admin(auth.uid()) OR
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.task_assignments WHERE task_id = id AND assigned_to = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.project_tasks pt 
    JOIN public.project_members pm ON pt.project_id = pm.project_id 
    WHERE pt.task_id = id AND pm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Task creators, assignees, team leads and admins can update tasks" ON public.tasks FOR UPDATE USING (
  public.is_admin(auth.uid()) OR
  public.has_role(auth.uid(), 'team_lead') OR
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.task_assignments WHERE task_id = id AND assigned_to = auth.uid())
);
CREATE POLICY "Task creators and admins can delete tasks" ON public.tasks FOR DELETE USING (
  public.is_admin(auth.uid()) OR 
  created_by = auth.uid()
);

-- RLS Policies for project_tasks
CREATE POLICY "Users can view project tasks for accessible projects" ON public.project_tasks FOR SELECT USING (
  public.is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND (
      p.created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p.id AND user_id = auth.uid())
    )
  )
);
CREATE POLICY "Project members can manage project tasks" ON public.project_tasks FOR ALL USING (
  public.is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND (
      p.created_by = auth.uid() OR
      public.has_role(auth.uid(), 'project_manager') OR
      public.has_role(auth.uid(), 'team_lead')
    )
  )
);

-- RLS Policies for task_assignments
CREATE POLICY "Users can view task assignments for accessible tasks" ON public.task_assignments FOR SELECT USING (
  public.is_admin(auth.uid()) OR
  assigned_to = auth.uid() OR
  assigned_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id AND t.created_by = auth.uid()
  )
);
CREATE POLICY "Task creators, team leads and admins can assign tasks" ON public.task_assignments FOR ALL USING (
  public.is_admin(auth.uid()) OR
  public.has_role(auth.uid(), 'team_lead') OR
  assigned_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id AND t.created_by = auth.uid()
  )
);

-- RLS Policies for project_members
CREATE POLICY "Users can view project members for accessible projects" ON public.project_members FOR SELECT USING (
  public.is_admin(auth.uid()) OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND p.created_by = auth.uid()
  )
);
CREATE POLICY "Project creators, managers and admins can manage members" ON public.project_members FOR ALL USING (
  public.is_admin(auth.uid()) OR
  public.has_role(auth.uid(), 'project_manager') OR
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id AND p.created_by = auth.uid()
  )
);

-- RLS Policies for task_comments
CREATE POLICY "Users can view comments for accessible tasks" ON public.task_comments FOR SELECT USING (
  public.is_admin(auth.uid()) OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id AND (
      t.created_by = auth.uid() OR
      EXISTS (SELECT 1 FROM public.task_assignments WHERE task_id = t.id AND assigned_to = auth.uid())
    )
  )
);
CREATE POLICY "Users can create comments on accessible tasks" ON public.task_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.tasks t 
      WHERE t.id = task_id AND (
        t.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.task_assignments WHERE task_id = t.id AND assigned_to = auth.uid())
      )
    )
  )
);
CREATE POLICY "Users can update their own comments" ON public.task_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Comment creators and admins can delete comments" ON public.task_comments FOR DELETE USING (
  public.is_admin(auth.uid()) OR 
  auth.uid() = user_id
);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();