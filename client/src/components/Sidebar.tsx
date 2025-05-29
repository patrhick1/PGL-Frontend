// client/src/components/Sidebar.tsx
import { Link, useLocation } from "wouter";
import { 
  BarChart3, Search, FolderOpen, Lightbulb, CheckCircle, TrendingUp, Settings, LogOut, Mic, Shield, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the type for a navigation item
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType; // Lucide icons are components
  adminOnly?: boolean; // Optional flag for admin-only links
}

// Placeholder navigation arrays
const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Search", href: "/search", icon: Search },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Tasks", href: "/tasks", icon: CheckCircle },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Admin Panel", href: "/admin", icon: Shield, adminOnly: true }, // Example admin link
];

const accountNavigation: NavigationItem[] = [
  { name: "My Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/auth/logout", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      queryClient.clear();
      setLocation("/login", { replace: true });
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Could not log out.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const isAdmin = user?.role === "admin";

  // Filter navigation items based on admin status
  const filteredNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

  if (!isAuthenticated) {
    return null;
  }

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
          <ul className="space-y-1">
            {filteredNavigation.map((item: NavigationItem) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      `}
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
          <ul className="space-y-1">
            {accountNavigation.map((item: NavigationItem) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      `}
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