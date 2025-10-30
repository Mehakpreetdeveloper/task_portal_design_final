import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  ArrowLeft, 
  LayoutGrid, 
  List as ListIcon, 
  Calendar, 
  Users, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle
} from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  created_at: string;
};

type TasksByStatus = {
  todo: Task[];
  in_progress: Task[];
  in_review: Task[];
  done: Task[];
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TasksByStatus>({
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchProjectTasks();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data as Project);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/projects');
    }
  };

  const fetchProjectTasks = async () => {
    try {
      setLoading(true);
      
      // Get task IDs linked to this project
      const { data: projectTasks, error: projectTasksError } = await supabase
        .from('project_tasks')
        .select('task_id')
        .eq('project_id', id);

      if (projectTasksError) throw projectTasksError;

      if (!projectTasks || projectTasks.length === 0) {
        setTasks({ todo: [], in_progress: [], in_review: [], done: [] });
        setLoading(false);
        return;
      }

      const taskIds = projectTasks.map(pt => pt.task_id);

      // Fetch task details
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .in('id', taskIds)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Group tasks by status
      const groupedTasks: TasksByStatus = {
        todo: [],
        in_progress: [],
        in_review: [],
        done: [],
      };

      (tasksData || []).forEach((task) => {
        groupedTasks[task.status].push(task);
      });

      setTasks(groupedTasks);
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

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = source.droppableId as keyof TasksByStatus;
    const destStatus = destination.droppableId as keyof TasksByStatus;

    // Create new tasks object
    const newTasks = { ...tasks };
    const [movedTask] = newTasks[sourceStatus].splice(source.index, 1);
    
    // Update task status
    movedTask.status = destStatus;
    newTasks[destStatus].splice(destination.index, 0, movedTask);

    setTasks(newTasks);

    // Update in database
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: destStatus })
        .eq('id', draggableId);

      if (error) throw error;

      toast({
        title: 'Task Updated',
        description: 'Task status has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      // Revert on error
      fetchProjectTasks();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-muted';
      case 'in_progress': return 'bg-blue-500/10';
      case 'in_review': return 'bg-yellow-500/10';
      case 'done': return 'bg-green-500/10';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Circle className="h-4 w-4 text-muted-foreground" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_review': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'in_review': return 'In Review';
      case 'done': return 'Done';
      default: return status;
    }
  };

  const renderKanbanView = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(['todo', 'in_progress', 'in_review', 'done'] as const).map((status) => (
          <div key={status} className="flex flex-col">
            <div className={`${getStatusColor(status)} rounded-t-lg p-3 border-b`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <h3 className="font-semibold text-sm">{getStatusTitle(status)}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {tasks[status].length}
                </Badge>
              </div>
            </div>

            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-2 space-y-2 min-h-[200px] rounded-b-lg border border-t-0 ${
                    snapshot.isDraggingOver ? 'bg-accent/50' : 'bg-card'
                  }`}
                >
                  {tasks[status].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`cursor-move transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <CardHeader className="p-3 pb-2">
                            <div className="space-y-2">
                              <CardTitle className="text-sm font-medium leading-tight">
                                {task.title}
                              </CardTitle>
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {task.priority}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );

  const renderListView = () => {
    const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.in_review, ...tasks.done];
    
    return (
      <div className="space-y-2">
        {allTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No tasks in this project yet.</p>
            </CardContent>
          </Card>
        ) : (
          allTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <h4 className="font-medium">{task.title}</h4>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getStatusTitle(task.status)}
                    </Badge>
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalTasks = tasks.todo.length + tasks.in_progress.length + tasks.in_review.length + tasks.done.length;
  const completedTasks = tasks.done.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/projects')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <ListIcon className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-base">
              {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{progressPercentage}%</span>
                <span className="text-sm text-muted-foreground">
                  {completedTasks}/{totalTasks} tasks
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {project.start_date && project.end_date ? (
                <span>
                  {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                </span>
              ) : (
                <span className="text-muted-foreground">No dates set</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'kanban' ? renderKanbanView() : renderListView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails;
