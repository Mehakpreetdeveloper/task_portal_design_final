import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, CheckCircle, Circle, Calendar, User, Users, Paperclip, X, Download, MessageCircle, LayoutGrid, List } from 'lucide-react';
import TaskComments from '@/components/TaskComments';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  parent_task_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: string;
  name: string;
};

type Profile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  primary_role?: string;
  user_roles?: any[];
};

type TaskAssignment = {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by: string | null;
  assignment_description: string | null;
  created_at: string;
  profiles: Profile;
};

type TaskAttachment = {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string | null;
  created_at: string;
};

const Tasks = () => {
  const { user, isAdmin, isProjectManager, isTeamLead, hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<{[key: string]: TaskAssignment[]}>({});
  const [taskAttachments, setTaskAttachments] = useState<{[key: string]: TaskAttachment[]}>({});
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<string | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  
  // Filter states
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignedUser, setFilterAssignedUser] = useState<string>('all');
  
  // View states
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'in_review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string;
    project_ids: string[];
    assigned_users: string[];
    assignment_description: string;
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    project_ids: [],
    assigned_users: [],
    assignment_description: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
      
      // Fetch assignments and attachments for each task
      if (data && data.length > 0) {
        await Promise.all([
          fetchTaskAssignments(data.map(t => t.id)),
          fetchTaskAttachments(data.map(t => t.id))
        ]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskAssignments = async (taskIds: string[]) => {
    try {
      const assignmentsData: {[key: string]: TaskAssignment[]} = {};
      
      for (const taskId of taskIds) {
        const { data: assignments } = await supabase
          .from('task_assignments')
          .select('id, task_id, user_id, assigned_by, assignment_description, created_at')
          .eq('task_id', taskId);

        if (assignments) {
          const assignmentsWithProfiles = await Promise.all(
            assignments.map(async (assignment) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name')
                .eq('user_id', assignment.user_id)
                .single();
              
              return {
                ...assignment,
                profiles: profile || { 
                  id: '', 
                  user_id: assignment.user_id, 
                  first_name: 'Unknown', 
                  last_name: 'User' 
                }
              };
            })
          );
          assignmentsData[taskId] = assignmentsWithProfiles;
        } else {
          assignmentsData[taskId] = [];
        }
      }
      
      setTaskAssignments(assignmentsData);
    } catch (error: any) {
      console.error('Error fetching task assignments:', error.message);
    }
  };

  const fetchTaskAttachments = async (taskIds: string[]) => {
    try {
      const attachmentsData: {[key: string]: TaskAttachment[]} = {};
      
      for (const taskId of taskIds) {
        const { data: attachments } = await supabase
          .from('task_attachments')
          .select('*')
          .eq('task_id', taskId);

        attachmentsData[taskId] = attachments || [];
      }
      
      setTaskAttachments(attachmentsData);
    } catch (error: any) {
      console.error('Error fetching task attachments:', error.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch all users with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with their primary roles
      const usersWithRoles = (profilesData || []).map(profile => {
        const userRoles = (rolesData || []).filter(role => role.user_id === profile.user_id);
        const primaryRole = userRoles.length > 0 ? userRoles[0].role : 'user';
        
        return {
          ...profile,
          primary_role: primaryRole,
          user_roles: userRoles
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error.message);
    }
  };

  const uploadAttachments = async (taskId: string) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${taskId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save file metadata
        const { error: metadataError } = await supabase
          .from('task_attachments')
          .insert({
            task_id: taskId,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            content_type: file.type,
            uploaded_by: user!.id,
          });

        if (metadataError) throw metadataError;
      }

      toast({
        title: 'Files Uploaded',
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });
      
      setSelectedFiles(null);
      await fetchTaskAttachments([taskId]);
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.assigned_users.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one user must be assigned to the task.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
          })
          .eq('id', editingTask.id);

        if (error) throw error;

        // Update task assignments - first delete existing ones
        const { error: deleteAssignmentsError } = await supabase
          .from('task_assignments')
          .delete()
          .eq('task_id', editingTask.id);

        if (deleteAssignmentsError) throw deleteAssignmentsError;

        // Add new assignments
        if (formData.assigned_users.length > 0) {
          const assignments = formData.assigned_users.map(userId => ({
            task_id: editingTask.id,
            user_id: userId,
            assigned_by: user.id,
            assignment_description: null,
          }));

          const { error: assignError } = await supabase
            .from('task_assignments')
            .insert(assignments);

          if (assignError) throw assignError;
        }

        // Upload new attachments if any
        if (selectedFiles && selectedFiles.length > 0) {
          await uploadAttachments(editingTask.id);
        }

        toast({
          title: 'Task Updated',
          description: 'Task has been successfully updated.',
        });
      } else {
        // Create new task
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .insert({
            title: formData.title,
            description: formData.description,
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (taskError) throw taskError;

        // Link task to projects
        if (formData.project_ids.length > 0) {
          const projectLinks = formData.project_ids.map(projectId => ({
            project_id: projectId,
            task_id: taskData.id,
          }));

          const { error: linkError } = await supabase
            .from('project_tasks')
            .insert(projectLinks);

          if (linkError) throw linkError;
        }

        // Assign users to task
        const assignments = formData.assigned_users.map(userId => ({
          task_id: taskData.id,
          user_id: userId,
          assigned_by: user.id,
          assignment_description: formData.assignment_description || null,
        }));

        const { error: assignError } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (assignError) throw assignError;

        // Upload attachments if any
        if (selectedFiles && selectedFiles.length > 0) {
          await uploadAttachments(taskData.id);
        }

        toast({
          title: 'Task Created',
          description: 'Task has been successfully created.',
        });
      }

      fetchTasks();
      setDrawerOpen(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        project_ids: [],
        assigned_users: [],
        assignment_description: '',
      });
      setSelectedFiles(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    
    // Get current task assignments to populate the form
    const currentAssignments = taskAssignments[task.id] || [];
    const assignedUserIds = currentAssignments.map(assignment => assignment.user_id);
    
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      project_ids: [],
      assigned_users: assignedUserIds,
      assignment_description: '',
    });
    setSelectedFiles(null);
    setDrawerOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Task Deleted',
        description: 'Task has been successfully deleted.',
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: newStatus === 'done' ? 'Task Completed' : 'Task Reopened',
        description: `Task has been marked as ${newStatus === 'done' ? 'completed' : 'incomplete'}.`,
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const downloadAttachment = async (attachment: TaskAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Download Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteAttachment = async (attachment: TaskAttachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      toast({
        title: 'File Deleted',
        description: 'Attachment has been deleted successfully.',
      });

      await fetchTaskAttachments([attachment.task_id]);
    } catch (error: any) {
      toast({
        title: 'Delete Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'in_review':
        return 'secondary';
      case 'done':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Permission checks
  const canEdit = isAdmin || isProjectManager || isTeamLead;
  const canDelete = isAdmin || isProjectManager;
  
  const isCurrentUserAssigned = (taskId: string) => {
    return taskAssignments[taskId]?.some(assignment => assignment.user_id === user?.id);
  };
  
  const canUpdateStatus = (task: Task) => {
    return canEdit || task.created_by === user?.id || isCurrentUserAssigned(task.id);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus && filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterAssignedUser && filterAssignedUser !== 'all') {
      const taskAssigned = taskAssignments[task.id]?.some(
        assignment => assignment.user_id === filterAssignedUser
      );
      if (!taskAssigned) return false;
    }
    if (filterProject && filterProject !== 'all') {
      // This would require checking project_tasks table - simplified for now
      return true;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {hasRole('user') || isTeamLead ? 'My Tasks' : 'Tasks'}
          </h1>
          <p className="text-muted-foreground">
            Manage your tasks and track your progress.
          </p>
        </div>
        <Button onClick={() => {
          setEditingTask(null);
          setFormData({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            due_date: '',
            project_ids: [],
            assigned_users: [],
            assignment_description: '',
          });
          setSelectedFiles(null);
          setDrawerOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Task Edit/Create Sliding Panel */}
      {drawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />
          <div className={`fixed top-0 right-0 h-full w-[600px] max-w-full bg-background shadow-lg transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingTask ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingTask ? 'Update the task details.' : 'Create a new task to track your work.'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="animate-in fade-in duration-300 delay-150">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'todo' | 'in_progress' | 'in_review' | 'done') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              
              {!editingTask && (
                <div className="space-y-2">
                  <Label>Assign to Projects (Optional)</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`project-${project.id}`}
                          checked={formData.project_ids.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                project_ids: [...formData.project_ids, project.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                project_ids: formData.project_ids.filter(id => id !== project.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`project-${project.id}`} className="text-sm">
                          {project.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Assign to Users {editingTask ? '(Update Assignments)' : '(Required)'}
                </Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                  {users.map((userProfile) => (
                    <div key={userProfile.user_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`assign-user-${userProfile.user_id}`}
                        checked={formData.assigned_users.includes(userProfile.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              assigned_users: [...formData.assigned_users, userProfile.user_id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              assigned_users: formData.assigned_users.filter(id => id !== userProfile.user_id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`assign-user-${userProfile.user_id}`} className="text-sm">
                        <span className="font-medium">
                          {userProfile.first_name} {userProfile.last_name}
                        </span>
                        {userProfile.primary_role && (
                          <span className="ml-2 text-xs text-muted-foreground capitalize">
                            ({userProfile.primary_role.replace('_', ' ')})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {!editingTask && (
                <div className="space-y-2">
                  <Label htmlFor="assignment_description">Assignment Note (Optional)</Label>
                  <Textarea
                    id="assignment_description"
                    value={formData.assignment_description}
                    onChange={(e) => setFormData({ ...formData, assignment_description: e.target.value })}
                    placeholder="Add a note about this assignment"
                    rows={2}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments</Label>
                
                {editingTask && taskAttachments[editingTask.id] && taskAttachments[editingTask.id].length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Attachments</Label>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                      {taskAttachments[editingTask.id].map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{attachment.file_name}</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAttachment(attachment)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedFiles.length} new file(s) selected
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadingFiles}>
                  {uploadingFiles ? 'Uploading...' : editingTask ? 'Update' : 'Create'} Task
                </Button>
              </div>
            </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Assigned User</Label>
              <Select value={filterAssignedUser} onValueChange={setFilterAssignedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((userProfile) => (
                    <SelectItem key={userProfile.user_id} value={userProfile.user_id}>
                      {userProfile.first_name} {userProfile.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Project</Label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>View Mode</Label>
              <div className="flex space-x-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="flex-1"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Card
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No tasks yet</h3>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first task.
              </p>
              <Button onClick={() => setDrawerOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleComplete(task)}
                      className="p-0 h-6 w-6"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {canUpdateStatus(task) ? (
                          <Select
                            value={task.status}
                            onValueChange={async (newStatus: 'todo' | 'in_progress' | 'in_review' | 'done') => {
                              try {
                                const { error } = await supabase
                                  .from('tasks')
                                  .update({ status: newStatus })
                                  .eq('id', task.id);

                                if (error) throw error;

                                toast({
                                  title: 'Status Updated',
                                  description: `Task status changed to ${newStatus.replace('_', ' ')}.`,
                                });

                                fetchTasks();
                              } catch (error: any) {
                                toast({
                                  title: 'Error',
                                  description: error.message,
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="in_review">In Review</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getStatusBadgeColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        )}
                        <Badge variant={getPriorityBadgeColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Task Assignments */}
                      {taskAssignments[task.id] && taskAssignments[task.id].length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Assigned to:</div>
                          <div className="flex flex-wrap gap-2">
                            {taskAssignments[task.id].map((assignment) => (
                              <div key={assignment.id} className="flex items-center space-x-1 bg-muted p-1 rounded text-xs">
                                <User className="h-3 w-3" />
                                <span>{assignment.profiles.first_name} {assignment.profiles.last_name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task Attachments */}
                      {taskAttachments[task.id] && taskAttachments[task.id].length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">Attachments:</div>
                          <div className="flex flex-wrap gap-2">
                            {taskAttachments[task.id].map((attachment) => (
                              <div key={attachment.id} className="flex items-center space-x-2 bg-muted p-2 rounded text-xs">
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-24">{attachment.file_name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadAttachment(attachment)}
                                  className="h-4 w-4 p-0"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAttachment(attachment)}
                                  className="h-4 w-4 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          Created {new Date(task.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTaskForComments(task.id);
                        setCommentsDialogOpen(true);
                      }}
                      title="View Comments"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    {(canEdit || isCurrentUserAssigned(task.id)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this task? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(task.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Task</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Priority</th>
                    <th className="text-left p-4 font-medium">Assigned To</th>
                    <th className="text-left p-4 font-medium">Due Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleComplete(task)}
                            className="p-0 h-6 w-6"
                          >
                            {task.status === 'done' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <div>
                            <h4 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getPriorityBadgeColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {taskAssignments[task.id] && taskAssignments[task.id].length > 0 ? (
                            taskAssignments[task.id].map((assignment) => (
                              <div key={assignment.id} className="flex items-center space-x-1 bg-muted p-1 rounded text-xs">
                                <User className="h-3 w-3" />
                                <span>{assignment.profiles.first_name} {assignment.profiles.last_name}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {task.due_date ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No due date</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTaskForComments(task.id);
                              setCommentsDialogOpen(true);
                            }}
                            title="View Comments"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(task)}
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Delete Task">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this task? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(task.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Panel */}
      {commentsDialogOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
            onClick={() => setCommentsDialogOpen(false)}
          />
          <div className={`fixed top-0 right-0 h-full w-[500px] max-w-full bg-background shadow-lg transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${commentsDialogOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Task Comments</h2>
                  <p className="text-sm text-muted-foreground">
                    View and add comments for this task.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCommentsDialogOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="animate-in fade-in duration-300 delay-150">
                {selectedTaskForComments && (
                  <TaskComments taskId={selectedTaskForComments} />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Tasks;