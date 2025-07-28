import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from './use-toast';

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  projects?: {
    id: string;
    name: string;
  };
  profiles?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface CreateTaskData {
  project_id: string;
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
}

export const useTasks = (projectId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', user?.id, projectId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          projects!inner(id, name, user_id)
        `)
        .eq('projects.user_id', user.id);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useCreateTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: task, error } = await supabase
        .from('tasks')
        .insert([{
          ...data,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return task as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskData }) => {
      const { data: task, error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return task as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};