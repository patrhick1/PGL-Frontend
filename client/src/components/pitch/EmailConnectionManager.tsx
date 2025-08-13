import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, AlertCircle, Loader2, LogOut, Link2 } from 'lucide-react';
import { usePitchSending } from '@/hooks/usePitchSending';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export function EmailConnectionManager() {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  
  const { 
    isEmailConnected, 
    connectedEmail, 
    isLoadingStatus, 
    connectEmail,
    disconnectEmail,
    isDisconnecting
  } = usePitchSending();

  const handleDisconnect = () => {
    setShowDisconnectDialog(false);
    disconnectEmail();
  };

  if (isLoadingStatus) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Checking Gmail connection status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEmailConnected) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Gmail Connected
            </CardTitle>
            <CardDescription>
              Your Gmail account is connected and ready to send pitches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Connected Account</p>
                <p className="text-sm text-gray-600">{connectedEmail}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisconnectDialog(true)}
                disabled={isDisconnecting}
                className="gap-2"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Pitches will be sent directly from your Gmail account via secure OAuth 2.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Gmail Account?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disconnect your Gmail account ({connectedEmail})?
                <br /><br />
                You'll need to reconnect your Gmail account to send pitches directly from the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Gmail Not Connected
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to send pitches directly from the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            Connecting your Gmail allows you to:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Send pitches directly from your Gmail account
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Track sent emails and responses in your inbox
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Maintain your email reputation and sender identity
            </li>
          </ul>
        </div>
        
        <Button 
          onClick={connectEmail}
          className="w-full gap-2"
          size="lg"
        >
          <Mail className="h-5 w-5" />
          Connect Gmail Account
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          Uses secure OAuth 2.0 authentication. We never store your password.
        </p>
      </CardContent>
    </Card>
  );
}