import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Calendar as CalendarIcon, User, Flag, Edit, Trash2, MoreVertical, Paperclip, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TaskForm } from '@/components/forms/TaskForm';
import { TaskCalendar } from '@/components/calendar/TaskCalendar';
import { useTasks, useDeleteTask } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';

const Tasks = () => {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();

  const filteredTasks = tasks.filter(task => {
    const matchesProject = selectedProject === 'all' || task.project_id === selectedProject;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === 'all' || task.status === activeTab;
    
    return matchesProject && matchesSearch && matchesStatus;
  });

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask.mutateAsync(taskId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      todo: "outline",
      in_progress: "default",
      completed: "secondary",
    };
    const labels: Record<string, string> = {
      todo: "To Do",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "outline",
      medium: "secondary",
      high: "destructive",
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  const getTaskCountByStatus = (status: string) => {
    if (status === 'all') return filteredTasks.length;
    return filteredTasks.filter(task => task.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading tasks...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const TaskCard = ({ task }: { task: typeof filteredTasks[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {task.projects?.name || 'No project'}
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {getPriorityBadge(task.priority)}
            {getStatusBadge(task.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <TaskForm
                  task={task}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                  }
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Task
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteTask(task.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{task.description || 'No description'}</p>
        
        {task.attachment_url && (
          <div className="mb-4">
            <a 
              href={task.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <Paperclip className="h-4 w-4" />
              <span>View Attachment</span>
              <Download className="h-3 w-3" />
            </a>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <User className="mr-1 h-4 w-4" />
            {task.profiles?.full_name || task.profiles?.email || 'Unassigned'}
          </div>
          {task.due_date && (
            <div className="flex items-center">
              <CalendarIcon className="mr-1 h-4 w-4" />
              Due {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
              <p className="text-muted-foreground">Manage and track your tasks across projects</p>
            </div>
            <TaskForm />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({getTaskCountByStatus('all')})</TabsTrigger>
              <TabsTrigger value="todo">To Do ({getTaskCountByStatus('todo')})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({getTaskCountByStatus('in_progress')})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({getTaskCountByStatus('completed')})</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {filteredTasks.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedProject !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Create your first task to get started'
                      }
                    </p>
                    <TaskForm />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="todo" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.filter(task => task.status === 'todo').map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="in_progress" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.filter(task => task.status === 'in_progress').map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.filter(task => task.status === 'completed').map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <TaskCalendar />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Tasks;