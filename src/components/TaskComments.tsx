import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';

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
  const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('below');
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
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('user_id')
        .eq('task_id', taskId);

      const assignedUserIds = assignments?.map(a => a.user_id) || [];
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'project_manager']);

      const adminUserIds = adminRoles?.map(r => r.user_id) || [];
      const allMentionableIds = [...new Set([...assignedUserIds, ...adminUserIds])];

      if (allMentionableIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name')
          .in('user_id', allMentionableIds);

        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', allMentionableIds);

        const usersWithRoles = (profiles || []).map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          return {
            ...profile,
            primary_role: userRole?.role || 'user',
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

    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowMentionDropdown(true);

      // Calculate the position of the dropdown
      const textarea = textareaRef.current;
      if (textarea) {
        const textareaBottom = textarea.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;

        if (windowHeight - textareaBottom < 200) {
          // Not enough space below, show above the textarea
          setDropdownPosition('above');
        } else {
          // Enough space, show below the textarea
          setDropdownPosition('below');
        }
      }
    } else {
      setShowMentionDropdown(false);
      setMentionSearch('');
    }
  };

  const handleMentionSelect = (selectedUser: MentionableUser) => {
    const textBeforeCursor = newComment.substring(0, cursorPosition);
    const textAfterCursor = newComment.substring(cursorPosition);

    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex !== -1) {
      const beforeAt = textBeforeCursor.substring(0, atIndex);
      const mentionText = `@${selectedUser.first_name} ${selectedUser.last_name}`;
      const newText = beforeAt + mentionText + ' ' + textAfterCursor;

      setNewComment(newText);
      setShowMentionDropdown(false);
      setMentionSearch('');

      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeAt.length + mentionText.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MessageCircle className="mr-2 h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Feed */}
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-center space-x-3 p-2 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.profiles.avatar_url || ''} />
                <AvatarFallback className="text-xs">
                  {comment.profiles.first_name?.[0]?.toUpperCase()}{comment.profiles.last_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {comment.profiles.first_name} {comment.profiles.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-black">
                  {comment.comment.split(' ').map((word, idx) => {
                    if (word.startsWith('@')) {
                      return (
                        <span key={idx} className="text-blue-500 font-bold">
                          {word}
                        </span>
                      );
                    }
                    return word + ' ';
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add a Comment */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Add a comment..."
              rows={3}
              required
            />
            {showMentionDropdown && mentionSearch && (
              <div className={`absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-md max-h-60 overflow-y-auto ${dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                {mentionableUsers
                  .filter(user =>
                    `${user.first_name} ${user.last_name}`
                      .toLowerCase()
                      .includes(mentionSearch.toLowerCase())
                  )
                  .map(user => (
                    <div
                      key={user.id}
                      className="cursor-pointer p-2 hover:bg-gray-100"
                      onClick={() => handleMentionSelect(user)}
                    >
                      {user.first_name} {user.last_name}
                    </div>
                  ))}
              </div>
            )}
            <div className="absolute z-10 right-2 bottom-2">
              <Button type="submit" disabled={submitting || !newComment.trim()}>
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskComments;
