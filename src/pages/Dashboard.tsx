import { CheckSquare, FolderOpen, Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useData } from "@/contexts/DataContext";
import { mockNotifications } from "@/data/mockData";

export default function Dashboard() {
  const { tasks, projects, users } = useData();
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(project => project.status === 'Active').length;
  const totalTeamMembers = users.length;
  const activeMembers = users.filter(user => user.status === 'Active').length;
  
  const recentTasks = tasks.slice(0, 5);
  const recentNotifications = mockNotifications.slice(0, 4);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'secondary';
      case 'In Review': return 'outline';
      case 'Todo': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-destructive';
      case 'High': return 'text-warning';
      case 'Medium': return 'text-info';
      case 'Low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value={totalTasks}
          icon={CheckSquare}
          trend={{ value: "12%", isPositive: true }}
        />
        <StatsCard
          title="Active Projects"
          value={activeProjects}
          icon={FolderOpen}
          trend={{ value: "8%", isPositive: true }}
        />
        <StatsCard
          title="Team Members"
          value={activeMembers}
          icon={Users}
          trend={{ value: "2%", isPositive: true }}
        />
        <StatsCard
          title="Completion Rate"
          value={`${Math.round((completedTasks / totalTasks) * 100)}%`}
          icon={TrendingUp}
          trend={{ value: "5%", isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTasks.map((task) => {
              const assignedUser = users.find(user => user.id === task.assignedTo[0]);
              return (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {assignedUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={assignedUser.photo} />
                      <AvatarFallback>{assignedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{project.title}</h4>
                    <p className="text-xs text-muted-foreground">{project.status}</p>
                  </div>
                  <span className="text-sm font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {project.teamMembers.length} members
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    Due {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentNotifications.map((notification) => {
              const relatedUser = users.find(user => 
                notification.message.toLowerCase().includes(user.name.toLowerCase())
              );
              return (
                <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {relatedUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={relatedUser.photo} />
                      <AvatarFallback>{relatedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}