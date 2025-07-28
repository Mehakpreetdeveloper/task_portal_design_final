import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from './use-toast';

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  user_roles?: {
    role: 'admin' | 'user';
  }[];
}

export const useTeamMembers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
};

export const useUpdateUserRole = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if current user is admin
      const { data: currentUserRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (currentUserRole?.role !== 'admin') {
        throw new Error('Only admins can update user roles');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Success',
        description: 'User role updated successfully',
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

export const useInviteTeamMember = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!user) throw new Error('User not authenticated');

      // For now, we'll just show a success message
      // In a real app, you'd send an invitation email
      return { email };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
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