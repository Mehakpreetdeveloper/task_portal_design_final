import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCreateProject, useUpdateProject, type CreateProjectData, type UpdateProjectData, type Project } from '@/hooks/use-projects';
import { Plus, Edit } from 'lucide-react';

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const ProjectForm = ({ project, onSuccess, trigger }: ProjectFormProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProjectData>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
  });

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (project) {
        await updateProject.mutateAsync({ id: project.id, data: formData as UpdateProjectData });
      } else {
        await createProject.mutateAsync(formData);
      }
      
      setOpen(false);
      onSuccess?.();
      
      if (!project) {
        setFormData({
          name: '',
          description: '',
          status: 'active',
        });
      }
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const defaultTrigger = (
    <Button>
      {project ? (
        <>
          <Edit className="mr-2 h-4 w-4" />
          Edit Project
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'completed' | 'archived') =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={createProject.isPending || updateProject.isPending}
            >
              {project ? 'Update' : 'Create'} Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};