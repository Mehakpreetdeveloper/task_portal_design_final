import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Plus, Search, Mail, Phone, MapPin, MoreVertical, UserCog, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InviteTeamMemberForm } from '@/components/forms/InviteTeamMemberForm';
import { useTeamMembers, useUpdateUserRole } from '@/hooks/use-team';
import { useTasks } from '@/hooks/use-tasks';

const Team = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const { data: allTasks = [] } = useTasks();
  const updateUserRole = useUpdateUserRole();

  const filteredMembers = teamMembers.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMemberStats = (userId: string) => {
    const memberTasks = allTasks.filter(task => task.assigned_to === userId);
    const activeTasks = memberTasks.filter(task => task.status !== 'completed');
    const completedTasks = memberTasks.filter(task => task.status === 'completed');
    
    return {
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
    };
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    await updateUserRole.mutateAsync({ userId, role: newRole });
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return <Badge variant="outline">user</Badge>;
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "default",
      user: "secondary",
    };
    const icons: Record<string, React.ReactNode> = {
      admin: <Shield className="w-3 h-3 mr-1" />,
      user: <UserCog className="w-3 h-3 mr-1" />,
    };
    
    return (
      <Badge variant={variants[role]} className="flex items-center">
        {icons[role]}
        {role}
      </Badge>
    );
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading team members...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Team</h1>
              <p className="text-muted-foreground">Manage team members and their roles</p>
            </div>
            <InviteTeamMemberForm />
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search team members..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">No team members found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Invite your first team member to get started'}
                </p>
                <InviteTeamMemberForm />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => {
                const stats = getMemberStats(member.user_id);
                const currentRole = member.user_roles?.[0]?.role || 'user';
                
                return (
                  <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar_url || ''} alt={member.full_name || member.email} />
                          <AvatarFallback>
                            {getInitials(member.full_name || '', member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {member.full_name || member.email}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Team Member
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(member.user_id, 'admin')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.user_id, 'user')}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Make User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          {getRoleBadge(currentRole)}
                          <Badge variant="secondary">Active</Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="mr-2 h-4 w-4" />
                            {member.email}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{stats.activeTasks}</div>
                            <div className="text-xs text-muted-foreground">Active Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-secondary-foreground">{stats.completedTasks}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Joined {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Team;