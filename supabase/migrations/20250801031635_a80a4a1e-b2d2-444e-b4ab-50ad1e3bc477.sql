-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true);

-- Add attachment_url column to tasks table
ALTER TABLE public.tasks ADD COLUMN attachment_url text;

-- Create storage policies for task attachments
CREATE POLICY "Users can view attachments in their projects" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'task-attachments' AND 
  EXISTS (
    SELECT 1 FROM tasks 
    JOIN projects ON projects.id = tasks.project_id 
    WHERE projects.user_id = auth.uid() 
    AND tasks.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can upload attachments to their project tasks" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'task-attachments' AND 
  EXISTS (
    SELECT 1 FROM tasks 
    JOIN projects ON projects.id = tasks.project_id 
    WHERE projects.user_id = auth.uid() 
    AND tasks.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can update attachments in their project tasks" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'task-attachments' AND 
  EXISTS (
    SELECT 1 FROM tasks 
    JOIN projects ON projects.id = tasks.project_id 
    WHERE projects.user_id = auth.uid() 
    AND tasks.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete attachments in their project tasks" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'task-attachments' AND 
  EXISTS (
    SELECT 1 FROM tasks 
    JOIN projects ON projects.id = tasks.project_id 
    WHERE projects.user_id = auth.uid() 
    AND tasks.id::text = (storage.foldername(name))[1]
  )
);