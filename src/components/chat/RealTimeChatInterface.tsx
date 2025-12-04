/**
 * Real-time Chat Interface
 * Enhanced chat interface with full WebSocket integration for real-time features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUnifiedChat } from '@/hooks/useUnifiedChat';
import { useWebSocket, useTypingIndicator, useUserPresence, useConnectionStatus } from '@/hooks/useWebSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { ConnectionStatus, ConnectionStatusDot } from '@/components/ConnectionStatus';
import { MessageDeliveryStatus, ConversationDeliveryStatus } from '@/components/chat/MessageDeliveryStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Settings, 
  Users, 
  MessageCircle, 
  Paperclip, 
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IndividualMessage, GroupMessage, User } from '@/types/chat';

interface RealTimeChatInterfaceProps {
  className?: string;
}

export const RealTimeChatInterface: React.FC<RealTimeChatInterfaceProps> = ({ className }) => {
  const {
    currentUser,
    conversations,
    currentConversationId,
    currentConversation,
    currentMessages,
    selectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead
  } = useUnifiedChat();

  const {
    connectionState,
    isConnected,
    isConnecting,
    joinConversation,
    joinIndividualChat,
    joinGroupChat,
    joinUserStatus,
    onMessage,
    onDelivery
  } = useWebSocket();

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    currentConversation?.type === 'individual' ? currentConversationId : undefined,
    currentConversation?.type === 'group' ? currentConversation.groupId : undefined
  );

  const { onlineUsers, getUserStatus } = useUserPresence();
  const { addNotification, markAsRead: markNotificationAsRead } = useNotifications();

  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  // Setup WebSocket connections for current conversation
  useEffect(() => {
    if (currentConversationId && currentUser && isConnected) {
      if (currentConversation?.type === 'individual') {
        const otherUserId = currentConversation.userId;
        if (otherUserId) {
          joinIndividualChat(otherUserId);
        }
      } else if (currentConversation?.type === 'group') {
        const groupId = currentConversation.groupId;
        if (groupId) {
          joinGroupChat(groupId);
        }
      }
      joinUserStatus();
    }
  }, [currentConversationId, currentConversation, currentUser, isConnected, joinIndividualChat, joinGroupChat, joinUserStatus]);

  // Setup WebSocket event listeners
  useEffect(() => {
    // New message handler
    const unsubscribeMessage = onMessage((data) => {
      const { message: newMessage } = data;
      
      // Add to current messages if it belongs to current conversation
      if (currentConversationId === newMessage.conversation_id || 
          (currentConversation?.groupId === newMessage.group_id)) {
        // This would be handled by the unified chat hook's message update
        console.log('New message received:', newMessage);
      }

      // Show notification if message is not from current user
      if (newMessage.sender.id !== currentUser?.id) {
        addNotification({
          type: 'message',
          title: `New message from ${newMessage.sender.username}`,
          message: newMessage.content,
          priority: 'medium',
          data: newMessage
        });
      }
    });

    // Delivery confirmation handler
    const unsubscribeDelivery = onDelivery((data) => {
      if (data.type === 'message_delivered') {
        addNotification({
          type: 'success',
          title: 'Message Delivered',
          message: 'Your message has been delivered successfully',
          priority: 'low',
          persistent: false
        });
      } else if (data.type === 'message_failed') {
        addNotification({
          type: 'error',
          title: 'Message Failed',
          message: data.error || 'Failed to deliver message',
          priority: 'high',
          persistent: true
        });
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeDelivery();
    };
  }, [onMessage, onDelivery, currentConversationId, currentConversation, currentUser, addNotification]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 2000);
  }, [isTyping, startTyping, stopTyping]);

  const handleStopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 1000);
  }, [stopTyping]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      handleStopTyping();
    }
  }, [handleStopTyping]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !currentConversationId || !currentUser) return;

    const messageContent = message.trim();
    setSendingMessage(currentConversationId);
    
    try {
      await sendMessage(currentConversationId, messageContent);
      setMessage('');
      handleStopTyping();
      markAsRead(currentConversationId);
    } catch (error) {
      console.error('Failed to send message:', error);
      addNotification({
        type: 'error',
        title: 'Send Failed',
        message: 'Failed to send message. Please try again.',
        priority: 'high',
        persistent: true
      });
    } finally {
      setSendingMessage(null);
    }
  }, [message, currentConversationId, currentUser, sendMessage, handleStopTyping, markAsRead, addNotification]);

  // Format message timestamp
  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get message delivery status for sent messages
  const getMessageDeliveryStatus = (message: IndividualMessage | GroupMessage) => {
    if (message.senderId !== currentUser?.id) return null;

    return (
      <MessageDeliveryStatus 
        messageId={message.id} 
        size="sm"
        showLabels={false}
      />
    );
  };

  // Get user status indicator
  const getUserStatusIndicator = (userId: string) => {
    const status = getUserStatus(userId);
    const isOnline = onlineUsers.some(u => u.id === userId);
    
    return (
      <div className={cn(
        "w-2 h-2 rounded-full border",
        isOnline ? "bg-green-500 border-green-600" : "bg-gray-400 border-gray-500"
      )} />
    );
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-card/30">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Messages</h2>
            <ConnectionStatusDot />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={cn(
                  "p-3 cursor-pointer transition-colors",
                  currentConversationId === conversation.id 
                    ? "bg-primary/10 border-primary/20" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => selectConversation(conversation.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.participants[0]?.avatar} />
                      <AvatarFallback>
                        {conversation.participants[0]?.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.type === 'individual' && (
                      <div className="absolute -bottom-1 -right-1">
                        {getUserStatusIndicator(conversation.userId!)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate text-sm">
                        {conversation.type === 'group' 
                          ? conversation.groupName 
                          : conversation.participants.find(p => p.id !== currentUser.id)?.username
                        }
                      </h4>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      <ConversationDeliveryStatus 
                        lastMessageId={conversation.lastMessage?.id}
                        className="ml-2"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentConversation.participants[0]?.avatar} />
                    <AvatarFallback>
                      {currentConversation.participants[0]?.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {currentConversation.type === 'group' 
                        ? currentConversation.groupName 
                        : currentConversation.participants.find(p => p.id !== currentUser.id)?.username
                      }
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {connectionState === 'connected' && (
                        <>
                          <Wifi className="h-3 w-3 text-green-500" />
                          <span>Online</span>
                        </>
                      )}
                      {connectionState === 'connecting' && (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      )}
                      {connectionState === 'error' && (
                        <>
                          <WifiOff className="h-3 w-3 text-red-500" />
                          <span>Connection Error</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ConnectionStatus variant="inline" showDetails={false} />
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-100" />
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-200" />
                    </div>
                    <span>
                      {typingUsers.length === 1 
                        ? `${typingUsers[0]} is typing...`
                        : `${typingUsers.length} people are typing...`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.map((msg, index) => {
                  const isOwn = msg.senderId === currentUser.id;
                  const showAvatar = index === 0 || currentMessages[index - 1].senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={currentConversation.participants.find(p => p.id === msg.senderId)?.avatar} />
                          <AvatarFallback className="text-xs">
                            {currentConversation.participants.find(p => p.id === msg.senderId)?.username?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {!isOwn && !showAvatar && <div className="w-8" />}

                      <div className={cn(
                        "max-w-[70%] rounded-lg px-3 py-2",
                        isOwn 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {formatMessageTime(msg.timestamp)}
                          </span>
                          {isOwn && getMessageDeliveryStatus(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card/30">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="pr-12"
                    disabled={!isConnected}
                  />
                  {sendingMessage && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !isConnected || !!sendingMessage}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Connection Status */}
              {!isConnected && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {connectionState === 'connecting' 
                        ? 'Connecting to server...' 
                        : 'No real-time connection. Messages will be sent when connection is restored.'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeChatInterface;