import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX',
    status: 'active',
    tasksCount: 12,
    completedTasks: 8,
    dueDate: '2024-02-15',
    members: 4,
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android platforms',
    status: 'active',
    tasksCount: 25,
    completedTasks: 15,
    dueDate: '2024-03-30',
    members: 6,
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Q1 marketing campaign for product launch',
    status: 'completed',
    tasksCount: 8,
    completedTasks: 8,
    dueDate: '2024-01-31',
    members: 3,
  },
];

const Projects = () => {
  const { user } = useAuth();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      completed: "secondary",
      archived: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Projects</h1>
              <p className="text-muted-foreground">Manage your projects and track progress</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Project</DropdownMenuItem>
                      <DropdownMenuItem>View Tasks</DropdownMenuItem>
                      <DropdownMenuItem>Archive</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {project.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {project.completedTasks}/{project.tasksCount} tasks
                      </span>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${getProgressPercentage(project.completedTasks, project.tasksCount)}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Due {project.dueDate}
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {project.members} members
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Projects;