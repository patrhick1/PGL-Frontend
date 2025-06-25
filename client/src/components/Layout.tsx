import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Bell, Wifi, WifiOff } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const authToken = user ? 'dummy-token' : null; // Replace with actual token logic
  
  const { 
    notifications, 
    isConnected, 
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
        
        {/* Notification Status Bar */}
        {user && (
          <div className="bg-white border-b px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Real-time updates active</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">Connecting to real-time updates...</span>
                    </>
                  )}
                </div>
              </div>
              
              {notificationCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <Badge variant="secondary" className="text-xs">
                    {notificationCount} notifications
                  </Badge>
                </div>
              )}
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
