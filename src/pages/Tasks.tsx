import { useState } from "react";
import { Plus, Search, Filter, MoreVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useData } from "@/contexts/DataContext";
import { TaskFormDialog } from "@/components/forms/TaskFormDialog";
import { TaskDetailsPanel } from "@/components/tasks/TaskDetailsPanel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@/data/mockData";
import { format } from "date-fns";

export default function Tasks() {
  const { tasks, users, projects, deleteTask } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | undefined>(undefined);
  const [deletingTask, setDeletingTask] = useState<Task | undefined>(undefined);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Group tasks by status
  const groupedTasks = {
    "Todo": tasks.filter(task => task.status === "Todo"),
    "In Progress": tasks.filter(task => task.status === "In Progress"),
    "Completed": tasks.filter(task => task.status === "Completed" || task.status === "In Review")
  };

  const filteredGroupedTasks = Object.entries(groupedTasks).reduce((acc, [status, statusTasks]) => {
    const filtered = statusTasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
    acc[status] = filtered;
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
      case 'Critical': return 'bg-destructive text-destructive-foreground';
      case 'High': return 'bg-purple-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTrackingStatus = (task: Task) => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (task.status === "Completed") return { label: "Complete", color: "bg-green-500 text-white" };
    if (daysDiff < 0) return { label: "Off Track", color: "bg-red-500 text-white" };
    if (daysDiff <= 2) return { label: "At Risk", color: "bg-orange-500 text-white" };
    return { label: "On Track", color: "bg-blue-500 text-white" };
  };

  const getUserById = (id: string) => users.find(user => user.id === id);
  const getProjectById = (id: string) => projects.find(project => project.id === id);

  const handleDeleteTask = () => {
    if (deletingTask) {
      deleteTask(deletingTask.id);
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
      setDeletingTask(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Task Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all tasks across your organization
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Layout */}
      <div className={`flex gap-6 ${viewingTask ? 'mr-[600px]' : ''} transition-all duration-300`}>
        {/* Task Sections */}
        <div className="flex-1 space-y-6">
          {Object.entries(filteredGroupedTasks).map(([sectionName, sectionTasks]) => {
            const isCollapsed = collapsedSections[sectionName];
            const sectionDisplayName = sectionName === "Todo" ? "To do" : 
                                     sectionName === "In Progress" ? "Doing" : "Done";
            
            return (
              <Card key={sectionName} className="border-0 shadow-card">
                <Collapsible open={!isCollapsed} onOpenChange={() => toggleSection(sectionName)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {sectionDisplayName}
                          <Badge variant="outline" className="ml-2">
                            {sectionTasks.length}
                          </Badge>
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-2">
                      {sectionTasks.map((task) => {
                        const assignedUser = users.find(user => user.id === task.assignedTo[0]);
                        const trackingStatus = getTrackingStatus(task);
                        
                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors group"
                            onClick={() => setViewingTask(task)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {/* Task Name */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{task.title}</p>
                              </div>
                              
                              {/* Assignee Avatar */}
                              <div className="flex-shrink-0">
                                {assignedUser ? (
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={assignedUser.photo} />
                                    <AvatarFallback className="text-xs">
                                      {assignedUser.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">?</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Due Date */}
                              <div className="flex-shrink-0 text-xs text-muted-foreground min-w-[80px]">
                                {format(new Date(task.dueDate), "MMM dd")}
                              </div>
                              
                              {/* Priority Badge */}
                              <Badge className={`text-xs ${getPriorityColor(task.priority)} flex-shrink-0`}>
                                {task.priority}
                              </Badge>
                              
                              {/* Status Badge */}
                              <Badge className={`text-xs ${trackingStatus.color} flex-shrink-0`}>
                                {trackingStatus.label}
                              </Badge>
                            </div>
                            
                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingTask(task);
                                }}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTask(task);
                                }}>
                                  Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingTask(task);
                                  }}
                                >
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                      
                      {/* Add Task Input */}
                      <div className="pt-2 border-t border-border mt-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => setShowCreateDialog(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add task...
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
          
          {/* Empty State */}
          {Object.values(filteredGroupedTasks).every(tasks => tasks.length === 0) && (
            <Card className="border-0 shadow-card">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or create a new task.
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-primary to-primary-glow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Task Dialog */}
      <TaskFormDialog
        open={showCreateDialog || !!editingTask}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingTask(undefined);
          }
        }}
        task={editingTask}
      />

      {/* Task Details Panel - Fixed Right Side */}
      {viewingTask && (
        <TaskDetailsPanel
          task={viewingTask}
          onClose={() => setViewingTask(undefined)}
          onEdit={() => {
            setEditingTask(viewingTask);
            setViewingTask(undefined);
          }}
          onDelete={() => {
            setDeletingTask(viewingTask);
            setViewingTask(undefined);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(undefined)}
        title="Delete Task"
        description={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}