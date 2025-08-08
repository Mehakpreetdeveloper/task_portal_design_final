import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Mail, Phone, Calendar, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useData } from "@/contexts/DataContext";
import { UserFormDialog } from "@/components/forms/UserFormDialog";
import { UserProfileDialog } from "@/components/team/UserProfileDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/data/mockData";

export default function Team() {
  const { users, tasks, projects, deleteUser } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [viewingUser, setViewingUser] = useState<User | undefined>(undefined);
  const [deletingUser, setDeletingUser] = useState<User | undefined>(undefined);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesType = typeFilter === "all" || user.employeeType === typeFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesType && matchesStatus;
  });

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

  const getUserTasks = (userId: string) => 
    tasks.filter(task => task.assignedTo.includes(userId));

  const getUserProjects = (userId: string) => 
    projects.filter(project => project.teamMembers.includes(userId));

  const handleDeleteUser = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      toast({
        title: "Member deleted",
        description: `${deletingUser.name} has been removed from the team.`,
      });
      setDeletingUser(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage team members, roles, and track their involvement
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                  <SelectItem value="Team Lead">Team Lead</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="Product Manager">Product Manager</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => {
          const userTasks = getUserTasks(user.id);
          const userProjects = getUserProjects(user.id);
          const completedTasks = userTasks.filter(task => task.status === 'Completed').length;

          return (
            <Card key={user.id} className="border-0 shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.photo} />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight truncate">{user.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs">
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingUser(user)}>
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeletingUser(user)}
                      >
                        Delete Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Employee Type */}
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.employeeType}</span>
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{userTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{userProjects.length}</p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">{completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>

                {/* Current Projects */}
                {userProjects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Current Projects</p>
                    <div className="flex flex-wrap gap-1">
                      {userProjects.slice(0, 2).map((project) => (
                        <Badge key={project.id} variant="outline" className="text-xs">
                          {project.title}
                        </Badge>
                      ))}
                      {userProjects.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{userProjects.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No team members found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or add a new team member.
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-primary to-primary-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Member
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit User Dialog */}
      <UserFormDialog
        open={showCreateDialog || !!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingUser(undefined);
          }
        }}
        user={editingUser}
      />

      {/* User Profile Dialog */}
      {viewingUser && (
        <UserProfileDialog
          user={viewingUser}
          open={!!viewingUser}
          onOpenChange={(open) => !open && setViewingUser(undefined)}
          onEdit={() => {
            setEditingUser(viewingUser);
            setViewingUser(undefined);
          }}
          onDelete={() => {
            setDeletingUser(viewingUser);
            setViewingUser(undefined);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(undefined)}
        title="Delete Team Member"
        description={`Are you sure you want to remove ${deletingUser?.name} from the team? This action cannot be undone.`}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}