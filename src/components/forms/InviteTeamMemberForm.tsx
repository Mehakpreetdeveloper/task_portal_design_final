import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useInviteTeamMember } from '@/hooks/use-team';
import { Plus, Mail } from 'lucide-react';

interface InviteTeamMemberFormProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const InviteTeamMemberForm = ({ onSuccess, trigger }: InviteTeamMemberFormProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const inviteTeamMember = useInviteTeamMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await inviteTeamMember.mutateAsync(email);
      setOpen(false);
      onSuccess?.();
      setEmail('');
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Invite Member
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="pl-10"
                required
              />
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
              disabled={inviteTeamMember.isPending}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};