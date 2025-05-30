// client/src/components/Sidebar.tsx (Conceptual additions)
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Search, 
  FolderOpen, 
  Lightbulb, 
  CheckCircle, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Mic, 
  Shield, 
  User,
  ClipboardList, 
  BookOpen, 
  Users as ClientsIcon, 
  LayoutGrid,
  Sparkles,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// --- CLIENT NAVIGATION ---
const clientNavigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: BarChart3, roles: ['client'] },
  { name: "My Campaigns", href: "/my-campaigns", icon: FolderOpen, roles: ['client'] }, // New page for clients to see their campaigns
  { name: "Profile & Content", href: "/profile-setup", icon: ClipboardList, roles: ['client'] }, // Combines Questionnaire & Media Kit URL
  // { name: "AI Bio & Angles", href: "/angles-generator", icon: Lightbulb, roles: ['client'] }, // Can be part of Profile & Content or Campaign Detail
  { name: "Approve Matches", href: "/approvals?filter=matches", icon: CheckCircle, roles: ['client'] }, // Filtered view
  { name: "Track Placements", href: "/placement-tracking", icon: TrendingUp, roles: ['client'] },
];

// --- INTERNAL STAFF/ADMIN NAVIGATION ---
const internalNavigationItems: NavigationItem[] = [
  { name: "Team Dashboard", href: "/", icon: LayoutGrid, roles: ['staff', 'admin'] },
  { name: "Client & Campaigns", href: "/campaign-management", icon: ClientsIcon, roles: ['staff', 'admin'] }, // Central hub for staff
  { name: "Podcast Discovery", href: "/discover", icon: Search, roles: ['staff', 'admin'] },
  // AI Content Tools might be integrated into Campaign Management flow rather than separate top-level
  // { name: "AI Content Tools", href: "/content-creator", icon: Sparkles, roles: ['staff', 'admin'] }, 
  { name: "Pitch Outreach", href: "/pitch-outreach", icon: Send, roles: ['staff', 'admin'] }, // New page for pitch lifecycle
  { name: "Placement Tracking", href: "/placement-tracking", icon: TrendingUp, roles: ['staff', 'admin'] },
  { name: "Admin Panel", href: "/admin", icon: Shield, roles: ['admin'] }, // User mgmt, System settings
];

const accountNavigationItems: NavigationItem[] = [
  { name: "My Settings", href: "/settings", icon: Settings, roles: ['client', 'staff', 'admin'] },
];

export default function Sidebar() {
  // ... (useAuth, logoutMutation, etc. as before) ...
  const { user, isAuthenticated } = useAuth();
  // ...

  if (!isAuthenticated || !user) return null;

  const userRole = user.role;
  let currentNavigation: NavigationItem[];
  let currentAccountNav = accountNavigationItems; // Settings is for all

  if (userRole === 'client') {
    currentNavigation = clientNavigationItems;
  } else if (userRole === 'staff' || userRole === 'admin') {
    currentNavigation = internalNavigationItems.filter(item => !item.roles || item.roles.includes(userRole as 'staff' | 'admin'));
  } else {
    currentNavigation = [];
  }

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: Array<'client' | 'staff' | 'admin'>; // Specify which roles can see this
  adminOnly?: boolean; // Kept for backward compatibility or simpler admin checks
}

// Define navigation items with role-based visibility
const clientNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: BarChart3, roles: ['client'] },
  { name: "Questionnaire", href: "/questionnaire", icon: ClipboardList, roles: ['client'] },
  { name: "Bio & Angles", href: "/angles-generator", icon: Lightbulb, roles: ['client'] },
  // { name: "My Media Kit", href: "/media-kit", icon: BookOpen, roles: ['client'] }, // If client manages their kit URL
  { name: "Approvals", href: "/approvals", icon: CheckCircle, roles: ['client'] },
  { name: "My Placements", href: "/placement-tracking", icon: TrendingUp, roles: ['client'] },
];

const internalStaffNavigation: NavigationItem[] = [
  { name: "Internal Dashboard", href: "/", icon: LayoutGrid, roles: ['staff', 'admin'] }, // Different dashboard for staff
  { name: "Campaigns", href: "/campaigns-management", icon: FolderOpen, roles: ['staff', 'admin'] }, // Manage all campaigns
  { name: "Podcast Discovery", href: "/discover", icon: Search, roles: ['staff', 'admin'] }, // Global discovery tool
  { name: "Approvals Queue", href: "/approvals", icon: CheckCircle, roles: ['staff', 'admin'] }, // All approvals
  { name: "Placement Tracking", href: "/placement-tracking", icon: TrendingUp, roles: ['staff', 'admin'] }, // All placements
  // AdminPanel.tsx is likely where user/client management happens
  { name: "Admin Panel", href: "/admin", icon: Shield, roles: ['admin'] }, // Admin only
];

const accountNavigation: NavigationItem[] = [
  // { name: "My Profile", href: "/profile", icon: User }, // Settings page now handles profile
  { name: "Settings", href: "/settings", icon: Settings, roles: ['client', 'staff', 'admin'] },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth(); // user contains role and person_id
  const { toast } = useToast();

  const logoutMutation = useMutation({ /* ... same as before ... */ });
  const handleLogout = () => logoutMutation.mutate();

  if (!isAuthenticated || !user) {
    return null; // Or a loading state if user is still loading
  }

  const userRole = user.role; // 'client', 'staff', or 'admin'

  let currentNavigation: NavigationItem[];
  if (userRole === 'client') {
    currentNavigation = clientNavigation;
  } else if (userRole === 'staff' || userRole === 'admin') {
    currentNavigation = internalStaffNavigation.filter(item => 
        item.roles?.includes(userRole as 'staff' | 'admin')
    );
  } else {
    currentNavigation = []; // Should not happen if authenticated
  }
  
  const currentAccountNavigation = accountNavigation.filter(item => item.roles?.includes(userRole as 'client' | 'staff' | 'admin'));


  return (
    <aside className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Mic className="text-sidebar-primary-foreground text-sm" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">PGL CRM</h1>
        </div>
      </div>
      
      <nav className="mt-6 flex-1 flex flex-col justify-between">
        <div className="px-3">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {userRole === 'client' ? 'Client Menu' : 'Team Menu'}
          </p>
          <ul className="space-y-1">
            {currentNavigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="mt-auto p-3 border-t border-sidebar-border">
           <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account</p>
          <ul className="space-y-1">
            {currentAccountNavigation.map((item) => {
              // ... same rendering logic as main navigation ...
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </a>
                  </Link>
                </li>
              );
            })}
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3 py-2 text-sm font-medium"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-3 h-4 w-4" />
                {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
              </Button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}