import { useState, useEffect, useRef } from 'react';
import { useConversation } from '@/hooks/useConversation';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { ProgressIndicator } from './ProgressIndicator';
import { ChatInput } from './ChatInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ChatInterfaceProps {
  campaignId: string;
  onComplete: (data: any) => void;
}

export function ChatInterface({ campaignId, onComplete }: ChatInterfaceProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    conversationId,
    messages,
    progress,
    phase,
    keywordsCount,
    startConversation,
    sendMessage,
    resumeConversation,
    completeConversation,
    pauseConversation,
    getSummary,
    isLoading,
    connectionStatus
  } = useConversation(campaignId);
  
  const [isResumedConversation, setIsResumedConversation] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Check if this is a resumed conversation
  useEffect(() => {
    if (messages.length > 2 && !isResumedConversation) {
      setIsResumedConversation(true);
    }
  }, [messages]);

  // Start conversation only if no existing conversations are being checked
  useEffect(() => {
    // Don't start if we already have a conversation or still connecting
    if (conversationId || connectionStatus !== 'connected') {
      return;
    }
    
    // Wait a bit to allow conversation history to load and be processed
    const timer = setTimeout(() => {
      if (!conversationId && connectionStatus === 'connected') {
        console.log('No existing conversation found after waiting, starting new one');
        startConversation.mutate();
      }
    }, 2000); // Give 2 seconds for history check and resume
    
    return () => clearTimeout(timer);
  }, [conversationId, connectionStatus]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    try {
      setError(null);
      setIsTyping(true);
      await sendMessage.mutateAsync(text);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleComplete = async () => {
    try {
      // Complete the conversation on the backend
      await completeConversation.mutateAsync();
      
      // Notify parent component
      onComplete({});
    } catch (err) {
      setError('Failed to complete conversation. Please try again.');
      console.error('Error completing conversation:', err);
    }
  };

  // Check if conversation is complete
  useEffect(() => {
    if (progress >= 100 && !completeConversation.isPending) {
      handleComplete();
    }
  }, [progress]);

  // Show loading state while checking for existing conversations
  if (connectionStatus === 'connecting' && messages.length === 0) {
    return (
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Handle connection errors
  if (connectionStatus === 'error') {
    return (
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to connect to the chat service. Please check your internet connection and try again.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Page
        </Button>
      </div>
    );
  }

  // Get current message's quick replies (from the last bot message)
  const lastBotMessage = messages.filter(m => m.sender === 'bot').pop();
  const currentQuickReplies = lastBotMessage?.quickReplies || [];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <ProgressIndicator progress={progress} phase={phase} keywordsFound={keywordsCount} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isResumedConversation && messages.length > 0 && (
          <div className="text-center text-sm text-muted-foreground pb-2">
            <span className="bg-muted px-3 py-1 rounded-full">
              Conversation resumed • {messages.length} messages
            </span>
          </div>
        )}
        {messages.map((message, index) => (
          <MessageBubble key={message.id || index} message={message} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {currentQuickReplies.length > 0 && (
        <QuickReplies 
          replies={currentQuickReplies} 
          onSelect={handleQuickReply}
          disabled={isLoading}
        />
      )}
      
      <ChatInput 
        onSend={handleSendMessage} 
        disabled={isLoading || connectionStatus !== 'connected'}
        placeholder={connectionStatus === 'connecting' ? 'Connecting...' : 'Type your message...'}
      />
      
      {/* Action buttons */}
      <div className="flex justify-between items-center p-3 border-t bg-muted/10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => pauseConversation.mutate()}
          disabled={!conversationId || isLoading}
        >
          Pause & Save
        </Button>
        
        <div className="text-xs text-muted-foreground">
          Auto-saves every 10 messages
        </div>
      </div>
    </div>
  );
}