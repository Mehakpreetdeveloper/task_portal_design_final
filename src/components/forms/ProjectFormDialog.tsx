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
import { Project } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["Planning", "Active", "On Hold", "Completed"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  teamMembers: z.array(z.string()).min(1, "At least one team member is required"),
  attachments: z.array(z.string()).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const { users, createProject, updateProject } = useData();
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<string[]>(project?.teamMembers || []);
  const [attachments, setAttachments] = useState<string[]>(project?.attachments || []);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      status: project?.status || "Planning",
      startDate: project?.startDate || "",
      endDate: project?.endDate || "",
      teamMembers: project?.teamMembers || [],
      attachments: project?.attachments || [],
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    const projectData = {
      title: data.title,
      description: data.description,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      teamMembers: selectedMembers,
      attachments,
      progress: project?.progress || 0,
      createdBy: project?.createdBy || "1", // Current user
      createdAt: project?.createdAt || new Date().toISOString(),
    };

    if (project) {
      updateProject(project.id, projectData);
      toast({
        title: "Project updated",
        description: "Project has been updated successfully.",
      });
    } else {
      createProject(projectData);
      toast({
        title: "Project created",
        description: "Project has been created successfully.",
      });
    }

    onOpenChange(false);
    form.reset();
    setSelectedMembers([]);
    setAttachments([]);
  };

  const addTeamMember = (userId: string) => {
    if (!selectedMembers.includes(userId)) {
      const newMembers = [...selectedMembers, userId];
      setSelectedMembers(newMembers);
      form.setValue("teamMembers", newMembers);
    }
  };

  const removeTeamMember = (userId: string) => {
    const newMembers = selectedMembers.filter(id => id !== userId);
    setSelectedMembers(newMembers);
    form.setValue("teamMembers", newMembers);
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

  const selectedMemberObjects = selectedMembers.map(id => users.find(user => user.id === id)).filter(Boolean);
  const availableMembers = users.filter(user => !selectedMembers.includes(user.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Textarea placeholder="Enter project description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Team Members */}
            <div className="space-y-3">
              <FormLabel>Team Members</FormLabel>
              
              {/* Selected Members */}
              {selectedMemberObjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Selected Members:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMemberObjects.map((member) => (
                      <div key={member!.id} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member!.photo} />
                          <AvatarFallback className="text-xs">
                            {member!.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member!.name}</span>
                        <Badge variant="outline" className="text-xs">{member!.role}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(member!.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Members */}
              {availableMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Add Members:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => addTeamMember(member.id)}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.photo} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.role} • {member.employeeType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {form.formState.errors.teamMembers && (
                <p className="text-sm text-destructive">{form.formState.errors.teamMembers.message}</p>
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
                {project ? "Update Project" : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}