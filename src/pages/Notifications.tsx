import { useState } from "react";
import { Bell, CheckCircle, Circle, Filter, MoreVertical, AlertCircle, Users, CheckSquare, FolderOpen, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockNotifications, mockUsers, mockTasks, mockProjects } from "@/data/mockData";

export default function Notifications() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredNotifications = mockNotifications.filter(notification => {
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "read" ? notification.read : !notification.read);
    
    return matchesType && matchesStatus;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_assigned':
      case 'task_completed':
        return CheckSquare;
      case 'project_updated':
        return FolderOpen;
      case 'comment_mention':
        return MessageSquare;
      default:
        return AlertCircle;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_created':
        return 'text-info';
      case 'task_assigned':
        return 'text-warning';
      case 'task_completed':
        return 'text-success';
      case 'project_updated':
        return 'text-primary';
      case 'comment_mention':
        return 'text-accent';
      default:
        return 'text-muted-foreground';
    }
  };

  const getUserById = (id: string) => mockUsers.find(user => user.id === id);
  const getTaskById = (id: string) => mockTasks.find(task => task.id === id);
  const getProjectById = (id: string) => mockProjects.find(project => project.id === id);

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    // In a real app, this would update the backend
    console.log(`Marking notification ${notificationId} as read`);
  };

  const markAllAsRead = () => {
    // In a real app, this would update the backend
    console.log('Marking all notifications as read');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            Stay updated with real-time notifications and activity updates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task_created">Task Created</SelectItem>
                <SelectItem value="task_assigned">Task Assigned</SelectItem>
                <SelectItem value="task_completed">Task Completed</SelectItem>
                <SelectItem value="project_updated">Project Updated</SelectItem>
                <SelectItem value="comment_mention">Mentions</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => {
          const relatedUser = getUserById(notification.userId);
          const relatedTask = getTaskById(notification.relatedId);
          const relatedProject = getProjectById(notification.relatedId);
          const Icon = getNotificationIcon(notification.type);
          const iconColor = getNotificationColor(notification.type);

          return (
            <Card 
              key={notification.id} 
              className={`border-0 shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer ${
                !notification.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                              {notification.read ? 'Mark as Unread' : 'Mark as Read'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      
                      {/* Related Information */}
                      {relatedTask && (
                        <div className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>Task: {relatedTask.title}</span>
                        </div>
                      )}
                      
                      {relatedProject && (
                        <div className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          <span>Project: {relatedProject.title}</span>
                        </div>
                      )}
                    </div>

                    {/* User Avatar if related to a user action */}
                    {relatedUser && (
                      <div className="flex items-center gap-2 pt-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={relatedUser.photo} />
                          <AvatarFallback className="text-xs">
                            {relatedUser.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {relatedUser.name} • {relatedUser.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
            <p className="text-muted-foreground mb-4">
              You're all caught up! No notifications match your current filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{mockNotifications.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{unreadCount}</div>
            <div className="text-xs text-muted-foreground">Unread</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-info">
              {mockNotifications.filter(n => n.type.includes('task')).length}
            </div>
            <div className="text-xs text-muted-foreground">Task Related</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {mockNotifications.filter(n => n.type === 'comment_mention').length}
            </div>
            <div className="text-xs text-muted-foreground">Mentions</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}