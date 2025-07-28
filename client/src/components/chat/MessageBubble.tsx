import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Bot, User } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface Message {
  id?: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  extracted_data?: any;
  quickReplies?: string[];
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground ml-12" 
            : "bg-muted"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        ) : (
          <div className="text-sm">
            <MarkdownRenderer 
              content={message.text} 
              prose={false}
              className="[&>*:last-child]:mb-0"
            />
          </div>
        )}
        <time className={cn(
          "text-xs mt-1 block",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </time>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}