import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Reply, 
  ReplyAll, 
  Forward, 
  Trash2, 
  Archive,
  Star,
  MoreVertical,
  Paperclip,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { EmailThread, EmailMessage, SmartReply } from '@/types/inbox';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThreadViewProps {
  threadId: string;
  onClose: () => void;
  onReply: (messageId: string) => void;
}

export default function ThreadView({ threadId, onClose, onReply }: ThreadViewProps) {
  const [replyMode, setReplyMode] = useState<'reply' | 'replyAll' | 'forward' | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [selectedSmartReply, setSelectedSmartReply] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch thread details
  const { data: thread, isLoading } = useQuery<EmailThread>({
    queryKey: [`/inbox/threads/${threadId}`],
  });

  // Generate smart reply
  const { data: smartReplies } = useQuery<SmartReply[]>({
    queryKey: [`/inbox/threads/${threadId}/smart-replies`],
    enabled: !!thread && thread.messages && thread.messages.length > 0,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async (data: { 
      content: string; 
      replyAll: boolean;
      messageId: string;
    }) => {
      const res = await apiRequest('POST', `/inbox/messages/${data.messageId}/reply`, {
        body: data.content,
        reply_all: data.replyAll
      });
      if (!res.ok) throw new Error('Failed to send reply');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reply sent',
        description: 'Your reply has been sent successfully.',
      });
      setReplyMode(null);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: [`/inbox/threads/${threadId}`] });
    },
    onError: () => {
      toast({
        title: 'Failed to send',
        description: 'There was an error sending your reply. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Archive thread mutation
  const archiveThreadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/inbox/threads/${threadId}/archive`);
      if (!res.ok) throw new Error('Failed to archive thread');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thread archived',
        description: 'This conversation has been archived.',
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Delete thread mutation
  const deleteThreadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', `/inbox/threads/${threadId}`);
      if (!res.ok) throw new Error('Failed to delete thread');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Thread deleted',
        description: 'This conversation has been moved to trash.',
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/inbox/threads'] });
    }
  });

  // Auto-expand last message
  useEffect(() => {
    if (thread?.messages && thread.messages.length > 0) {
      const lastMessageId = thread.messages[thread.messages.length - 1].id;
      setExpandedMessages(new Set([lastMessageId]));
    }
  }, [thread]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [thread?.messages]);

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleSmartReplySelect = (reply: SmartReply) => {
    setReplyContent(reply.draft);
    setSelectedSmartReply(reply.id);
    setReplyMode('reply');
  };

  const handleSendReply = () => {
    if (!thread?.messages || thread.messages.length === 0) return;
    
    const lastMessage = thread.messages[thread.messages.length - 1];
    sendReplyMutation.mutate({
      content: replyContent,
      replyAll: replyMode === 'replyAll',
      messageId: lastMessage.id
    });
  };

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-gray-500">Thread not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{thread.subject}</h2>
            <p className="text-sm text-gray-500">
              {thread.participants.map(p => p.name || p.email).join(', ')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => archiveThreadMutation.mutate()}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteThreadMutation.mutate()}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                <DropdownMenuItem>Add label</DropdownMenuItem>
                <DropdownMenuItem>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {thread.messages?.map((message, index) => {
            const isExpanded = expandedMessages.has(message.id);
            const isLastMessage = index === thread.messages!.length - 1;
            
            return (
              <Card key={message.id} className="overflow-hidden">
                <button
                  onClick={() => toggleMessageExpansion(message.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(message.from[0].email, message.from[0].name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {message.from[0].name || message.from[0].email}
                      </p>
                      {!isExpanded && (
                        <p className="text-sm text-gray-500 truncate max-w-md">
                          {message.snippet}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {format(new Date(message.date), 'MMM d, h:mm a')}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t">
                    <div className="pt-4">
                      {/* Email metadata */}
                      <div className="text-xs text-gray-500 mb-3 space-y-1">
                        <p>To: {message.to.map(t => t.email).join(', ')}</p>
                        {message.cc && message.cc.length > 0 && (
                          <p>Cc: {message.cc.map(c => c.email).join(', ')}</p>
                        )}
                      </div>

                      {/* Email body */}
                      <div 
                        className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: message.body }}
                      />

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Attachments</p>
                          <div className="space-y-2">
                            {message.attachments.map(attachment => (
                              <button
                                key={attachment.id}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                              >
                                <Paperclip className="w-4 h-4" />
                                <span>{attachment.filename}</span>
                                <span className="text-gray-500">
                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                </span>
                                <Download className="w-3 h-3 ml-auto" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {isLastMessage && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyMode('reply')}
                          >
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyMode('replyAll')}
                          >
                            <ReplyAll className="w-4 h-4 mr-2" />
                            Reply All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyMode('forward')}
                          >
                            <Forward className="w-4 h-4 mr-2" />
                            Forward
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Smart Replies */}
        {smartReplies && smartReplies.length > 0 && !replyMode && (
          <Card className="mt-4 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-medium">Suggested Replies</h3>
            </div>
            <div className="space-y-2">
              {smartReplies.map(reply => (
                <button
                  key={reply.id}
                  onClick={() => handleSmartReplySelect(reply)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {reply.tone}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {Math.round(reply.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {reply.draft}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Reply Composer */}
        {replyMode && (
          <Card className="mt-4 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">
                {replyMode === 'reply' && 'Reply'}
                {replyMode === 'replyAll' && 'Reply All'}
                {replyMode === 'forward' && 'Forward'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyMode(null);
                  setReplyContent('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              className="min-h-[150px] mb-3"
            />
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReplyMode(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || sendReplyMutation.isPending}
                >
                  {sendReplyMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}