-- Add missing fields to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add assignment description to task_assignments table
ALTER TABLE public.task_assignments 
ADD COLUMN IF NOT EXISTS assignment_description TEXT;

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for task attachments
CREATE POLICY "Users can view task attachments they have access to" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'task-attachments' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.task_assignments ta ON t.id = ta.task_id
      WHERE t.id::text = (storage.foldername(name))[2]
      AND (ta.user_id = auth.uid() OR t.created_by = auth.uid())
    )
  )
);

CREATE POLICY "Users can upload attachments to tasks they have access to" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'task-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.task_assignments ta ON t.id = ta.task_id
    WHERE t.id::text = (storage.foldername(name))[2]
    AND (ta.user_id = auth.uid() OR t.created_by = auth.uid())
  )
);

CREATE POLICY "Users can update their own attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'task-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete attachments from tasks they have access to" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'task-attachments' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[2]
      AND t.created_by = auth.uid()
    )
  )
);

-- Create task_attachments table to track file metadata
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on task_attachments
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for task_attachments
CREATE POLICY "Users can view attachments for tasks they have access to" 
ON public.task_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
    WHERE t.id = task_attachments.task_id
    AND (ta.user_id = auth.uid() OR t.created_by = auth.uid())
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can insert attachments for tasks they have access to" 
ON public.task_attachments 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tasks t
    LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
    WHERE t.id = task_attachments.task_id
    AND (ta.user_id = auth.uid() OR t.created_by = auth.uid())
  )
);

CREATE POLICY "Users can delete attachments they uploaded or for tasks they created" 
ON public.task_attachments 
FOR DELETE 
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_attachments.task_id
    AND t.created_by = auth.uid()
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);