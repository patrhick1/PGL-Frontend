import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const authToken = user ? 'dummy-token' : null; // Replace with actual token logic
  
  const { 
    notifications, 
    notificationCount 
  } = useNotifications({ 
    authToken, 
    enableBrowserNotifications: true 
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        
        {/* Notification Count Bar */}
        {user && notificationCount > 0 && (
          <div className="bg-white border-b px-6 py-2">
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <Badge variant="secondary" className="text-xs">
                  {notificationCount} notifications
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
