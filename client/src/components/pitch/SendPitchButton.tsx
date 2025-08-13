import { Button } from '@/components/ui/button';
import { Send, Loader2, Mail } from 'lucide-react';
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

interface SendPitchButtonProps {
  pitchGenId: number;
  recipientEmail?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  buttonText?: string;
}

export function SendPitchButton({
  pitchGenId,
  recipientEmail,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  buttonText = 'Send via Gmail'
}: SendPitchButtonProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const { 
    isEmailConnected, 
    sendPitch, 
    isPitchSending, 
    connectEmail 
  } = usePitchSending();

  const isSending = isPitchSending(pitchGenId);

  const handleClick = () => {
    if (!isEmailConnected) {
      setShowConnectDialog(true);
      return;
    }
    sendPitch(pitchGenId);
  };

  const handleConnect = () => {
    setShowConnectDialog(false);
    connectEmail();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isSending}
        variant={variant}
        size={size}
        className={className}
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          <>
            {showIcon && <Send className="h-4 w-4 mr-2" />}
            {buttonText}
          </>
        )}
        {recipientEmail && !isSending && (
          <span className="ml-2 text-xs opacity-70">
            to {recipientEmail}
          </span>
        )}
      </Button>

      <AlertDialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect Your Email</AlertDialogTitle>
            <AlertDialogDescription>
              To send pitches directly from the platform, you need to connect your Gmail account.
              This allows us to send emails on your behalf using OAuth 2.0 secure authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConnect}>
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}