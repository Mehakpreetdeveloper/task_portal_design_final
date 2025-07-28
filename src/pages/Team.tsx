import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Plus, Search, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockTeamMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    department: 'Engineering',
    location: 'San Francisco, CA',
    phone: '+1 (555) 123-4567',
    avatar: '',
    activeTasks: 5,
    completedTasks: 23,
    joinDate: '2023-01-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'user',
    department: 'Design',
    location: 'New York, NY',
    phone: '+1 (555) 234-5678',
    avatar: '',
    activeTasks: 3,
    completedTasks: 18,
    joinDate: '2023-03-22',
    status: 'active',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'user',
    department: 'Engineering',
    location: 'Austin, TX',
    phone: '+1 (555) 345-6789',
    avatar: '',
    activeTasks: 7,
    completedTasks: 31,
    joinDate: '2022-11-08',
    status: 'active',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    role: 'user',
    department: 'Marketing',
    location: 'Los Angeles, CA',
    phone: '+1 (555) 456-7890',
    avatar: '',
    activeTasks: 2,
    completedTasks: 15,
    joinDate: '2023-05-10',
    status: 'active',
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@example.com',
    role: 'user',
    department: 'Engineering',
    location: 'Seattle, WA',
    phone: '+1 (555) 567-8901',
    avatar: '',
    activeTasks: 0,
    completedTasks: 8,
    joinDate: '2023-08-15',
    status: 'inactive',
  },
];

const Team = () => {
  const { user } = useAuth();

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "default",
      user: "secondary",
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "secondary",
      inactive: "outline",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search team members..." className="pl-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTeamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {member.department}
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
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit Role</DropdownMenuItem>
                      <DropdownMenuItem>Send Message</DropdownMenuItem>
                      <DropdownMenuItem>Remove Member</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="mr-2 h-4 w-4" />
                        {member.email}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="mr-2 h-4 w-4" />
                        {member.phone}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        {member.location}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{member.activeTasks}</div>
                        <div className="text-xs text-muted-foreground">Active Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary-foreground">{member.completedTasks}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Joined {new Date(member.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Team;