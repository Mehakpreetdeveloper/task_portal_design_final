import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Users,
  Bell,
  Menu
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Overview & Analytics"
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
    description: "Task Management"
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
    description: "Project Management"
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
    description: "Team Members"
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    description: "Updates & Alerts"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200";
    if (isActive(path)) {
      return `${baseClasses} bg-gradient-to-r from-primary/10 to-primary-glow/10 text-primary border-l-4 border-primary font-medium shadow-sm`;
    }
    return `${baseClasses} text-muted-foreground hover:text-foreground hover:bg-muted/50`;
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} border-r border-border bg-card shadow-lg transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 px-3">
            {!collapsed && (
              <>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <Menu className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    TaskFlow Admin
                  </h1>
                  <p className="text-xs text-muted-foreground">Management Panel</p>
                </div>
              </>
            )}
            {collapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto">
                <Menu className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "text-xs font-semibold text-muted-foreground px-3 mb-2"}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
                      <item.icon className={`${collapsed ? "w-5 h-5" : "w-5 h-5"} flex-shrink-0`} />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto pt-6">
            <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 p-4 rounded-lg border border-primary/10">
              <h3 className="text-sm font-semibold text-foreground mb-1">Need Help?</h3>
              <p className="text-xs text-muted-foreground mb-3">Check our documentation for guidance</p>
              <button className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-xs py-2 px-3 rounded-md hover:shadow-md transition-shadow">
                View Docs
              </button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}