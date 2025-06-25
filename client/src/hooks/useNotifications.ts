import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NotificationManager, requestNotificationPermission, showBrowserNotification } from '@/lib/notificationManager';

interface NotificationData {
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  campaign_id?: string;
  data?: any;
}

interface UseNotificationsProps {
  authToken: string | null;
  campaignId?: string | null;
  enableBrowserNotifications?: boolean;
}

export const useNotifications = ({ 
  authToken, 
  campaignId = null, 
  enableBrowserNotifications = true 
}: UseNotificationsProps) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const managerRef = useRef<NotificationManager | null>(null);
  const { toast } = useToast();

  // Request browser notification permission on mount
  useEffect(() => {
    if (enableBrowserNotifications) {
      requestNotificationPermission().then(setHasPermission);
    }
  }, [enableBrowserNotifications]);

  const handleNotification = useCallback((notification: NotificationData) => {
    // Add to notifications list (keep last 50)
    setNotifications(prev => [notification, ...prev.slice(0, 49)]);
    
    // Show toast notification
    const toastVariant = notification.priority === 'high' ? 'destructive' : 
                        notification.priority === 'medium' ? 'default' : 'default';
    
    toast({
      title: notification.title,
      description: notification.message,
      variant: toastVariant,
      duration: notification.priority === 'high' ? 8000 : 4000,
    });
    
    // Show browser notification if enabled and permission granted
    if (enableBrowserNotifications && hasPermission) {
      showBrowserNotification(notification);
    }
    
    console.log('🔔 Notification processed:', notification);
  }, [toast, enableBrowserNotifications, hasPermission]);

  // Initialize notification manager
  useEffect(() => {
    if (!authToken) {
      return;
    }

    const manager = new NotificationManager(authToken, campaignId);
    managerRef.current = manager;
    
    // Set up event handlers
    manager.onConnectionEstablished = () => {
      setIsConnected(true);
      console.log('✅ Notifications connected');
    };
    
    manager.onNotificationReceived = handleNotification;
    
    manager.onConnectionClosed = () => {
      setIsConnected(false);
      console.log('❌ Notifications disconnected');
    };
    
    manager.onError = (error) => {
      console.error('Notification error:', error);
      setIsConnected(false);
    };
    
    // Connect
    manager.connect();
    
    // Keep connection alive with ping
    const pingInterval = setInterval(() => {
      if (manager.isConnected()) {
        manager.sendPing();
      }
    }, 30000); // Ping every 30 seconds
    
    // Cleanup
    return () => {
      clearInterval(pingInterval);
      manager.disconnect();
      setIsConnected(false);
    };
  }, [authToken, campaignId, handleNotification]);

  const subscribeToCampaign = useCallback((newCampaignId: string) => {
    if (managerRef.current) {
      managerRef.current.subscribeToCampaign(newCampaignId);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    hasPermission,
    subscribeToCampaign,
    clearNotifications,
    notificationCount: notifications.length
  };
};