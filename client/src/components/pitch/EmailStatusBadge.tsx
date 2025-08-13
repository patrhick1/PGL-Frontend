import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { usePitchSending } from '@/hooks/usePitchSending';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface EmailStatusBadgeProps {
  showConnectButton?: boolean;
  compact?: boolean;
  showDisconnect?: boolean;
}

export function EmailStatusBadge({ 
  showConnectButton = true,
  compact = false,
  showDisconnect = false
}: EmailStatusBadgeProps) {
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
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Checking Gmail status...</span>
      </div>
    );
  }

  if (isEmailConnected) {
    const badge = (
      <Badge variant="outline" className="gap-1.5 border-green-200 bg-green-50 text-green-700">
        <CheckCircle className="h-3.5 w-3.5" />
        {compact ? 'Gmail' : 'Gmail Connected'}
      </Badge>
    );

    if (showDisconnect) {
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0">
                <div className="flex items-center gap-2">
                  {badge}
                  {!compact && connectedEmail && (
                    <span className="text-sm text-gray-600">{connectedEmail}</span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Gmail Account</p>
                <p className="text-xs text-gray-500">{connectedEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDisconnectDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Gmail Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to disconnect your Gmail account ({connectedEmail})?
                  <br /><br />
                  You'll need to reconnect to send pitches directly from the platform.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {badge}
              {!compact && connectedEmail && (
                <span className="text-sm text-gray-600">{connectedEmail}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connected to {connectedEmail || 'Gmail'}</p>
            <p className="text-xs text-gray-400 mt-1">Pitches will be sent via Gmail</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700">
        <AlertCircle className="h-3.5 w-3.5" />
        Gmail Not Connected
      </Badge>
      {showConnectButton && (
        <Button
          size="sm"
          variant="outline"
          onClick={connectEmail}
          className="gap-1.5"
        >
          <Mail className="h-3.5 w-3.5" />
          Connect Gmail
        </Button>
      )}
    </div>
  );
}