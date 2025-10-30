import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Users, Calendar, CheckCircle, Clock, AlertCircle, ListTodo, X, Eye } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold';
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  primary_role?: string;
  user_roles?: any[];
};

type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  profiles: Profile;
};

const Projects = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isProjectManager } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [projectMembers, setProjectMembers] = useState<{[key: string]: ProjectMember[]}>({});
  const [projectTaskCounts, setProjectTaskCounts] = useState<{[key: string]: {total: number, completed: number, inProgress: number, todo: number}}>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  
  // Mock form data for details panel (no backend integration)
  const [detailsFormData, setDetailsFormData] = useState<{
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold';
    start_date: string;
    end_date: string;
    assigned_users: string[];
  }>({
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: '',
    assigned_users: [],
  });

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: 'active' | 'completed' | 'on_hold';
    start_date: string;
    end_date: string;
    assigned_users: string[];
  }>({
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: '',
    assigned_users: [],
  });

  const canCreateProjects = isAdmin || isProjectManager;

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data || []) as Project[]);
      
      // Fetch members and task counts for each project
      if (data && data.length > 0) {
        await Promise.all([
          fetchProjectMembers(data as Project[]),
          fetchProjectTaskCounts(data as Project[])
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

  const fetchProjectMembers = async (projects: Project[]) => {
    try {
      const membersData: {[key: string]: ProjectMember[]} = {};
      for (const project of projects) {
        const { data: members } = await supabase
          .from('project_members')
          .select('id, project_id, user_id, role')
          .eq('project_id', project.id);
        
        if (members) {
          const membersWithProfiles = await Promise.all(
            members.map(async (member) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, user_id, first_name, last_name')
                .eq('user_id', member.user_id)
                .single();
              
              return {
                ...member,
                profiles: profile || { 
                  id: '', 
                  user_id: member.user_id, 
                  first_name: 'Unknown', 
                  last_name: 'User' 
                }
              };
            })
          );
          membersData[project.id] = membersWithProfiles;
        } else {
          membersData[project.id] = [];
        }
      }
      setProjectMembers(membersData);
    } catch (error: any) {
      console.error('Error fetching project members:', error.message);
    }
  };

  const fetchProjectTaskCounts = async (projects: Project[]) => {
    try {
      const taskCountsData: {[key: string]: {total: number, completed: number, inProgress: number, todo: number}} = {};
      
      for (const project of projects) {
        // Get all tasks linked to this project
        const { data: projectTasks } = await supabase
          .from('project_tasks')
          .select('task_id')
          .eq('project_id', project.id);

        if (projectTasks && projectTasks.length > 0) {
          const taskIds = projectTasks.map(pt => pt.task_id);
          
          // Get task details for these task IDs
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .in('id', taskIds);

          if (tasks) {
            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'done').length;
            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
            const todo = tasks.filter(t => t.status === 'todo').length;
            
            taskCountsData[project.id] = { total, completed, inProgress, todo };
          } else {
            taskCountsData[project.id] = { total: 0, completed: 0, inProgress: 0, todo: 0 };
          }
        } else {
          taskCountsData[project.id] = { total: 0, completed: 0, inProgress: 0, todo: 0 };
        }
      }
      
      setProjectTaskCounts(taskCountsData);
    } catch (error: any) {
      console.error('Error fetching project task counts:', error.message);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            description: formData.description,
            status: formData.status,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          })
          .eq('id', editingProject.id);

        if (error) throw error;

        // Update project members - don't delete owner but update others
        // First get all current members except owner
        const { data: currentMembers } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', editingProject.id)
          .neq('role', 'owner');

        // Delete non-owner members
        if (currentMembers && currentMembers.length > 0) {
          const { error: deleteMembersError } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', editingProject.id)
            .neq('role', 'owner');

          if (deleteMembersError) throw deleteMembersError;
        }

        // Add new members (excluding owner if they're in the list)
        const ownerMember = await supabase
          .from('project_members')
          .select('user_id')
          .eq('project_id', editingProject.id)
          .eq('role', 'owner')
          .single();

        const ownerUserId = ownerMember.data?.user_id;
        const newMemberUserIds = formData.assigned_users.filter(userId => userId !== ownerUserId);

        if (newMemberUserIds.length > 0) {
          const memberInserts = newMemberUserIds.map(userId => ({
            project_id: editingProject.id,
            user_id: userId,
            role: 'member',
          }));

          const { error: assignError } = await supabase
            .from('project_members')
            .insert(memberInserts);

          if (assignError) throw assignError;
        }

        toast({
          title: 'Project Updated',
          description: 'Project has been successfully updated.',
        });
      } else {
        // Create new project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.name,
            description: formData.description,
            status: formData.status,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Add creator as project owner
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: projectData.id,
            user_id: user.id,
            role: 'owner',
          });

        if (memberError) throw memberError;

        // Add assigned users as members
        if (formData.assigned_users.length > 0) {
          const memberInserts = formData.assigned_users
            .filter(userId => userId !== user.id) // Don't duplicate the owner
            .map(userId => ({
              project_id: projectData.id,
              user_id: userId,
              role: 'member',
            }));

          if (memberInserts.length > 0) {
            const { error: assignError } = await supabase
              .from('project_members')
              .insert(memberInserts);

            if (assignError) throw assignError;
          }
        }

        toast({
          title: 'Project Created',
          description: 'Project has been successfully created.',
        });
      }

      fetchProjects();
      setDetailsPanelOpen(false);
      setEditingProject(null);
      setFormData({ 
        name: '', 
        description: '', 
        status: 'active',
        start_date: '',
        end_date: '',
        assigned_users: [],
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (project: Project) => {
    setDetailsProject(project);
    setEditingProject(project);
    // Get current project members to populate the form
    const currentMembers = projectMembers[project.id] || [];
    const memberUserIds = currentMembers.map(member => member.user_id);
    
    setDetailsFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      assigned_users: memberUserIds,
    });
    setDetailsPanelOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: 'Project Deleted',
        description: 'Project has been successfully deleted.',
      });

      fetchProjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      default:
        return 'default';
    }
  };

  const handleProjectClick = (project: Project) => {
    setDetailsProject(project);
    setDetailsFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      assigned_users: projectMembers[project.id]?.map(member => member.user_id) || [],
    });
    setDetailsPanelOpen(true);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock save - just show toast and close panel
    toast({
      title: 'Project Updated',
      description: 'Project details have been updated successfully.',
    });
    setDetailsPanelOpen(false);
  };

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
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your projects and collaborate with your team.
          </p>
        </div>
              <Button 
                onClick={() => {
                  setEditingProject(null);
                  setDetailsPanelOpen(true)
                  setDetailsFormData({ 
                    name: '', 
                    description: '', 
                    status: 'active',
                    start_date: '',
                    end_date: '',
                    assigned_users: [],
                  });
                }}
                className="w-full md:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
        {canCreateProjects && (
          <Dialog >
            <DialogTrigger asChild>

            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </DialogTitle>
                <DialogDescription>
                  {editingProject ? 'Update the project details.' : 'Create a new project to organize your tasks.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter project description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'completed' | 'on_hold') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign Users {editingProject ? '(Update Members)' : '(Optional)'}</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                    {users.map((userProfile) => (
                      <div key={userProfile.user_id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${userProfile.user_id}`}
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
                        <Label htmlFor={`user-${userProfile.user_id}`} className="text-sm">
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
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProject ? 'Update' : 'Create'} Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-sm text-muted-foreground">
                {canCreateProjects
                  ? 'Get started by creating your first project.'
                  : 'No projects have been created yet.'}
              </p>
              {canCreateProjects && (
                  <Button onClick={() => {
                    setEditingProject(null);
                    setFormData({ 
                      name: '', 
                      description: '', 
                      status: 'active',
                      start_date: '',
                      end_date: '',
                      assigned_users: [],
                    });
                    setDialogOpen(true);
                  }} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const taskCounts = projectTaskCounts[project.id] || { total: 0, completed: 0, inProgress: 0, todo: 0 };
            const progressPercentage = taskCounts.total > 0 ? Math.round((taskCounts.completed / taskCounts.total) * 100) : 0;
            
            return (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" 
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 min-w-0 flex-1">
                      <CardTitle className="text-base md:text-lg truncate">{project.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeColor(project.status)} className="text-xs">
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
                        </Badge>
                        {taskCounts.total > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {progressPercentage}% Complete
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 md:flex-row md:items-center md:space-y-0 md:space-x-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleEdit(project);
                       }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      {(isAdmin || isProjectManager) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[90vw] max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base">Delete Project</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Are you sure you want to delete this project? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                              <AlertDialogCancel className="w-full md:w-auto">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(project.id)}
                                className="w-full md:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {project.description && (
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Task Statistics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <ListTodo className="h-4 w-4" />
                        Tasks
                      </h4>
                      <span className="text-sm font-medium">{taskCounts.total}</span>
                    </div>
                    
                      <>
                        {/* Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>

                        {/* Task Status Breakdown */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950 p-2 rounded">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-green-700 dark:text-green-300">{taskCounts.completed}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 p-2 rounded">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-700 dark:text-blue-300">{taskCounts.inProgress}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-950 p-2 rounded">
                            <AlertCircle className="h-3 w-3 text-gray-600" />
                            <span className="text-gray-700 dark:text-gray-300">{taskCounts.todo}</span>
                          </div>
                        </div>
                      </>
                  </div>

                  {/* Project Dates */}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">Duration:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {project.start_date && (
                          <span>{new Date(project.start_date).toLocaleDateString()}</span>
                        )}
                        {project.start_date && project.end_date && (
                          <span className="mx-1">→</span>
                        )}
                        {project.end_date && (
                          <span>{new Date(project.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 pt-2 border-t">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="mr-1 h-3 w-3" />
                      <span className="truncate">Created {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedProject(project);
                         setMembersDialogOpen(true);
                       }}
                      className="h-7 text-xs w-full md:w-auto"
                    >
                      <Users className="mr-1 h-3 w-3" />
                      Members ({projectMembers[project.id]?.length || 0})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Members</DialogTitle>
            <DialogDescription>
              {selectedProject?.name} - Team members and their roles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedProject && projectMembers[selectedProject.id]?.length > 0 ? (
              projectMembers[selectedProject.id].map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {member.profiles.first_name} {member.profiles.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No members assigned to this project yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Details Panel */}
      {detailsPanelOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity duration-300"
            onClick={() => setDetailsPanelOpen(false)}
          />
          <div className={`fixed top-0 right-0 h-full !pb-[50px] !mt-[60px] w-[550px] max-w-full bg-background shadow-lg transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${detailsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
                  <p className="text-sm text-muted-foreground">
                    View and edit project information
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDetailsPanelOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="animate-in fade-in duration-300 delay-150">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="details-name">Project Name</Label>
                    <Input
                      id="details-name"
                      value={detailsFormData.name}
                      onChange={(e) => setDetailsFormData({ ...detailsFormData, name: e.target.value })}
                      placeholder="Enter project name"
                      className="text-base"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="details-description">Description</Label>
                    <Textarea
                      id="details-description"
                      value={detailsFormData.description}
                      onChange={(e) => setDetailsFormData({ ...detailsFormData, description: e.target.value })}
                      placeholder="Enter project description"
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="details-status">Status</Label>
                    <Select
                      value={detailsFormData.status}
                      onValueChange={(value: 'active' | 'completed' | 'on_hold') =>
                        setDetailsFormData({ ...detailsFormData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="details-start-date">Start Date</Label>
                      <Input
                        id="details-start-date"
                        type="date"
                        value={detailsFormData.start_date}
                        onChange={(e) => setDetailsFormData({ ...detailsFormData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="details-end-date">End Date</Label>
                      <Input
                        id="details-end-date"
                        type="date"
                        value={detailsFormData.end_date}
                        onChange={(e) => setDetailsFormData({ ...detailsFormData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Assign Users */}
<div className="space-y-2">
  <Label>Assigned Users</Label>
  <Select
    // keep dummy value so multi-select works
    value=""
    onValueChange={(value) => {
      if (detailsFormData.assigned_users.includes(value)) {
        setDetailsFormData({
          ...detailsFormData,
          assigned_users: detailsFormData.assigned_users.filter(
            (id) => id !== value
          ),
        });
      } else {
        setDetailsFormData({
          ...detailsFormData,
          assigned_users: [...detailsFormData.assigned_users, value],
        });
      }
    }}
  >
    <SelectTrigger className="w-full">
      <SelectValue
        placeholder={
          detailsFormData.assigned_users.length > 0
            ? users
                .filter((u) => detailsFormData.assigned_users.includes(u.user_id))
                .map((u) => `${u.first_name} ${u.last_name}`)
                .join(", ")
            : "Select users..."
        }
      />
    </SelectTrigger>

    <SelectContent className="max-h-64 overflow-y-auto">
      {users.map((userProfile) => (
        <SelectItem
          key={userProfile.user_id}
          value={userProfile.user_id}
          className="flex items-center"
        >
          <div className="flex items-center space-x-2 flex-1">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {userProfile.first_name?.charAt(0)}
              {userProfile.last_name?.charAt(0)}
            </div>
            <div className="text-sm flex-1">
              <span className="font-medium">
                {userProfile.first_name} {userProfile.last_name}
              </span>
              {userProfile.primary_role && (
                <div className="text-xs text-muted-foreground capitalize">
                  {userProfile.primary_role.replace("_", " ")}
                </div>
              )}
            </div>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>



                  {/* Actions */}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setDetailsPanelOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingProject ? 'Update' : 'Create'} Project
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Projects;