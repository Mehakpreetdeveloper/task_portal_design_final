import { useState } from "react";
import { Calendar, Paperclip, Users, Tag, Edit, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import { TaskComments } from "./TaskComments";
import { Task } from "@/data/mockData";

interface TaskDetailsDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskDetailsDialog({ task, open, onOpenChange, onEdit, onDelete }: TaskDetailsDialogProps) {
  const { users, projects } = useData();

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

  const assignedUsers = task.assignedTo.map(id => users.find(user => user.id === id)).filter(Boolean);
  const taskProjects = task.projectIds.map(id => projects.find(project => project.id === id)).filter(Boolean);
  const createdBy = users.find(user => user.id === task.createdBy);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <DialogTitle className="text-2xl leading-tight">{task.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(task.status)}>
                  {task.status}
                </Badge>
                <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority} Priority
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="text-muted-foreground">{task.description}</p>
          </div>

          <Separator />

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned Users */}
            <Card className="border-0 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assigned To ({assignedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignedUsers.map((user) => (
                  <div key={user!.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user!.photo} />
                      <AvatarFallback>
                        {user!.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user!.name}</p>
                      <p className="text-xs text-muted-foreground">{user!.role} • {user!.employeeType}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Project Links */}
            {taskProjects.length > 0 && (
              <Card className="border-0 shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Linked Projects ({taskProjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {taskProjects.map((project) => (
                    <div key={project!.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{project!.title}</p>
                        <p className="text-xs text-muted-foreground">Progress: {project!.progress}%</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {project!.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tags and Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments ({task.attachments.length})
                </h4>
                <div className="space-y-2">
                  {task.attachments.map((filename) => (
                    <div key={filename} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="text-sm">{filename}</span>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Task Timeline */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(task.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date:</span>
                <span className={new Date(task.dueDate) < new Date() ? 'text-destructive font-medium' : ''}>
                  {new Date(task.dueDate).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created By:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={createdBy?.photo} />
                    <AvatarFallback className="text-xs">
                      {createdBy?.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{createdBy?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Comments Section */}
          <TaskComments taskId={task.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}