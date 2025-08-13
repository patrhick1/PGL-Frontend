import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { NylasAuthStatus } from '@/types/inbox';

export function useNylas() {
  const { toast } = useToast();

  // Check Nylas connection status
  const { data: nylasStatus, isLoading } = useQuery<NylasAuthStatus>({
    queryKey: ['/inbox/nylas-status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Send pitch via Nylas
  const sendPitchViaNylas = useMutation({
    mutationFn: async (pitchGenId: string) => {
      const res = await apiRequest('POST', `/pitches/send-nylas/${pitchGenId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to send pitch');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pitch sent successfully',
        description: 'Your pitch has been sent via your connected email account.',
      });
      queryClient.invalidateQueries({ queryKey: ['/pitches'] });
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send pitch',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Send pitch via Instantly (fallback)
  const sendPitchViaInstantly = useMutation({
    mutationFn: async (pitchGenId: string) => {
      const res = await apiRequest('POST', `/pitches/send-instantly/${pitchGenId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to send pitch');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pitch sent successfully',
        description: 'Your pitch has been sent via Instantly.',
      });
      queryClient.invalidateQueries({ queryKey: ['/pitches'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send pitch',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Connect Nylas account
  const connectNylas = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/inbox/nylas/connect');
      if (!res.ok) throw new Error('Failed to initialize Nylas connection');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.auth_url) {
        // Redirect to Nylas OAuth flow
        window.location.href = data.auth_url;
      }
    },
    onError: () => {
      toast({
        title: 'Connection failed',
        description: 'Failed to connect to email service. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Disconnect Nylas
  const disconnectNylas = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/inbox/nylas/disconnect');
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Disconnected',
        description: 'Your email account has been disconnected.',
      });
      queryClient.invalidateQueries({ queryKey: ['/inbox/nylas-status'] });
    }
  });

  return {
    nylasStatus,
    isNylasConnected: nylasStatus?.connected === true,
    isLoading,
    sendPitchViaNylas,
    sendPitchViaInstantly,
    connectNylas,
    disconnectNylas,
  };
}