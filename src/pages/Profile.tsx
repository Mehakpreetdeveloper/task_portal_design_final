import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, UserX, Camera } from 'lucide-react';

const Profile = () => {
  const { user, profile, userRoles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userStatus, setUserStatus] = useState<{
    status: 'available' | 'busy' | 'on_leave' | 'offline';
    status_message: string | null;
  } | null>(null);
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phoneNumber: profile?.phone_number || '',
    userType: profile?.user_type || 'Developer',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUserStatus();
  }, [user]);

  const fetchUserStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('status, status_message')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setUserStatus({
          status: data.status as 'available' | 'busy' | 'on_leave' | 'offline',
          status_message: data.status_message
        });
      }
    } catch (error: any) {
      console.error('Error fetching user status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          user_type: formData.userType,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user!.id}/avatar.${fileExt}`;

      // Delete existing avatar if it exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user!.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user!.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Avatar Updated',
        description: 'Your profile photo has been updated successfully.',
      });

      // Refresh the page to show the new avatar
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const updateUserStatus = async (status: 'available' | 'busy' | 'on_leave' | 'offline') => {
    if (!user) return;

    setStatusLoading(true);
    try {
      // First check if user status exists
      const { data: existingStatus } = await supabase
        .from('user_status')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingStatus) {
        // Update existing status
        const { error } = await supabase
          .from('user_status')
          .update({
            status,
            status_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new status
        const { error } = await supabase
          .from('user_status')
          .insert({
            user_id: user.id,
            status,
            status_message: null,
          });

        if (error) throw error;
      }

      setUserStatus({ status, status_message: null });
      
      toast({
        title: "Status Updated",
        description: `Your status has been updated to ${getStatusLabel(status)}.`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
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

  const getInitials = () => {
    const first = profile?.first_name?.[0] || '';
    const last = profile?.last_name?.[0] || '';
    return (first + last).toUpperCase() || user?.email?.[0].toUpperCase() || '?';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and account settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Personal Information
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                type="button"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Update your personal details and contact information.' : 'Your personal information and contact details.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer">
                        <Avatar className="h-20 w-20 hover:opacity-80 transition-opacity">
                          <AvatarImage src={profile?.avatar_url || ''} />
                          <AvatarFallback className="text-lg">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <div className="flex justify-center">
                        <Avatar className="h-80 w-80">
                          <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                          <AvatarFallback className="text-6xl">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors">
                          <Camera className="h-4 w-4" />
                        </div>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={uploadAvatar}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed from this page.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Enter your phone number"
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label>User Type</Label>
                <Select
                  value={formData.userType}
                  onValueChange={(value: 'Designer' | 'Marketing' | 'Developer' | 'WordPress' | 'Shopify') => 
                    setFormData({ ...formData, userType: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-muted" : ""}>
                    <SelectValue placeholder="Select your user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="WordPress">WordPress</SelectItem>
                    <SelectItem value="Shopify">Shopify</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isEditing && (
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Updating...' : 'Save Changes'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Settings</CardTitle>
              <CardDescription>
                Set your current availability status for your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  {userStatus ? (
                    <>
                      {getStatusIcon(userStatus.status)}
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(userStatus.status)}`}></div>
                      <span className="text-sm">{getStatusLabel(userStatus.status)}</span>
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 text-gray-600" />
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      <span className="text-sm text-muted-foreground">No status set</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Update Your Status</Label>
                <Select
                  onValueChange={(value: 'available' | 'busy' | 'on_leave' | 'offline') => 
                    updateUserStatus(value)
                  }
                  disabled={statusLoading}
                >
                  <SelectTrigger>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and role information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">User ID</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {user?.id}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Role</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {userRoles.length > 0 ? (
                    userRoles.map((userRole) => (
                      <Badge key={userRole.id} variant="secondary">
                        {userRole.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No roles assigned</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Role cannot be changed from this page.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Profile Created</Label>
                <p className="text-sm text-muted-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;