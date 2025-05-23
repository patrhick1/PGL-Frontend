import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Search, 
  ClipboardList, 
  FolderOpen, 
  Lightbulb, 
  CheckCircle, 
  TrendingUp, 
  Settings, 
  LogOut,
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Discover Podcasts", href: "/discover", icon: Search },
  { name: "Questionnaire", href: "/questionnaire", icon: ClipboardList },
  { name: "Media Kit", href: "/media-kit", icon: FolderOpen },
  { name: "Pitch Generator", href: "/pitch-generator", icon: Lightbulb },
  { name: "Approvals", href: "/approvals", icon: CheckCircle },
  { name: "Placement Tracking", href: "/tracking", icon: TrendingUp },
];

const accountNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Mic className="text-white text-sm" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">PodcastCRM</h1>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
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
        
        <div className="mt-8 px-3">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Account
          </h3>
          <ul className="mt-3 space-y-1">
            {accountNavigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
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
                className="w-full justify-start text-gray-700 hover:bg-gray-100 px-3 py-2 text-sm font-medium"
                onClick={() => window.location.href = "/api/logout"}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </Button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
