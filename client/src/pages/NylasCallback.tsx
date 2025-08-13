import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Loader2,
  Mail,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NylasCallback() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successEmail, setSuccessEmail] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      // Get parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setStatus('error');
        setErrorMessage(errorDescription || 'Authorization was denied or failed.');
        toast({
          title: 'Connection Failed',
          description: errorDescription || 'Unable to connect your email account.',
          variant: 'destructive',
        });
        return;
      }

      // Check for missing parameters
      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing authorization code or state parameter.');
        toast({
          title: 'Invalid Request',
          description: 'The authorization request is missing required parameters.',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Exchange code for grant_id
        const response = await apiRequest(
          'GET',
          `/inbox/nylas/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to complete email connection');
        }

        const data = await response.json();

        // Check for success using either 'success' or 'status' field
        if (data.success || data.status === 'success') {
          setStatus('success');
          setSuccessEmail(data.email || 'your email');
          
          // Invalidate queries to refresh inbox data
          queryClient.invalidateQueries({ queryKey: ['/inbox/nylas-status'] });
          queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
          
          toast({
            title: 'Email Connected!',
            description: `Successfully connected ${data.email || 'your email account'}.`,
          });

          // Redirect based on redirect_url or default to inbox
          setTimeout(() => {
            if (data.redirect_url) {
              // Parse the redirect URL and navigate to the path
              const url = new URL(data.redirect_url);
              setLocation(url.pathname + url.search);
            } else {
              setLocation('/inbox');
            }
          }, 2000);
        } else {
          throw new Error(data.error || data.message || 'Connection failed');
        }
      } catch (error) {
        console.error('Nylas callback error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        
        toast({
          title: 'Connection Failed',
          description: error instanceof Error ? error.message : 'Failed to connect your email account.',
          variant: 'destructive',
        });
      }
    };

    handleCallback();
  }, [setLocation, toast]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Connecting Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we complete the connection...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Email Connected Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  {successEmail} has been connected to your account.
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to your inbox...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Connection Failed</CardTitle>
              <CardDescription>Unable to connect your email account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => setLocation('/inbox')}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/settings')}
              className="w-full"
            >
              Go to Settings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>If you continue to experience issues, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}