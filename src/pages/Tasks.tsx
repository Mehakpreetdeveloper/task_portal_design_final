import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Calendar, User, Flag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const mockTasks = [
  {
    id: '1',
    title: 'Design homepage mockup',
    description: 'Create wireframes and high-fidelity mockups for the new homepage',
    status: 'todo',
    priority: 'high',
    dueDate: '2024-02-10',
    assignedTo: 'John Doe',
    projectName: 'Website Redesign',
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up login/signup functionality with proper validation',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-02-12',
    assignedTo: 'Jane Smith',
    projectName: 'Mobile App Development',
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Document all API endpoints with examples and response formats',
    status: 'completed',
    priority: 'medium',
    dueDate: '2024-02-08',
    assignedTo: 'Mike Johnson',
    projectName: 'Mobile App Development',
  },
  {
    id: '4',
    title: 'Conduct user testing',
    description: 'Run usability tests with 10 target users and compile feedback',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-02-20',
    assignedTo: 'Sarah Wilson',
    projectName: 'Website Redesign',
  },
];

const Tasks = () => {
  const { user } = useAuth();

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

  const filterTasksByStatus = (status: string) => {
    if (status === 'all') return mockTasks;
    return mockTasks.filter(task => task.status === status);
  };

  const TaskCard = ({ task }: { task: typeof mockTasks[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {task.projectName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {getPriorityBadge(task.priority)}
            {getStatusBadge(task.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <User className="mr-1 h-4 w-4" />
            {task.assignedTo}
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            Due {task.dueDate}
          </div>
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="website">Website Redesign</SelectItem>
                <SelectItem value="mobile">Mobile App Development</SelectItem>
                <SelectItem value="marketing">Marketing Campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Tasks ({mockTasks.length})</TabsTrigger>
              <TabsTrigger value="todo">To Do ({filterTasksByStatus('todo').length})</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress ({filterTasksByStatus('in_progress').length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filterTasksByStatus('completed').length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="todo" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTasksByStatus('todo').map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="in_progress" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTasksByStatus('in_progress').map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTasksByStatus('completed').map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Tasks;