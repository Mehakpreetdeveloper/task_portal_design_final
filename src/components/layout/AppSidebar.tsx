import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  FolderOpen,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  User,
  BarChart3,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut, profile, isAdmin, isProjectManager } = useAuth();

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  
  const getNavCls = ({ isActive: active }: { isActive: boolean }) =>
    active ? 'bg-orange text-white-color font-medium' : 'hover:bg-grey-color text-black';

  const mainItems = [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Projects', url: '/projects', icon: FolderOpen },
    { title: 'Tasks', url: '/tasks', icon: CheckSquare },
    { title: 'Calendar', url: '/calendar', icon: Calendar },
    { title: 'Team', url: '/team', icon: Users },
  ];


  const handleSignOut = async () => {
    await signOut();
  };

  const collapsed = state === 'collapsed';

  return (
    <Sidebar className={`${collapsed ? 'w-14' : 'w-64'} bg-blue-color border-r border-grey-color`} collapsible="icon">
      <SidebarHeader className="border-b border-grey-color p-[0.6rem] py-4 bg-blue-color">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img src="/sm-fav-icon-1.png" alt="Check Square" className="h-6 w-6" />
            <span className="font-bold text-lg text-primary">SmartzMinds Tasks</span>
          </div>
        )}
        {collapsed && (
          <img src="/sm-fav-icon-1.png" alt="Check Square" className="h-6 w-auto" />
        )}
      </SidebarHeader>

      <SidebarContent className="bg-blue-color">
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/profile" className={getNavCls}>
                    <User className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" className={getNavCls}>
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-grey-color p-2 bg-blue-color">
        {!collapsed && profile && (
          <div className="mb-4">
            <p className="text-sm font-medium text-white-color">
              {profile.first_name} {profile.last_name}
            </p>
          </div>
        )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className={`w-full text-white-color ${collapsed ? "justify-center px-2" : "justify-start px-3"}`}
      >
        <LogOut className={`${collapsed ? "" : "mr-2"} h-4 w-4`} />
        {!collapsed && <span>Sign Out</span>}
      </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;