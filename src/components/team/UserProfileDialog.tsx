import { Calendar, User as UserIcon, Mail, Phone, Briefcase, MapPin, Edit, Trash2, FileText, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import { User } from "@/data/mockData";

interface UserProfileDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function UserProfileDialog({ user, open, onOpenChange, onEdit, onDelete }: UserProfileDialogProps) {
  const { tasks, projects } = useData();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Admin': return 'default';
      case 'PM': return 'secondary';
      case 'Team Lead': return 'outline';
      case 'User': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'Active' ? 'secondary' : 'destructive';
  };

  const userTasks = tasks.filter(task => task.assignedTo.includes(user.id));
  const userProjects = projects.filter(project => project.teamMembers.includes(user.id));
  const completedTasks = userTasks.filter(task => task.status === 'Completed');
  const activeTasks = userTasks.filter(task => task.status !== 'Completed');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.photo} />
                <AvatarFallback className="text-2xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <DialogTitle className="text-2xl">{user.name}</DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(user.status)}>
                    {user.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span>{user.employeeType}</span>
                </div>
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
          {/* Contact Information */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Join Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Employee Type</p>
                    <p className="text-sm text-muted-foreground">{user.employeeType}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">{userTasks.length}</div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-warning">{activeTasks.length}</div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-card">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-info">{userProjects.length}</div>
                <p className="text-sm text-muted-foreground">Projects</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Projects & Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Projects ({userProjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No projects assigned yet
                  </p>
                ) : (
                  userProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{project.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Progress: {project.progress}%
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Tasks */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recent Tasks ({userTasks.slice(0, 5).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks assigned yet
                  </p>
                ) : (
                  userTasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={task.status === 'Completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}