import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Shield, Crown, Star, Eye, X, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Profile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
};

type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'project_manager' | 'team_lead' | 'user';
  created_at: string;
};

type UserStatus = {
  id: string;
  user_id: string;
  status: 'available' | 'busy' | 'on_leave' | 'offline';
  status_message: string | null;
  created_at: string;
  updated_at: string;
};

type TeamMember = Profile & {
  user_roles: UserRole[];
  user_status: UserStatus | null;
  email?: string;
};

const Team = () => {
  const { user, isAdmin, isProjectManager } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const { data: statusData, error: statusError } = await supabase
        .from('user_status')
        .select('*');

      if (statusError) throw statusError;

      // Fetch auth users for email addresses  
      const { data: authUsersData } = await supabase.auth.admin.listUsers();
      
      // Combine profiles with their roles and status
      const membersWithRoles: TeamMember[] = (profilesData || []).map(profile => {
        const userRoles = (rolesData || []).filter(role => role.user_id === profile.user_id);
        const userStatus = (statusData || []).find(status => status.user_id === profile.user_id);
        const authUser = authUsersData?.users?.find((u: any) => u.id === profile.user_id);
        
        return {
          ...profile,
          user_roles: userRoles as UserRole[],
          user_status: userStatus ? {
            ...userStatus,
            status: userStatus.status as 'available' | 'busy' | 'on_leave' | 'offline'
          } : null,
          email: authUser?.email || undefined,
        };
      });

      setTeamMembers(membersWithRoles);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (status: 'available' | 'busy' | 'on_leave' | 'offline', statusMessage?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: user.id,
          status,
          status_message: statusMessage || null,
        });

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Your status has been updated to ${getStatusLabel(status)}.`,
      });

      // Refresh the team members list
      fetchTeamMembers();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'project_manager':
        return 'default';
      case 'team_lead':
        return 'secondary';
      case 'user':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'project_manager':
        return <Shield className="h-3 w-3" />;
      case 'team_lead':
        return <Star className="h-3 w-3" />;
      case 'user':
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'project_manager':
        return 'Project Manager';
      case 'team_lead':
        return 'Team Lead';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  const getStatusColor = (status: 'available' | 'busy' | 'on_leave' | 'offline') => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'on_leave':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: 'available' | 'busy' | 'on_leave' | 'offline') => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'on_leave':
        return 'On Leave';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: 'available' | 'busy' | 'on_leave' | 'offline') => {
    switch (status) {
      case 'available':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'busy':
        return <UserCheck className="h-4 w-4 text-yellow-600" />;
      case 'on_leave':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'offline':
        return <UserX className="h-4 w-4 text-gray-600" />;
      default:
        return <UserX className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPrimaryRole = (member: TeamMember) => {
    if (member.user_roles.length === 0) return 'user';
    
    // Return the highest priority role
    const rolePriority = { admin: 4, project_manager: 3, team_lead: 2, user: 1 };
    return member.user_roles.reduce((highest, current) => {
      return rolePriority[current.role] > rolePriority[highest] ? current.role : highest;
    }, member.user_roles[0].role);
  };

  const handleShowDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedMember(null);
  };

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    if (filterRole === 'all') return true;
    return member.user_roles.some(role => role.role === filterRole);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            View team members, their roles and current status.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Status Update Section for Current User */}
      {/* {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update Your Status</CardTitle>
            <CardDescription>
              Let your team know your current availability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label>Set Your Status</Label>
                <Select
                  onValueChange={(value: 'available' | 'busy' | 'on_leave' | 'offline') => 
                    updateUserStatus(value)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select your status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">✅ Available</SelectItem>
                    <SelectItem value="busy">🟡 Busy</SelectItem>
                    <SelectItem value="on_leave">🔴 On Leave</SelectItem>
                    <SelectItem value="offline">⚫ Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Filter by Role</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No team members found</h3>
              <p className="text-sm text-muted-foreground">
                No members match the selected filter criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => {
            const primaryRole = getPrimaryRole(member);
            return (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {member.first_name} {member.last_name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRoleColor(primaryRole)} className="flex items-center space-x-1">
                          {getRoleIcon(primaryRole)}
                          <span>{getRoleLabel(primaryRole)}</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.user_status ? getStatusIcon(member.user_status.status) : <UserX className="h-4 w-4 text-gray-600" />}
                      <div className={`w-3 h-3 rounded-full ${member.user_status ? getStatusColor(member.user_status.status) : 'bg-gray-400'}`}></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Status: </span>
                        <span className="text-muted-foreground">
                          {member.user_status ? getStatusLabel(member.user_status.status) : 'No status set'}
                        </span>
                      </div>
                      
                      {member.user_status?.status_message && (
                        <div className="text-sm">
                          <span className="font-medium">Message: </span>
                          <span className="text-muted-foreground">
                            {member.user_status.status_message}
                          </span>
                        </div>
                      )}
                      
                      {member.user_roles.length > 1 && (
                        <div className="text-sm">
                          <span className="font-medium">Additional Roles:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.user_roles.filter(role => role.role !== primaryRole).map((role) => (
                              <Badge key={role.id} variant="outline" className="text-xs">
                                {getRoleLabel(role.role)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Member since {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleShowDetails(member)}
                      variant="outline" 
                      size="sm"
                      className="w-full mt-4"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Show Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Member Details Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Team Member Details
              <SheetClose asChild>
                <Button variant="ghost" size="sm" onClick={handleCloseDrawer}>
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </SheetTitle>
          </SheetHeader>
          
          {selectedMember && (
            <div className="mt-6 space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    {selectedMember.avatar_url ? (
                      <img 
                        src={selectedMember.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedMember.first_name} {selectedMember.last_name}
                    </h3>
                    <p className="text-muted-foreground">Team Member</p>
                  </div>
                </div>
              </div>

              {/* Role Section */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Role</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.user_roles.map((role) => (
                    <Badge key={role.id} variant={getRoleColor(role.role)} className="flex items-center space-x-1">
                      {getRoleIcon(role.role)}
                      <span>{getRoleLabel(role.role)}</span>
                    </Badge>
                  ))}
                  {selectedMember.user_roles.length === 0 && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>User</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Status</h4>
                <div className="flex items-center space-x-3">
                  {selectedMember.user_status ? (
                    <>
                      {getStatusIcon(selectedMember.user_status.status)}
                      <span className="font-medium">{getStatusLabel(selectedMember.user_status.status)}</span>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedMember.user_status.status)}`}></div>
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 text-gray-600" />
                      <span className="text-muted-foreground">No status set</span>
                    </>
                  )}
                </div>
                {selectedMember.user_status?.status_message && (
                  <p className="text-sm text-muted-foreground">
                    "{selectedMember.user_status.status_message}"
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Contact Information</h4>
                <div className="space-y-3">
                  {selectedMember.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.email}</span>
                    </div>
                  )}
                  {selectedMember.phone_number && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.phone_number}</span>
                    </div>
                  )}
                  {!selectedMember.email && !selectedMember.phone_number && (
                    <p className="text-sm text-muted-foreground">No contact information available</p>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Additional Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since:</span>
                    <span>{new Date(selectedMember.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{new Date(selectedMember.updated_at).toLocaleDateString()}</span>
                  </div>
                  {selectedMember.user_status && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status Updated:</span>
                      <span>{new Date(selectedMember.user_status.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Team;