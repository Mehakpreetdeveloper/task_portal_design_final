import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, Users, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useData } from "@/contexts/DataContext";
import { ProjectFormDialog } from "@/components/forms/ProjectFormDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/data/mockData";

export default function Projects() {
  const { projects, users, tasks, deleteProject } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [deletingProject, setDeletingProject] = useState<Project | undefined>(undefined);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Active': return 'secondary';
      case 'Planning': return 'outline';
      case 'On Hold': return 'destructive';
      default: return 'secondary';
    }
  };

  const getUserById = (id: string) => users.find(user => user.id === id);
  const getProjectTasks = (projectId: string) => 
    tasks.filter(task => task.projectIds.includes(projectId));

  const handleDeleteProject = () => {
    if (deletingProject) {
      deleteProject(deletingProject.id);
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
      });
      setDeletingProject(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Project Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Oversee and coordinate all projects across your organization
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filteredProjects.map((project) => {
          const teamMembers = project.teamMembers.map(id => getUserById(id)).filter(Boolean);
          const createdBy = getUserById(project.createdBy);
          const projectTasks = getProjectTasks(project.id);
          const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;

          return (
            <Card key={project.id} className="border-0 shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl leading-tight">{project.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
                        {project.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {projectTasks.length} tasks
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProject(project)}>
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem>Manage Team</DropdownMenuItem>
                      <DropdownMenuItem>View Timeline</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeletingProject(project)}
                      >
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.description}
                </p>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Progress</span>
                    </div>
                    <span className="text-sm font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{completedTasks} of {projectTasks.length} tasks completed</span>
                    <span>{Math.round(project.progress)}% complete</span>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Team</span>
                    <span className="text-xs text-muted-foreground">({teamMembers.length} members)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {teamMembers.slice(0, 5).map((member) => (
                        <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                          <AvatarImage src={member.photo} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {teamMembers.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-medium">+{teamMembers.length - 5}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 ml-2">
                      {teamMembers.slice(0, 3).map((member) => (
                        <Badge key={member.id} variant="outline" className="text-xs">
                          {member.employeeType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    End: {new Date(project.endDate).toLocaleDateString()}
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    Created by {createdBy?.name}
                  </div>
                </div>

                {/* Attachments */}
                {project.attachments.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{project.attachments.length} attachments</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="border-0 shadow-card">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or create a new project.
            </p>
            <Button 
              className="bg-gradient-to-r from-primary to-primary-glow"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ProjectFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      {editingProject && (
        <ProjectFormDialog
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(undefined)}
          project={editingProject}
        />
      )}

      <ConfirmDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(undefined)}
        title="Delete Project"
        description={`Are you sure you want to delete "${deletingProject?.title}"? This action cannot be undone and will remove the project from all associated tasks.`}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}