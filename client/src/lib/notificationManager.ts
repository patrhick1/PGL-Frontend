interface NotificationData {
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  campaign_id?: string;
  data?: any;
}

export class NotificationManager {
  private ws: WebSocket | null = null;
  private authToken: string;
  private campaignId: string | null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Callback functions
  public onConnectionEstablished?: () => void;
  public onNotificationReceived?: (notification: NotificationData) => void;
  public onConnectionClosed?: () => void;
  public onError?: (error: Event) => void;

  constructor(authToken: string, campaignId: string | null = null) {
    this.authToken = authToken;
    this.campaignId = campaignId;
  }

  connect() {
    try {
      // Use the backend API URL for WebSocket connection
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const apiHost = new URL(apiUrl).host;
      
      const params = new URLSearchParams({
        token: this.authToken,
        ...(this.campaignId && { campaign_id: this.campaignId })
      });
      
      const wsUrl = `${wsProtocol}//${apiHost}/notifications/ws?${params}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔗 Real-time notifications connected');
        this.reconnectAttempts = 0;
        this.onConnectionEstablished?.();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const notification: NotificationData = JSON.parse(event.data);
          console.log('📢 Received notification:', notification);
          this.onNotificationReceived?.(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('🔌 Notification connection closed');
        this.onConnectionClosed?.();
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ Notification connection error:', error);
        this.onError?.(error);
      };
      
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`🔄 Reconnecting in ${delay / 1000}s... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached. Please refresh the page.');
    }
  }

  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  subscribeToCampaign(campaignId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_campaign',
        campaign_id: campaignId
      }));
    }
    this.campaignId = campaignId;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Browser notification functions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showBrowserNotification = (notification: NotificationData) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const browserNotif = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.type,
      data: notification.data,
      requireInteraction: notification.priority === 'high'
    });
    
    browserNotif.onclick = () => {
      window.focus();
      
      // Navigate based on notification type
      if (notification.type === 'review_ready' && notification.campaign_id) {
        window.location.href = `/approvals?campaign=${notification.campaign_id}`;
      } else if (notification.type === 'discovery_completed') {
        window.location.href = '/approvals';
      }
      
      browserNotif.close();
    };
    
    // Auto-close after 5 seconds for non-critical notifications
    if (notification.priority !== 'high') {
      setTimeout(() => browserNotif.close(), 5000);
    }
  }
};