import * as React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppSidebar from './AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

return (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <header className="flex items-center justify-between border-b bg-blue-color p-2 md:p-[0.6rem] sticky top-0 z-50">
          <div className="flex items-center">
            <SidebarTrigger className="mr-2" />
            <span className="font-bold text-sm md:text-lg text-primary">SmartzMinds Task Portal</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white-color hover:bg-white-color/10 h-8 w-8 md:h-10 md:w-10">
                  <Bell className="h-4 w-4 md:h-5 md:w-5 mt-1.5" />
                  <span className="absolute -top-[0.25px] left-4 md:left-5 -right-1 h-3 w-3 md:h-4 md:w-4 bg-primary-color text-white-color text-[10px] md:text-xs rounded-full flex items-center justify-center mt-1.5">
                    3
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 md:w-80 p-0 !mr-10 md:mr-0">
                <div className="p-3 md:p-4 border-b">
                  <h4 className="font-semibold text-sm md:text-base">Notifications</h4>
                </div>
                <div className="p-3 md:p-4 space-y-3">
                  <div className="text-xs md:text-sm">
                    <div className="font-medium">New task assigned</div>
                    <div className="text-muted-foreground">You have been assigned a new task</div>
                  </div>
                  <div className="text-xs md:text-sm">
                    <div className="font-medium">Project deadline approaching</div>
                    <div className="text-muted-foreground">Project Alpha deadline is in 2 days</div>
                  </div>
                  <div className="text-xs md:text-sm">
                    <div className="font-medium">Team meeting scheduled</div>
                    <div className="text-muted-foreground">Weekly team sync at 2 PM today</div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white-color/10">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 md:w-64 p-0 mr-2 md:mr-0" align="end">
                <div className="p-3 md:p-4 border-b">
                  <div className="font-medium text-sm">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : user?.email
                    }
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                </div>
                <div className="p-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm" 
                    onClick={() => window.location.href = '/profile'}
                  >
                    <Avatar className="mr-2 h-4 w-4">
                      <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                    </Avatar>
                    My Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-sm" 
                    onClick={signOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Scrollable Main */}
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <AppSidebar /> 

          {/* Main Content */}
          <main className="flex-1 p-3 md:p-6 bg-grey-color overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  </SidebarProvider>
);

};

export default AppLayout;