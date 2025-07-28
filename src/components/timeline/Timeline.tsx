import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Clock, User, Calendar as CalendarView, List, AlertCircle, CheckCircle } from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { useTeamMembers } from '@/hooks/use-team';
import { format, isSameDay, startOfWeek, endOfWeek, addDays, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

export const Timeline = () => {
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: teamMembers = [] } = useTeamMembers();

  // Group tasks by date for timeline view
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    const sortedGrouped: Record<string, typeof tasks> = {};
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date];
    });
    
    return sortedGrouped;
  }, [tasks]);

  // Get tasks for current week for calendar view
  const weekTasks = useMemo(() => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
  }, [tasks, selectedDate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getAssigneeName = (assignedTo: string | null) => {
    if (!assignedTo) return 'Unassigned';
    const member = teamMembers.find(m => m.user_id === assignedTo);
    return member?.full_name || member?.email || 'Unknown User';
  };

  const renderWeekCalendar = () => {
    const weekStart = startOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map((day) => {
          const dayTasks = weekTasks.filter(task => 
            task.due_date && isSameDay(new Date(task.due_date), day)
          );
          
          return (
            <Card key={day.toISOString()} className="min-h-[200px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {format(day, 'EEE')}
                </CardTitle>
                <CardDescription className="text-lg font-bold">
                  {format(day, 'd')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-2 rounded-md text-xs border",
                      getPriorityColor(task.priority)
                    )}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getStatusIcon(task.status)}
                      <span className="font-medium truncate">{task.title}</span>
                    </div>
                    <div className="text-xs opacity-75">
                      {getProjectName(task.project_id)}
                    </div>
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No tasks
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderTimeline = () => {
    if (Object.keys(tasksByDate).length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks with due dates</h3>
            <p className="text-muted-foreground">
              Add due dates to your tasks to see them in the timeline
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(tasksByDate).map(([date, dateTasks]) => (
          <div key={date} className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary text-primary-foreground px-3 py-1 rounded-md">
                {format(new Date(date), 'MMM d, yyyy')}
              </div>
              <div className="h-px bg-border flex-1" />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dateTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <CardTitle className="text-sm">{task.title}</CardTitle>
                      </div>
                      <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                        {task.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Project:</span>
                        <span>{getProjectName(task.project_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>{getAssigneeName(task.assigned_to)}</span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(task.due_date), 'h:mm a')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Timeline & Calendar</h2>
          <p className="text-muted-foreground">View tasks and deadlines over time</p>
        </div>
        
        <Tabs value={view} onValueChange={(value) => setView(value as 'timeline' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarView className="w-4 h-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'timeline' ? renderTimeline() : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              >
                Previous Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              >
                Next Week
              </Button>
            </div>
          </div>
          {renderWeekCalendar()}
        </div>
      )}
    </div>
  );
};