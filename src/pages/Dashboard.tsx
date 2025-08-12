import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckSquare, FolderOpen, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { profile, isAdmin, isProjectManager } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalProjects: 0,
    overdueTasks: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch tasks count
      const { count: totalTasks } = await (supabase as any)
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const { count: completedTasks } = await (supabase as any)
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Done');

      // Fetch projects count
      const { count: totalProjects } = await (supabase as any)
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Fetch overdue tasks
      const today = new Date().toISOString().split('T')[0];
      const { count: overdueTasks } = await (supabase as any)
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .neq('status', 'Done');

      // Fetch pending tasks (todo and in progress)
      const { count: pendingTasks } = await (supabase as any)
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['todo', 'in_progress']);

      setStats({
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        totalProjects: totalProjects || 0,
        overdueTasks: overdueTasks || 0,
        pendingTasks: pendingTasks || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      description: 'Active tasks in the system',
      icon: CheckSquare,
      color: 'text-blue-600',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      description: 'Tasks in progress or todo',
      icon: AlertCircle,
      color: 'text-orange-600',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      description: 'Tasks marked as done',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      description: 'Active projects',
      icon: FolderOpen,
      color: 'text-purple-600',
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      description: 'Tasks past their due date',
      icon: Clock,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your current work and progress.
        </p>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-sm">
              Your latest task updates and project changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Task completed</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">New project created</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Task assigned</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm">
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-sm">Create New Task</div>
              <div className="text-xs text-muted-foreground">Add a new task to your projects</div>
            </button>
            {(isAdmin || isProjectManager) && (
              <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="font-medium text-sm">Create New Project</div>
                <div className="text-xs text-muted-foreground">Start a new project</div>
              </button>
            )}
            <button className="w-full text-left p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-sm">View Calendar</div>
              <div className="text-xs text-muted-foreground">Check upcoming deadlines</div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;