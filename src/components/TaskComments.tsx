import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, AtSign } from 'lucide-react';

type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    primary_role?: string;
  };
};

interface TaskCommentsProps {
  taskId: string;
}

type MentionableUser = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  primary_role: string;
};

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
    fetchMentionableUsers();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (commentsData && commentsData.length > 0) {
        // Fetch user profiles and roles for each comment
        const commentsWithProfiles = await Promise.all(
          commentsData.map(async (comment) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, user_id, first_name, last_name, avatar_url')
              .eq('user_id', comment.user_id)
              .single();

            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', comment.user_id);

            const primaryRole = userRoles && userRoles.length > 0 ? userRoles[0].role : 'user';

            return {
              ...comment,
              profiles: profile ? {
                ...profile,
                primary_role: primaryRole
              } : {
                id: '',
                user_id: comment.user_id,
                first_name: 'Unknown',
                last_name: 'User',
                avatar_url: null,
                primary_role: 'user'
              }
            };
          })
        );

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to load comments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMentionableUsers = async () => {
    try {
      // Get task assignments
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('user_id')
        .eq('task_id', taskId);

      const assignedUserIds = assignments?.map(a => a.user_id) || [];

      // Get all admins and project managers
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'project_manager']);

      const adminUserIds = adminRoles?.map(r => r.user_id) || [];

      // Combine all mentionable user IDs
      const allMentionableIds = [...new Set([...assignedUserIds, ...adminUserIds])];

      if (allMentionableIds.length > 0) {
        // Fetch profiles for all mentionable users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name')
          .in('user_id', allMentionableIds);

        // Fetch roles for these users
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', allMentionableIds);

        const usersWithRoles = (profiles || []).map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          return {
            ...profile,
            primary_role: userRole?.role || 'user'
          };
        });

        setMentionableUsers(usersWithRoles);
      }
    } catch (error: any) {
      console.error('Error fetching mentionable users:', error.message);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setNewComment(value);
    setCursorPosition(cursorPos);
    
    // Check if user is typing @ for mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
      setMentionSearch('');
    }
  };

  const handleMentionSelect = (selectedUser: MentionableUser) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);
    
    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const beforeAt = textBeforeCursor.substring(0, atIndex);
      const mentionText = `@${selectedUser.first_name} ${selectedUser.last_name}`;
      const newText = beforeAt + mentionText + ' ' + textAfterCursor;
      
      setNewComment(newText);
      setShowMentionDropdown(false);
      setMentionSearch('');
      
      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeAt.length + mentionText.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const parseCommentWithMentions = (comment: string) => {
    // Simple parsing - highlight @mentions
    const parts = comment.split(/(@[A-Za-z\s]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
            <AtSign className="h-3 w-3 mr-1" />
            {part.substring(1)}
          </span>
        );
      }
      return part;
    });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last || 'U';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'project_manager':
        return 'default';
      case 'team_lead':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredMentionableUsers = mentionableUsers?.filter(user => {
    if (!mentionSearch) return true;
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().trim();
    return fullName.includes(mentionSearch.toLowerCase());
  }) || [];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <MessageCircle className="mr-2 h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageCircle className="mr-2 h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment form */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Add a comment... (Type @ to mention someone)"
              rows={3}
              required
            />
            
            {/* Mention Dropdown */}
            {showMentionDropdown && filteredMentionableUsers.length > 0 && (
              <div className="absolute z-50 mt-1 w-64 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                <div className="p-2 border-b text-xs text-muted-foreground">
                  Select a user to mention:
                </div>
                <div className="p-1">
                  {filteredMentionableUsers.map((mentionUser) => (
                    <div
                      key={mentionUser.user_id}
                      onClick={() => handleMentionSelect(mentionUser)}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(mentionUser.first_name, mentionUser.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {mentionUser.first_name} {mentionUser.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {mentionUser.primary_role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 p-4 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profiles.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.profiles.first_name, comment.profiles.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {comment.profiles.first_name} {comment.profiles.last_name}
                    </span>
                    <Badge variant={getRoleBadgeVariant(comment.profiles.primary_role || 'user')} className="text-xs">
                      {comment.profiles.primary_role?.replace('_', ' ') || 'user'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed">
                    {parseCommentWithMentions(comment.comment)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskComments;