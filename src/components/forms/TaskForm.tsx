import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateTask, useUpdateTask, type CreateTaskData, type UpdateTaskData, type Task } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { useTeamMembers } from '@/hooks/use-team';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Calendar as CalendarIcon, Upload, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  task?: Task;
  projectId?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const TaskForm = ({ task, projectId, onSuccess, trigger }: TaskFormProps) => {
  const [open, setOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateTaskData>({
    project_id: task?.project_id || projectId || '',
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || 'none',
    attachment_url: task?.attachment_url || null,
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: projects } = useProjects();
  const { data: teamMembers } = useTeamMembers();

  const uploadFile = async (file: File, taskId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const removeAttachment = async () => {
    if (formData.attachment_url && task) {
      // Extract file path from URL
      const url = new URL(formData.attachment_url);
      const filePath = url.pathname.split('/').slice(-2).join('/');
      
      await supabase.storage
        .from('task-attachments')
        .remove([filePath]);
      
      setFormData({ ...formData, attachment_url: null });
    }
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let attachmentUrl = formData.attachment_url;
      
      const taskData = {
        ...formData,
        assigned_to: formData.assigned_to === 'none' ? null : formData.assigned_to,
        due_date: dueDate ? dueDate.toISOString() : null,
        attachment_url: attachmentUrl,
      };

      let savedTask;
      if (task) {
        savedTask = await updateTask.mutateAsync({ id: task.id, data: taskData as UpdateTaskData });
      } else {
        savedTask = await createTask.mutateAsync(taskData);
      }
      
      // Upload file after task is created/updated
      if (selectedFile && savedTask) {
        attachmentUrl = await uploadFile(selectedFile, savedTask.id);
        // Update task with attachment URL
        await updateTask.mutateAsync({ 
          id: savedTask.id, 
          data: { attachment_url: attachmentUrl } 
        });
      }
      
      setOpen(false);
      onSuccess?.();
      
      if (!task) {
        setFormData({
          project_id: projectId || '',
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          assigned_to: 'none',
          attachment_url: null,
        });
        setDueDate(undefined);
        setSelectedFile(null);
      }
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setUploading(false);
    }
  };

  const defaultTrigger = (
    <Button>
      {task ? (
        <>
          <Edit className="mr-2 h-4 w-4" />
          Edit Task
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                disabled={!!projectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'todo' | 'in_progress' | 'completed') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers?.map((member) => (
                    <SelectItem key={member.id} value={member.user_id}>
                      {member.full_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Attachment</Label>
            <div className="space-y-2">
              {formData.attachment_url || selectedFile ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm">
                      {selectedFile ? selectedFile.name : 'Current attachment'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={!selectedFile}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTask.isPending || updateTask.isPending || uploading}
            >
              {uploading ? 'Uploading...' : task ? 'Update' : 'Create'} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};