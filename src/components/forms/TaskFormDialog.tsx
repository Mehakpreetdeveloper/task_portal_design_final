import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Upload } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Task } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Todo", "In Progress", "In Review", "Completed"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  assignedTo: z.array(z.string()).min(1, "At least one assignee is required"),
  projectIds: z.array(z.string()).optional(),
  dueDate: z.string().min(1, "Due date is required"),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  const { users, projects, createTask, updateTask } = useData();
  const { toast } = useToast();
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(task?.assignedTo || []);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(task?.projectIds || []);
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [attachments, setAttachments] = useState<string[]>(task?.attachments || []);
  const [newTag, setNewTag] = useState("");

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "Todo",
      priority: task?.priority || "Medium",
      assignedTo: task?.assignedTo || [],
      projectIds: task?.projectIds || [],
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : "",
      tags: task?.tags || [],
      attachments: task?.attachments || [],
    },
  });

  const onSubmit = (data: TaskFormData) => {
    const taskData = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignedTo: selectedAssignees,
      projectIds: selectedProjects,
      tags,
      attachments,
      dueDate: new Date(data.dueDate).toISOString(),
      comments: task?.comments || [],
      createdBy: task?.createdBy || "1", // Current user
      createdAt: task?.createdAt || new Date().toISOString(),
    };

    if (task) {
      updateTask(task.id, taskData);
      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
    } else {
      createTask(taskData);
      toast({
        title: "Task created",
        description: "Task has been created successfully.",
      });
    }

    onOpenChange(false);
    form.reset();
    setSelectedAssignees([]);
    setSelectedProjects([]);
    setTags([]);
    setAttachments([]);
  };

  const addAssignee = (userId: string) => {
    if (!selectedAssignees.includes(userId)) {
      const newAssignees = [...selectedAssignees, userId];
      setSelectedAssignees(newAssignees);
      form.setValue("assignedTo", newAssignees);
    }
  };

  const removeAssignee = (userId: string) => {
    const newAssignees = selectedAssignees.filter(id => id !== userId);
    setSelectedAssignees(newAssignees);
    form.setValue("assignedTo", newAssignees);
  };

  const addProject = (projectId: string) => {
    if (!selectedProjects.includes(projectId)) {
      const newProjects = [...selectedProjects, projectId];
      setSelectedProjects(newProjects);
      form.setValue("projectIds", newProjects);
    }
  };

  const removeProject = (projectId: string) => {
    const newProjects = selectedProjects.filter(id => id !== projectId);
    setSelectedProjects(newProjects);
    form.setValue("projectIds", newProjects);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()];
      setTags(newTags);
      form.setValue("tags", newTags);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleFileUpload = () => {
    // Mock file upload
    const fileName = `attachment_${Date.now()}.pdf`;
    const newAttachments = [...attachments, fileName];
    setAttachments(newAttachments);
    form.setValue("attachments", newAttachments);
    toast({
      title: "File uploaded",
      description: `${fileName} has been uploaded successfully.`,
    });
  };

  const removeAttachment = (fileName: string) => {
    const newAttachments = attachments.filter(file => file !== fileName);
    setAttachments(newAttachments);
    form.setValue("attachments", newAttachments);
  };

  const selectedAssigneeObjects = selectedAssignees.map(id => users.find(user => user.id === id)).filter(Boolean);
  const availableAssignees = users.filter(user => !selectedAssignees.includes(user.id));
  const selectedProjectObjects = selectedProjects.map(id => projects.find(project => project.id === id)).filter(Boolean);
  const availableProjects = projects.filter(project => !selectedProjects.includes(project.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter task description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Todo">Todo</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assignees */}
            <div className="space-y-3">
              <FormLabel>Assignees</FormLabel>
              
              {/* Selected Assignees */}
              {selectedAssigneeObjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Assigned To:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssigneeObjects.map((assignee) => (
                      <div key={assignee!.id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={assignee!.photo} />
                          <AvatarFallback className="text-xs">
                            {assignee!.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{assignee!.name}</span>
                        <Badge variant="outline" className="text-xs">{assignee!.role}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAssignee(assignee!.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Assignees */}
              {availableAssignees.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Add Assignees:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableAssignees.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => addAssignee(user.id)}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.photo} />
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role} • {user.employeeType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {form.formState.errors.assignedTo && (
                <p className="text-sm text-destructive">{form.formState.errors.assignedTo.message}</p>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-3">
              <FormLabel>Projects (Optional)</FormLabel>
              
              {/* Selected Projects */}
              {selectedProjectObjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Linked Projects:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProjectObjects.map((project) => (
                      <div key={project!.id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                        <span className="text-sm">{project!.title}</span>
                        <Badge variant="outline" className="text-xs">{project!.status}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(project!.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Projects */}
              {availableProjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Link to Projects:</p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {availableProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => addProject(project.id)}
                      >
                        <span className="text-sm">{project.title}</span>
                        <Badge variant="outline" className="text-xs">{project.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel>Tags (Optional)</FormLabel>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        <X className="w-2 h-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-3">
              <FormLabel>Attachments (Optional)</FormLabel>
              
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleFileUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <span className="text-xs text-muted-foreground">
                  Mock upload - files will be simulated
                </span>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Attached Files:</p>
                  <div className="space-y-1">
                    {attachments.map((fileName) => (
                      <div key={fileName} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{fileName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(fileName)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
                {task ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}