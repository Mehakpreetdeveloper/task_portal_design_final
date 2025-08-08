import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, Reply } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useData } from "@/contexts/DataContext";
import { Comment } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { comments, users, addComment } = useData();
  const { toast } = useToast();
  const [showCommentForm, setShowCommentForm] = useState(false);

  const taskComments = comments.filter(comment => comment.taskId === taskId);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = (data: CommentFormData) => {
    // Extract mentions from comment content (simple @username detection)
    const mentionPattern = /@(\w+(?:\.\w+)*)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionPattern.exec(data.content)) !== null) {
      const username = match[1];
      const mentionedUser = users.find(user => 
        user.email.toLowerCase().includes(username.toLowerCase()) ||
        user.name.toLowerCase().replace(/\s+/g, '.').includes(username.toLowerCase())
      );
      if (mentionedUser) {
        mentions.push(mentionedUser.id);
      }
    }

    const newComment = {
      taskId,
      userId: "1", // Current user
      content: data.content,
      mentions,
      createdAt: new Date().toISOString(),
    };

    addComment(newComment);
    
    toast({
      title: "Comment added",
      description: mentions.length > 0 
        ? `Comment added with ${mentions.length} mention(s)` 
        : "Comment added successfully",
    });

    form.reset();
    setShowCommentForm(false);
  };

  const getUserById = (id: string) => users.find(user => user.id === id);

  const formatMentions = (content: string) => {
    const mentionPattern = /@(\w+(?:\.\w+)*)/g;
    return content.replace(mentionPattern, (match, username) => {
      const mentionedUser = users.find(user => 
        user.email.toLowerCase().includes(username.toLowerCase()) ||
        user.name.toLowerCase().replace(/\s+/g, '.').includes(username.toLowerCase())
      );
      
      if (mentionedUser) {
        return `<span class="text-primary font-medium bg-primary/10 px-1 rounded">@${mentionedUser.name}</span>`;
      }
      return match;
    });
  };

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Comments ({taskComments.length})</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            <Reply className="w-4 h-4 mr-2" />
            Add Comment
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Comment Form */}
        {showCommentForm && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Write your comment... Use @username to mention team members"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Tip: Use @email or @firstname.lastname to mention users
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowCommentForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
                        <Send className="w-3 h-3 mr-2" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {taskComments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            taskComments
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((comment) => {
                const user = getUserById(comment.userId);
                const mentionedUsers = comment.mentions.map(id => getUserById(id)).filter(Boolean);

                return (
                  <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={user?.photo} />
                      <AvatarFallback>
                        {user?.name.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{user?.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <div 
                        className="text-sm text-foreground"
                        dangerouslySetInnerHTML={{ __html: formatMentions(comment.content) }}
                      />
                      
                      {mentionedUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Mentioned:</span>
                          <div className="flex gap-1">
                            {mentionedUsers.map((mentionedUser) => (
                              <Avatar key={mentionedUser!.id} className="w-5 h-5">
                                <AvatarImage src={mentionedUser!.photo} />
                                <AvatarFallback className="text-xs">
                                  {mentionedUser!.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </CardContent>
    </Card>
  );
}