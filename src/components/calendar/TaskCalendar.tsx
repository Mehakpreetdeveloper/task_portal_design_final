import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTasks } from '@/hooks/use-tasks';
import { TaskForm } from '@/components/forms/TaskForm';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarDays, List, Plus } from 'lucide-react';

export const TaskCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'calendar' | 'timeline'>('calendar');
  const { data: tasks = [] } = useTasks();

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.due_date && isSameDay(new Date(task.due_date), date)
    );
  };

  const getSelectedDateTasks = () => {
    return getTasksForDate(selectedDate);
  };

  const getTasksForMonth = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return days.map(day => ({
      date: day,
      tasks: getTasksForDate(day)
    })).filter(dayData => dayData.tasks.length > 0);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Calendar</h2>
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'timeline')}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <List className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <TaskForm trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          } />
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Select a date to view tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  modifiers={{
                    hasTasks: (date) => getTasksForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasTasks: { 
                      backgroundColor: 'hsl(var(--primary))', 
                      color: 'hsl(var(--primary-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Tasks for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <CardDescription>
                  {getSelectedDateTasks().length} task(s) due on this date
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getSelectedDateTasks().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks due on this date
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getSelectedDateTasks().map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-muted-foreground">{task.projects?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(task.status)}
                          <TaskForm
                            task={task}
                            trigger={
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Task Timeline</CardTitle>
            <CardDescription>All tasks organized by due date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {getTasksForMonth().map(({ date, tasks: dayTasks }) => (
                <div key={date.toISOString()}>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    {format(date, 'EEEE, MMMM d')}
                    <Badge variant="outline" className="ml-2">
                      {dayTasks.length} task(s)
                    </Badge>
                  </h3>
                  <div className="ml-5 border-l-2 border-muted pl-4 space-y-3">
                    {dayTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-muted-foreground">{task.projects?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(task.status)}
                          <TaskForm
                            task={task}
                            trigger={
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {getTasksForMonth().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks with due dates in this month
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};