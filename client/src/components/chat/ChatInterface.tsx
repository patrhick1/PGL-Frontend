import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversation } from '@/hooks/useConversation';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickReplies } from './QuickReplies';
import { ProgressIndicator } from './ProgressIndicator';
import { ChatInput } from './ChatInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  campaignId: string;
  onComplete: (data: any) => void;
  isOnboarding?: boolean;
}

export function ChatInterface({ campaignId, onComplete, isOnboarding = false }: ChatInterfaceProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [conversationAlreadyComplete, setConversationAlreadyComplete] = useState(false);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
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
    connectionStatus,
    isConversationComplete
  } = useConversation(campaignId, isOnboarding);
  
  const [isResumedConversation, setIsResumedConversation] = useState(false);

  const handleComplete = useCallback(async () => {
    if (isCompleted) return; // Prevent multiple calls
    
    try {
      // Complete the conversation on the backend
      await completeConversation.mutateAsync();
      
      // Mark as completed
      setIsCompleted(true);
      
      // Notify parent component
      onComplete({});
    } catch (err) {
      setError('Failed to complete conversation. Please try again.');
      console.error('Error completing conversation:', err);
    }
  }, [isCompleted, completeConversation, onComplete]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Check if this is a resumed conversation and handle completion
  useEffect(() => {
    if (messages.length > 2 && !isResumedConversation) {
      setIsResumedConversation(true);
    }
    
    // If conversation is marked as complete from backend, notify parent
    if (isConversationComplete && !conversationAlreadyComplete) {
      console.log('Conversation is complete from backend, notifying parent');
      setConversationAlreadyComplete(true);
      // Notify parent after a delay
      setTimeout(() => {
        onComplete({});
      }, 2000);
    }
  }, [messages, isConversationComplete, conversationAlreadyComplete, onComplete]);

  // Start conversation only if no existing conversations are being checked
  useEffect(() => {
    // Don't start if we already have a conversation or still connecting
    if (conversationId || connectionStatus !== 'connected' || isConversationComplete) {
      return;
    }
    
    // Wait a bit to allow conversation history to load and be processed
    const timer = setTimeout(() => {
      if (!conversationId && connectionStatus === 'connected' && !isConversationComplete) {
        console.log('No existing conversation found after waiting, starting new one');
        startConversation.mutate();
      }
    }, 2000); // Give 2 seconds for history check and resume
    
    return () => clearTimeout(timer);
  }, [conversationId, connectionStatus, isConversationComplete, startConversation]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || isCompleted) return;
    
    try {
      setError(null);
      setIsTyping(true);
      const response = await sendMessage.mutateAsync(text);
      
      console.log('Chat response:', response);
      
      // Check if ready for completion (either in response or in the internal flag)
      if (response?.ready_for_completion === true || response?._readyForCompletion === true) {
        console.log('Conversation ready for completion, showing complete button');
        setShowCompleteButton(true);
      }
    } catch (err: any) {
      // Handle 404 errors - conversation not found
      if (err?.message?.includes('404') || err?.message?.includes('not found')) {
        setError('This conversation is no longer available.');
        return;
      }
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  // Remove old automatic completion logic - now handled by ready_for_completion flag
  // The backend will set ready_for_completion=true only after user confirms their profile

  // Show loading state while checking for existing conversations
  if (connectionStatus === 'connecting' && messages.length === 0) {
    return (
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg p-6 chat-interface-container">
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
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg p-6 chat-interface-container">
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
  
  // Show message if conversation is already complete
  if (conversationAlreadyComplete || isConversationComplete) {
    return (
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg p-6 chat-interface-container">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-green-50 rounded-full p-4 mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isOnboarding ? "Interview Already Complete!" : "Profile Already Complete!"}
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-6">
            {isOnboarding 
              ? "Great news! You've already completed your interview. Your media kit has been generated and you'll be redirected to the next step shortly."
              : "Great news! You've already completed your profile questionnaire. Your media kit is being generated and you'll be redirected to the next step shortly."}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Redirecting to the next step...</span>
          </div>
        </div>
      </div>
    );
  }

  // Get current message's quick replies (from the last bot message)
  const lastBotMessage = messages.filter(m => m.sender === 'bot').pop();
  const currentQuickReplies = lastBotMessage?.quickReplies || [];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg chat-interface-container">
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

      {currentQuickReplies.length > 0 && !isCompleted && (
        <QuickReplies 
          replies={currentQuickReplies} 
          onSelect={handleQuickReply}
          disabled={isLoading}
        />
      )}
      
      {isCompleted ? (
        <div className="p-4 bg-green-50 border-t border-green-200">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Conversation Complete!</span>
          </div>
          <p className="text-center text-sm text-green-600 mt-1">
            {isOnboarding 
              ? "Your profile is being created. Moving to the next step..." 
              : "Your media kit is being generated. You'll be redirected shortly."}
          </p>
        </div>
      ) : !showCompleteButton ? (
        <ChatInput 
          onSend={handleSendMessage} 
          disabled={isLoading || connectionStatus !== 'connected'}
          placeholder={connectionStatus === 'connecting' ? 'Connecting...' : 'Type your message...'}
        />
      ) : null}
      
      {/* Complete button when ready */}
      {showCompleteButton && !isCompleted && (
        <div className="p-4 border-t bg-green-50">
          <div className="flex flex-col items-center space-y-3">
            <p className="text-sm text-green-800 font-medium">
              Your profile is ready! Click below to finalize your media kit.
            </p>
            <Button
              onClick={handleComplete}
              disabled={completeConversation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {completeConversation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete & Generate Media Kit
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      {!isCompleted && !showCompleteButton && (
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
      )}
    </div>
  );
}