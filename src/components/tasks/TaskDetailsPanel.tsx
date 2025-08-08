import { useState } from "react";
import { Calendar, Paperclip, Users, Tag, Edit, Trash2, ExternalLink, X, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useData } from "@/contexts/DataContext";
import { TaskComments } from "./TaskComments";
import { Task } from "@/data/mockData";
import { format } from "date-fns";

interface TaskDetailsPanelProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskDetailsPanel({ task, onClose, onEdit, onDelete }: TaskDetailsPanelProps) {
  const { users, projects, updateTask } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: task.status,
    priority: task.priority,
    description: task.description,
    dueDate: new Date(task.dueDate),
    assignedTo: task.assignedTo,
  });

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

  const handleSave = () => {
    updateTask(task.id, {
      ...task,
      ...editData,
      dueDate: editData.dueDate.toISOString(),
    });
    setIsEditing(false);
  };

  const handleAssigneeChange = (userId: string) => {
    const newAssignees = editData.assignedTo.includes(userId)
      ? editData.assignedTo.filter(id => id !== userId)
      : [...editData.assignedTo, userId];
    setEditData({ ...editData, assignedTo: newAssignees });
  };

  return (
    <div className="fixed top-0 right-0 h-full w-[600px] bg-background border-l border-border shadow-xl z-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h2 className="text-2xl font-bold leading-tight">{task.title}</h2>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              Save Changes
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}

        <Separator />

        {/* Assignee Dropdown */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Assignees
          </Label>
          {isEditing ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={editData.assignedTo.includes(user.id)}
                    onChange={() => handleAssigneeChange(user.id)}
                    className="rounded"
                  />
                  <label htmlFor={`user-${user.id}`} className="flex items-center gap-2 text-sm">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.photo} />
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {assignedUsers.map((user) => (
                <div key={user!.id} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user!.photo} />
                    <AvatarFallback className="text-xs">
                      {user!.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user!.name}</p>
                    <p className="text-xs text-muted-foreground">{user!.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Due Date Picker */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Due Date
          </Label>
          {isEditing ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(editData.dueDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={editData.dueDate}
                  onSelect={(date) => date && setEditData({ ...editData, dueDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={`text-sm ${new Date(task.dueDate) < new Date() ? 'text-destructive font-medium' : ''}`}>
                {format(new Date(task.dueDate), "PPP")}
              </span>
              {new Date(task.dueDate) < new Date() && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Projects List */}
        {taskProjects.length > 0 && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Linked Projects ({taskProjects.length})
              </Label>
              <div className="space-y-2">
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
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Priority Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Priority
          </Label>
          {isEditing ? (
            <Select value={editData.priority} onValueChange={(value: "Low" | "Medium" | "High" | "Critical") => setEditData({ ...editData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={task.priority === 'Critical' ? 'destructive' : task.priority === 'High' ? 'secondary' : 'outline'}>
              {task.priority}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Status Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Status</Label>
          {isEditing ? (
            <Select value={editData.status} onValueChange={(value: "Todo" | "In Progress" | "In Review" | "Completed") => setEditData({ ...editData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todo">Todo</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getStatusBadgeVariant(task.status)}>
              {task.status}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Description */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Description</Label>
          {isEditing ? (
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Task description..."
              className="min-h-[100px]"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Attachments */}
        {task.attachments.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments ({task.attachments.length})
              </Label>
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
          </>
        )}

        <Separator />

        {/* Timeline Info */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Created</Label>
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={createdBy?.photo} />
              <AvatarFallback className="text-xs">
                {createdBy?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm">{createdBy?.name}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(task.createdAt), "PPp")}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Comments Section */}
        <TaskComments taskId={task.id} />
      </div>
    </div>
  );
}