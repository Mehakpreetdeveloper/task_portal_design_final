import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardFooter,CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, CheckCircle, Circle, Calendar, User, Users, Paperclip, X, Download, MessageCircle, LayoutGrid, List, Eye, Building, ChevronDown, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import TaskComments from '@/components/TaskComments';

type Subtask = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_users: string[];
  completed: boolean;
};

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
  project_id: string | null;
  project?: Project;
  subtasks?: Subtask[];
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
  const [taskProjects, setTaskProjects] = useState<{[key: string]: Project}>({});
  const [taskAssignments, setTaskAssignments] = useState<{[key: string]: TaskAssignment[]}>({});
  const [taskAttachments, setTaskAttachments] = useState<{[key: string]: TaskAttachment[]}>({});
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<string | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [panelActiveTab, setPanelActiveTab] = useState<'view' | 'edit' | 'comments'>('view');
  
  // Subtask states
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<{[key: string]: string}>({});
  const [editingSubtask, setEditingSubtask] = useState<{taskId: string, subtaskId: string, title: string} | null>(null);
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [editingSubtaskDetails, setEditingSubtaskDetails] = useState<{taskId: string, subtask: Subtask} | null>(null);
  
  // Filter states
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignedUser, setFilterAssignedUser] = useState<string>('all');
  
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto"; 
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [drawerOpen]);

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
      
      // Load subtasks from localStorage
      const tasksWithSubtasks = (data || []).map(task => {
        const storedSubtasks = localStorage.getItem(`subtasks_${task.id}`);
        return {
          ...task,
          subtasks: storedSubtasks ? JSON.parse(storedSubtasks) : []
        };
      });
      
      setTasks(tasksWithSubtasks as Task[]);
      
      // Fetch assignments, attachments, and projects for each task
      if (data && data.length > 0) {
        await Promise.all([
          fetchTaskAssignments(data.map(t => t.id)),
          fetchTaskAttachments(data.map(t => t.id)),
          fetchTaskProjects(data.filter(t => (t as any).project_id).map(t => (t as any).project_id))
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

  const fetchTaskProjects = async (projectIds: string[]) => {
    try {
      const uniqueProjectIds = [...new Set(projectIds.filter(Boolean))];
      if (uniqueProjectIds.length === 0) {
        setTaskProjects({});
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', uniqueProjectIds);

      if (error) throw error;

      const projectsMap: {[key: string]: Project} = {};
      (data || []).forEach(project => {
        projectsMap[project.id] = project;
      });
      
      setTaskProjects(projectsMap);
    } catch (error: any) {
      console.error('Error fetching task projects:', error.message);
      setTaskProjects({});
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

    // If editing a subtask, handle it differently
    if (editingSubtaskDetails) {
      try {
        const task = tasks.find(t => t.id === editingSubtaskDetails.taskId);
        if (!task) return;

        const updatedSubtasks = task.subtasks?.map(st =>
          st.id === editingSubtaskDetails.subtask.id
            ? {
                ...st,
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                due_date: formData.due_date || null,
                assigned_users: formData.assigned_users,
              }
            : st
        ) || [];

        // Save to localStorage
        localStorage.setItem(`subtasks_${editingSubtaskDetails.taskId}`, JSON.stringify(updatedSubtasks));

        toast({
          title: 'Subtask Updated',
          description: 'Subtask has been successfully updated.',
        });

        fetchTasks();
        setDrawerOpen(false);
        setEditingSubtaskDetails(null);
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
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    // If creating a subtask, handle it differently
    if (parentTaskId) {
      const title = formData.title.trim();
      if (!title) return;

      try {
        const task = tasks.find(t => t.id === parentTaskId);
        if (!task) return;

        const newSubtask: Subtask = {
          id: crypto.randomUUID(),
          title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
          assigned_users: formData.assigned_users,
          completed: false
        };

        const updatedSubtasks = [...(task.subtasks || []), newSubtask];
        
        // Save to localStorage
        localStorage.setItem(`subtasks_${parentTaskId}`, JSON.stringify(updatedSubtasks));

        toast({
          title: 'Subtask Added',
          description: 'Subtask has been successfully added.',
        });

        fetchTasks();
        setDrawerOpen(false);
        setParentTaskId(null);
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
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

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
      setParentTaskId(null);
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
    setEditingSubtaskDetails(null);
    setParentTaskId(null);
    setPanelActiveTab('view'); // Set to view tab by default when viewing a task
    
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

  const handleEditSubtask = (taskId: string, subtask: Subtask) => {
    setEditingSubtaskDetails({ taskId, subtask });
    setEditingTask(null);
    setParentTaskId(null);
    setPanelActiveTab('edit'); // Set to edit tab for subtasks
    
    setFormData({
      title: subtask.title,
      description: subtask.description || '',
      status: subtask.status,
      priority: subtask.priority,
      due_date: subtask.due_date ? subtask.due_date.split('T')[0] : '',
      project_ids: [],
      assigned_users: subtask.assigned_users || [],
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

  // Subtask management functions
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleAddSubtaskClick = (taskId: string) => {
    // Set the parent task ID and open the drawer
    setParentTaskId(taskId);
    setEditingTask(null);
    setPanelActiveTab('edit'); // Set to edit tab when adding subtask
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
  };

  const addSubtask = async (taskId: string) => {
    const title = newSubtaskTitle[taskId]?.trim();
    if (!title) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        title,
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: null,
        assigned_users: [],
        completed: false
      };

      const updatedSubtasks = [...(task.subtasks || []), newSubtask];
      
      // Save to localStorage
      localStorage.setItem(`subtasks_${taskId}`, JSON.stringify(updatedSubtasks));

      toast({
        title: 'Subtask Added',
        description: 'Subtask has been successfully added.',
      });

      setNewSubtaskTitle(prev => ({ ...prev, [taskId]: '' }));
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleSubtaskComplete = async (taskId: string, subtaskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedSubtasks = task.subtasks?.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ) || [];

      // Save to localStorage
      localStorage.setItem(`subtasks_${taskId}`, JSON.stringify(updatedSubtasks));

      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateSubtask = async (taskId: string, subtaskId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedSubtasks = task.subtasks?.map(st =>
        st.id === subtaskId ? { ...st, title: newTitle } : st
      ) || [];

      // Save to localStorage
      localStorage.setItem(`subtasks_${taskId}`, JSON.stringify(updatedSubtasks));

      toast({
        title: 'Subtask Updated',
        description: 'Subtask has been successfully updated.',
      });

      setEditingSubtask(null);
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedSubtasks = task.subtasks?.filter(st => st.id !== subtaskId) || [];

      // Save to localStorage
      localStorage.setItem(`subtasks_${taskId}`, JSON.stringify(updatedSubtasks));

      toast({
        title: 'Subtask Deleted',
        description: 'Subtask has been successfully deleted.',
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
      return (task as any).project_id === filterProject;
    }
    return true;
  });

  // Group tasks by project
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const projectId = (task as any).project_id || 'unassigned';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as {[key: string]: Task[]});

  // Sort projects: assigned projects first, then unassigned
  const sortedProjectIds = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'unassigned') return 1;
    if (b === 'unassigned') return -1;
    const projectA = taskProjects[a]?.name || '';
    const projectB = taskProjects[b]?.name || '';
    return projectA.localeCompare(projectB);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {hasRole('user') || isTeamLead ? 'My Tasks' : 'Tasks'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your tasks and track your progress.
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingTask(null);
            setParentTaskId(null);
            setEditingSubtaskDetails(null);
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
            setPanelActiveTab('edit');
            setDrawerOpen(true);
          }}
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Task Edit/Create Sliding Panel */}
      {drawerOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity duration-300"
            onClick={() => setDrawerOpen(false)}
          />
          <div className={`fixed top-0 right-0 h-full !pb-[50px] !mt-[60px] w-[850px] max-w-full bg-background shadow-lg transform transition-transform duration-300 ease-in-out z-50 overflow-hidden ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex h-full">


              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 pr-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {panelActiveTab === 'view' ? 'Task Details' : panelActiveTab === 'edit' ? (editingTask ? 'Edit Task' : editingSubtaskDetails ? 'Edit Subtask' : parentTaskId ? 'Add Subtask' : 'Create New Task') : 'Comments'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {panelActiveTab === 'view' ? 'View task information and details.' : panelActiveTab === 'edit' ? (editingTask ? 'Update the task details.' : editingSubtaskDetails ? 'Update the subtask details.' : parentTaskId ? 'Add a subtask to the parent task.' : 'Create a new task to track your work.') : 'View and add comments.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setDrawerOpen(false);
                          setModalOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="Expand to modal"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setDrawerOpen(false);
                          setParentTaskId(null);
                          setEditingSubtaskDetails(null);
                          setPanelActiveTab('view');
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="animate-in fade-in duration-300">
                {/* View Tab Content */}
                {panelActiveTab === 'view' && editingTask && (
                  <div className="space-y-6">
                    {/* Task Title */}
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">{editingTask.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={
                          editingTask.status === 'done' ? 'default' :
                          editingTask.status === 'in_progress' ? 'secondary' :
                          editingTask.status === 'in_review' ? 'outline' : 'outline'
                        }>
                          {editingTask.status === 'todo' ? 'To Do' :
                           editingTask.status === 'in_progress' ? 'In Progress' :
                           editingTask.status === 'in_review' ? 'In Review' : 'Done'}
                        </Badge>
                        <Badge variant={
                          editingTask.priority === 'urgent' ? 'destructive' :
                          editingTask.priority === 'high' ? 'default' :
                          editingTask.priority === 'medium' ? 'secondary' : 'outline'
                        }>
                          {editingTask.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    {editingTask.description && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">{editingTask.description}</p>
                      </div>
                    )}

                    {/* Due Date */}
                    {editingTask.due_date && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Due Date</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{new Date(editingTask.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Assigned Users */}
                    {taskAssignments[editingTask.id] && taskAssignments[editingTask.id].length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Assigned To</Label>
                        <div className="space-y-2">
                          {taskAssignments[editingTask.id].map((assignment) => (
                            <div key={assignment.id} className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {assignment.profiles.first_name} {assignment.profiles.last_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {taskAttachments[editingTask.id] && taskAttachments[editingTask.id].length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Attachments</Label>
                        <div className="space-y-2">
                          {taskAttachments[editingTask.id].map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-2 border rounded-lg">
                              <span className="text-sm truncate">{attachment.file_name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadAttachment(attachment)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Edit Button */}
                    <Button 
                      onClick={() => setPanelActiveTab('edit')}
                      className="w-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </Button>
                  </div>
                )}

                {/* Edit Tab Content */}
                {panelActiveTab === 'edit' && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{editingSubtaskDetails ? 'Subtask Title' : parentTaskId ? 'Subtask Title' : 'Task Title'}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={editingSubtaskDetails || parentTaskId ? "Enter subtask title" : "Enter task title"}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={parentTaskId ? "Enter subtask description" : "Enter task description"}
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
                  
                  {!editingTask && !parentTaskId && (
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

                  {!editingTask && !parentTaskId && (
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
                      <Button type="button" variant="outline" onClick={() => {
                        setDrawerOpen(false);
                        setParentTaskId(null);
                        setEditingSubtaskDetails(null);
                        setPanelActiveTab('view');
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploadingFiles}>
                        {uploadingFiles ? 'Uploading...' : editingSubtaskDetails ? 'Update Subtask' : parentTaskId ? 'Add Subtask' : editingTask ? 'Update Task' : 'Create Task'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Comments Tab Content */}
                {panelActiveTab === 'comments' && editingTask && !editingSubtaskDetails && (
                  <div className="animate-in fade-in duration-300">
                    <TaskComments taskId={editingTask.id} />
                  </div>
                )}
                </div>
              </div>
              {/* Left Sidebar for View/Edit/Comments Navigation */}
              <div className="w-16 border-r bg-muted/30 flex flex-col items-center py-6 gap-3">
                {/* Show View and Comments when in View tab */}
                {panelActiveTab === 'view' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelActiveTab('view')}
                      className={`w-12 h-12 p-0 rounded-lg transition-all ${
                        panelActiveTab === 'view' 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'hover:bg-muted'
                      }`}
                      title="View"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelActiveTab('comments')}
                      className="w-12 h-12 p-0 rounded-lg transition-all hover:bg-muted"
                      title="Comments"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </>
                )}
                
                {/* Show Edit and Comments when in Edit tab */}
                {panelActiveTab === 'edit' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelActiveTab('edit')}
                      className={`w-12 h-12 p-0 rounded-lg transition-all ${
                        panelActiveTab === 'edit' 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'hover:bg-muted'
                      }`}
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelActiveTab('comments')}
                      className="w-12 h-12 p-0 rounded-lg transition-all hover:bg-muted"
                      title="Comments"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {/* Show all three when in Comments tab */}
                {panelActiveTab === 'comments' && editingTask && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelActiveTab('view')}
                      className="w-12 h-12 p-0 rounded-lg transition-all hover:bg-muted"
                      title="View"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelActiveTab('edit')}
                      className="w-12 h-12 p-0 rounded-lg transition-all hover:bg-muted"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPanelActiveTab('comments')}
                      className={`w-12 h-12 p-0 rounded-lg transition-all ${
                        panelActiveTab === 'comments' 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'hover:bg-muted'
                      }`}
                      title="Comments"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
        </>
      )}

      {/* Modal View - Professional Two-Column Layout */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) {
          setTimeout(() => setDrawerOpen(true), 100);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden bg-background">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl font-semibold">
                    {formData.title || (editingTask ? 'Edit Task' : editingSubtaskDetails ? 'Edit Subtask' : parentTaskId ? 'Add Subtask' : 'Create New Task')}
                  </DialogTitle>
                  <Badge 
                    variant={
                      formData.status === 'done' ? 'default' :
                      formData.status === 'in_progress' ? 'secondary' :
                      formData.status === 'in_review' ? 'outline' : 'outline'
                    }
                  >
                    {formData.status === 'todo' ? 'To Do' :
                     formData.status === 'in_progress' ? 'In Progress' :
                     formData.status === 'in_review' ? 'In Review' : 'Done'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setModalOpen(false);
                    setTimeout(() => setDrawerOpen(true), 100);
                  }}
                  className="h-8 w-8 p-0"
                  title="Minimize to panel"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[calc(90vh-5rem)] overflow-hidden">
            {/* Left Section - Task Details */}
            <div className="lg:col-span-2 overflow-y-auto px-6 py-4 border-r">
              <form onSubmit={(e) => {
                handleSubmit(e);
                setModalOpen(false);
              }} id="task-form" className="space-y-6">
                {/* Key Info Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Assignee</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formData.assigned_users.length > 0 
                          ? `${formData.assigned_users.length} user${formData.assigned_users.length > 1 ? 's' : ''}`
                          : 'Not assigned'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Due Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formData.due_date || 'No due date'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 grid">
                    <Label className="text-xs text-muted-foreground font-medium">Priority</Label>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            formData.priority === 'urgent' ? 'destructive' :
                            formData.priority === 'high' ? 'default' :
                            formData.priority === 'medium' ? 'secondary' : 'outline'
                          }
                          className="capitalize h-4 w-16 text-muted-foreground text-white"
                        >
                          {formData.priority}
                        </Badge>
                      </div>
                  </div>
                  {/* <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground font-medium">Priority</Label>
                    <Badge 
                      variant={
                        formData.priority === 'urgent' ? 'destructive' :
                        formData.priority === 'high' ? 'default' :
                        formData.priority === 'medium' ? 'secondary' : 'outline'
                      }
                      className="capitalize"
                    >
                      {formData.priority}
                    </Badge>
                  </div> */}

                  {editingTask && editingTask.project_id && taskProjects[editingTask.project_id] && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium">Project</Label>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{taskProjects[editingTask.project_id].name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="modal-description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="modal-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Tabs for Details, Subtasks, Action Items */}
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="modal-title" className="text-sm font-medium">Task Title</Label>
                      <Input
                        id="modal-title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={editingSubtaskDetails || parentTaskId ? "Enter subtask title" : "Enter task title"}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="modal-status" className="text-sm font-medium">Status</Label>
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
                        <Label htmlFor="modal-priority" className="text-sm font-medium">Priority</Label>
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
                      <Label htmlFor="modal-due_date" className="text-sm font-medium">Due Date</Label>
                      <Input
                        id="modal-due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>

                    {!editingTask && !parentTaskId && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Assign to Projects (Optional)</Label>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2 bg-background">
                          {projects.map((project) => (
                            <div key={project.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`modal-project-${project.id}`}
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
                              <Label htmlFor={`modal-project-${project.id}`} className="text-sm cursor-pointer">
                                {project.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Assign to Users {editingTask ? '(Update Assignments)' : '(Required)'}
                      </Label>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-3 space-y-2 bg-background">
                        {users.map((userProfile) => (
                          <div key={userProfile.user_id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`modal-assign-user-${userProfile.user_id}`}
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
                            <Label htmlFor={`modal-assign-user-${userProfile.user_id}`} className="text-sm cursor-pointer">
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

                    {!editingTask && !parentTaskId && (
                      <div className="space-y-2">
                        <Label htmlFor="modal-assignment_description" className="text-sm font-medium">Assignment Note (Optional)</Label>
                        <Textarea
                          id="modal-assignment_description"
                          value={formData.assignment_description}
                          onChange={(e) => setFormData({ ...formData, assignment_description: e.target.value })}
                          placeholder="Add a note about this assignment"
                          rows={2}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="subtasks" className="space-y-4 mt-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Subtasks management coming soon</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="attachments" className="space-y-4 mt-4">
                    {editingTask && taskAttachments[editingTask.id] && taskAttachments[editingTask.id].length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Current Attachments</Label>
                        <div className="space-y-2">
                          {taskAttachments[editingTask.id].map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm truncate">{attachment.file_name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => downloadAttachment(attachment)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAttachment(attachment)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="modal-attachments" className="text-sm font-medium">Add Files</Label>
                      <Input
                        id="modal-attachments"
                        type="file"
                        multiple
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      />
                      {selectedFiles && selectedFiles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedFiles.length} new file(s) selected
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploadingFiles}>
                    {uploadingFiles ? 'Uploading...' : editingSubtaskDetails ? 'Update Subtask' : parentTaskId ? 'Add Subtask' : editingTask ? 'Update Task' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Right Section - Activity / Comments */}
            <div className="lg:col-span-1 overflow-y-auto bg-muted/30">
              <div className="p-4 border-b bg-background">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Activity
                </h3>
              </div>
              <div className="p-4">
                {editingTask && !editingSubtaskDetails ? (
                  <TaskComments taskId={editingTask.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Save the task to add comments</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
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
              <Label className="text-sm">Filter by Assigned User</Label>
              <Select value={filterAssignedUser} onValueChange={setFilterAssignedUser}>
                <SelectTrigger className="h-9">
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
              <Label className="text-sm">Filter by Project</Label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="h-9">
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
              <Button onClick={() => {
                setEditingTask(null);
                setParentTaskId(null);
                setEditingSubtaskDetails(null);
                setPanelActiveTab('edit');
                setDrawerOpen(true);
              }} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Project-grouped view with accordions
        <Card>
          <CardContent className="p-4 md:p-6">
            <Accordion type="multiple" className="w-full space-y-2">
              {sortedProjectIds.map((projectId) => {
                const projectTasks = groupedTasks[projectId];
                const projectName = projectId === 'unassigned' 
                  ? 'Unassigned Tasks' 
                  : taskProjects[projectId]?.name || 'Unknown Project';
                const taskCount = projectTasks.length;

                return (
                  <AccordionItem key={projectId} value={projectId} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center space-x-3">
                          <Building className="h-5 w-5 text-primary" />
                          <span className="text-base md:text-lg font-semibold">{projectName}</span>
                        </div>
                        <Badge variant="secondary" className="ml-auto mr-2">
                          {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2 pb-4">
                        {projectTasks.map((task) => (
                          <div key={task.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              {/* Task Info */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
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
                                    <h4 className={`text-sm md:text-base font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                      {task.title}
                                    </h4>
                                    {(canEdit || isCurrentUserAssigned(task.id)) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddSubtaskClick(task.id);
                                        }}
                                        className="p-0 h-5 w-5 hover:bg-primary/10"
                                        title="Add subtask"
                                      >
                                        <Plus className="h-4 w-4 text-primary" />
                                      </Button>
                                    )}
                                  </div>
                                  <Badge variant={getPriorityBadgeColor(task.priority)} className="text-xs">
                                    {task.priority}
                                  </Badge>
                                </div>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 ml-9">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 ml-9">
                                  {/* Status */}
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
                                      <SelectTrigger className="w-32 h-7 text-xs">
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
                                    <Badge variant={getStatusBadgeColor(task.status)} className="text-xs">
                                      {task.status.replace('_', ' ')}
                                    </Badge>
                                  )}

                                  {/* Assigned Users */}
                                  {taskAssignments[task.id] && taskAssignments[task.id].length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      <div className="flex flex-wrap gap-1">
                                        {taskAssignments[task.id].map((assignment) => (
                                          <Badge key={assignment.id} variant="outline" className="text-xs">
                                            {assignment.profiles.first_name} {assignment.profiles.last_name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Due Date */}
                                  {task.due_date && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Calendar className="mr-1 h-3 w-3" />
                                      {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                  )}

                                   {/* Attachments */}
                                  {taskAttachments[task.id] && taskAttachments[task.id].length > 0 && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Paperclip className="mr-1 h-3 w-3" />
                                      {taskAttachments[task.id].length} file(s)
                                    </div>
                                  )}

                                  {/* Subtasks indicator */}
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleTaskExpansion(task.id)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      {expandedTasks.has(task.id) ? (
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 mr-1" />
                                      )}
                                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                                    </Button>
                                  )}
                                </div>

                                {/* Subtasks section */}
                                {expandedTasks.has(task.id) && (
                                  <div className="ml-9 mt-3 space-y-2">
                                    {/* Existing subtasks */}
                                    {task.subtasks?.map((subtask) => (
                                      <div key={subtask.id} className="flex items-center gap-2 pl-4 border-l-2 border-muted">
                                        {editingSubtask?.subtaskId === subtask.id && editingSubtask?.taskId === task.id ? (
                                          <div className="flex-1 flex items-center gap-2">
                                            <Input
                                              value={editingSubtask.title}
                                              onChange={(e) => setEditingSubtask({ ...editingSubtask, title: e.target.value })}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  updateSubtask(task.id, subtask.id, editingSubtask.title);
                                                } else if (e.key === 'Escape') {
                                                  setEditingSubtask(null);
                                                }
                                              }}
                                              className="h-7 text-sm"
                                              autoFocus
                                            />
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => updateSubtask(task.id, subtask.id, editingSubtask.title)}
                                              className="h-7 px-2"
                                            >
                                              Save
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setEditingSubtask(null)}
                                              className="h-7 px-2"
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        ) : (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleSubtaskComplete(task.id, subtask.id)}
                                              className="p-0 h-5 w-5"
                                            >
                                              {subtask.completed ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                              ) : (
                                                <Circle className="h-4 w-4 text-muted-foreground" />
                                              )}
                                            </Button>
                                            <span 
                                              className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}
                                            >
                                              {subtask.title}
                                            </span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditSubtask(task.id, subtask)}
                                              className="h-6 w-6 p-0"
                                              title="View & Edit Subtask"
                                            >
                                              <Eye className="h-3 w-3" />
                                            </Button>
                                            {(canEdit || isCurrentUserAssigned(task.id)) && (
                                              <>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setEditingSubtask({ taskId: task.id, subtaskId: subtask.id, title: subtask.title })}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => deleteSubtask(task.id, subtask.id)}
                                                  className="h-6 w-6 p-0 text-destructive"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    ))}

                                    {/* Add new subtask */}
                                    {(canEdit || isCurrentUserAssigned(task.id)) && (
                                      <div className="flex items-center gap-2 pl-4 border-l-2 border-muted">
                                        <Input
                                          ref={(el) => {
                                            if (el && addingSubtaskFor === task.id) {
                                              el.focus();
                                            }
                                          }}
                                          placeholder="Add a subtask..."
                                          value={newSubtaskTitle[task.id] || ''}
                                          onChange={(e) => setNewSubtaskTitle(prev => ({ ...prev, [task.id]: e.target.value }))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              addSubtask(task.id);
                                            }
                                          }}
                                          className="h-7 text-sm"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => addSubtask(task.id)}
                                          disabled={!newSubtaskTitle[task.id]?.trim()}
                                          className="h-7 px-2"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(task)}
                                  title="View & Edit"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                {(canEdit || isCurrentUserAssigned(task.id)) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(task)}
                                    className="h-8 w-8 p-0"
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}

                                {canDelete && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Delete">
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
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Tasks;