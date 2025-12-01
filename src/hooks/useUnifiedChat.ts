import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupChat } from "@/hooks/useGroupChat";
import { 
  Conversation, 
  IndividualMessage, 
  ChatState,
  ChatActions,
  UnifiedChatData,
  User,
  GroupMessage,
  Attachment
} from "@/types/chat";

// Sample individual messages data
const sampleIndividualMessages: Record<string, IndividualMessage[]> = {
  "individual-1-2": [
    {
      id: "msg-ind-1",
      content: "Hey Bob! How's the project going?",
      senderId: "1",
      receiverId: "2",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: "msg-ind-2", 
      content: "Hi Alice! It's going great, I'm about 80% done",
      senderId: "2",
      receiverId: "1",
      timestamp: new Date(Date.now() - 90 * 60 * 1000)
    },
    {
      id: "msg-ind-3",
      content: "That's awesome! Looking forward to seeing the final result",
      senderId: "1", 
      receiverId: "2",
      timestamp: new Date(Date.now() - 60 * 60 * 1000)
    }
  ],
  "individual-1-3": [
    {
      id: "msg-ind-4",
      content: "Charlie, did you review the API documentation?",
      senderId: "1",
      receiverId: "3", 
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: "msg-ind-5",
      content: "Yes, I reviewed it yesterday. Looks good to me",
      senderId: "3",
      receiverId: "1",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  ],
  "individual-1-4": [
    {
      id: "msg-ind-6",
      content: "Thanks for the feedback on my proposal, Diana!",
      senderId: "1",
      receiverId: "4",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]
};

// Sample users (excluding current user)
const sampleUsers: User[] = [
  {
    id: "2",
    username: "Bob Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    status: "online"
  },
  {
    id: "3", 
    username: "Charlie Brown",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
    status: "away"
  },
  {
    id: "4",
    username: "Diana Prince", 
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
    status: "online"
  },
  {
    id: "5",
    username: "Eve Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eve", 
    status: "offline"
  }
];

export const useUnifiedChat = (): UnifiedChatData => {
  const { user: authUser } = useAuth();
  const groupChatHook = useGroupChat(authUser?.id || "1");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [individualMessages, setIndividualMessages] = useState<Record<string, IndividualMessage[]>>(sampleIndividualMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize conversations when auth user changes
  useEffect(() => {
    if (!authUser) return;

    // Create conversations from group chat data
    const groupConversations: Conversation[] = groupChatHook.groups.map(group => ({
      id: `group-${group.id}`,
      type: 'group',
      participants: group.members.map(member => ({
        id: member.userId,
        username: member.username,
        avatar: member.avatar,
        status: "online" // This would come from actual presence data
      })),
      lastMessage: groupChatHook.messages[group.id]?.[groupChatHook.messages[group.id].length - 1],
      lastActivity: group.lastActivity || group.updatedAt,
      unreadCount: group.unreadCount,
      groupId: group.id,
      groupName: group.name,
      groupAvatar: group.avatar,
      isGroupPrivate: group.isPrivate
    }));

    // Create individual conversations
    const individualConversations: Conversation[] = sampleUsers
      .filter(u => sampleIndividualMessages[`individual-${authUser.id}-${u.id}`]?.length > 0)
      .map(user => {
        const conversationId = `individual-${authUser.id}-${user.id}`;
        const messages = sampleIndividualMessages[conversationId] || [];
        const lastMessage = messages[messages.length - 1];
        
        return {
          id: conversationId,
          type: 'individual' as const,
          participants: [authUser, user],
          lastMessage,
          lastActivity: lastMessage?.timestamp || new Date(),
          unreadCount: 0, // This would be calculated based on read status
          userId: user.id
        };
      });

    // Combine and sort conversations by last activity
    const allConversations = [...groupConversations, ...individualConversations]
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    setConversations(allConversations);
    
    // Set current conversation to the most recent one if none selected
    if (!currentConversationId && allConversations.length > 0) {
      setCurrentConversationId(allConversations[0].id);
    }
  }, [authUser, groupChatHook.groups, groupChatHook.messages, currentConversationId]);

  // Authentication actions
  const login = useCallback(async (credentials: any) => {
    setLoading(true);
    setError(null);
    try {
      // This would be handled by AuthContext
      setLoading(false);
      return authUser!;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
      throw err;
    }
  }, [authUser]);

  const logout = useCallback(() => {
    setConversations([]);
    setCurrentConversationId(null);
    setIndividualMessages({});
  }, []);

  const updateUser = useCallback((updates: any) => {
    // This would update user profile
    console.log("Update user:", updates);
  }, []);

  // Conversation actions
  const createIndividualConversation = useCallback((userId: string): Conversation => {
    if (!authUser) throw new Error("User not authenticated");

    const otherUser = sampleUsers.find(u => u.id === userId);
    if (!otherUser) throw new Error("User not found");

    const conversationId = `individual-${authUser.id}-${userId}`;
    const newConversation: Conversation = {
      id: conversationId,
      type: 'individual',
      participants: [authUser, otherUser],
      lastActivity: new Date(),
      unreadCount: 0,
      userId
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(conversationId);

    return newConversation;
  }, [authUser]);

  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    
    // Mark as read
    markAsRead(conversationId);
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    if (currentConversationId === conversationId) {
      const remaining = conversations.filter(conv => conv.id !== conversationId);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
    
    // Remove messages
    if (conversationId.startsWith('individual-')) {
      setIndividualMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[conversationId];
        return newMessages;
      });
    }
  }, [currentConversationId, conversations]);

  // Message actions
  const sendMessage = useCallback((conversationId: string, content: string, attachments?: Attachment[]) => {
    if (!authUser) return;

    const message: IndividualMessage | GroupMessage = {
      id: `msg-${Date.now()}`,
      content: content.trim(),
      senderId: authUser.id,
      timestamp: new Date(),
      attachments
    } as IndividualMessage;

    if (conversationId.startsWith('group-')) {
      // Handle group message
      const groupId = conversationId.replace('group-', '');
      groupChatHook.sendMessage(groupId, content, attachments);
    } else {
      // Handle individual message
      const userId = conversationId.replace(`individual-${authUser.id}-`, '');
      const individualMessage: IndividualMessage = {
        ...message,
        receiverId: userId
      } as IndividualMessage;

      setIndividualMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), individualMessage]
      }));
    }

    // Update conversation's last activity
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { 
            ...conv, 
            lastMessage: message,
            lastActivity: new Date()
          }
        : conv
    ));
  }, [authUser, groupChatHook]);

  const editMessage = useCallback((conversationId: string, messageId: string, content: string) => {
    if (conversationId.startsWith('group-')) {
      const groupId = conversationId.replace('group-', '');
      groupChatHook.editMessage(groupId, messageId, content);
    } else {
      setIndividualMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: content.trim(), edited: true, editedAt: new Date() }
            : msg
        ) || []
      }));
    }
  }, [groupChatHook]);

  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    if (conversationId.startsWith('group-')) {
      const groupId = conversationId.replace('group-', '');
      groupChatHook.deleteMessage(groupId, messageId);
    } else {
      setIndividualMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.filter(msg => msg.id !== messageId) || []
      }));
    }
  }, [groupChatHook]);

  const forwardMessage = useCallback((conversationId: string, message: IndividualMessage | GroupMessage) => {
    if (!authUser) return;

    const forwardedMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      senderId: authUser.id,
      timestamp: new Date(),
      forwarded: true,
      originalSender: 'senderName' in message ? message.senderName : 'Unknown'
    } as IndividualMessage;

    if (conversationId.startsWith('group-')) {
      const groupId = conversationId.replace('group-', '');
      groupChatHook.forwardMessage(groupId, message as GroupMessage);
    } else {
      const userId = conversationId.replace(`individual-${authUser.id}-`, '');
      (forwardedMessage as IndividualMessage).receiverId = userId;

      setIndividualMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), forwardedMessage]
      }));
    }
  }, [authUser, groupChatHook]);

  // Search actions
  const searchUsers = useCallback((query: string): User[] => {
    const lowercaseQuery = query.toLowerCase();
    return sampleUsers.filter(user => 
      user.username.toLowerCase().includes(lowercaseQuery)
    );
  }, []);

  const searchGroups = useCallback((query: string): Conversation[] => {
    const lowercaseQuery = query.toLowerCase();
    return conversations.filter(conv => 
      conv.type === 'group' && 
      conv.groupName?.toLowerCase().includes(lowercaseQuery)
    );
  }, [conversations]);

  const searchConversations = useCallback((query: string): Conversation[] => {
    const lowercaseQuery = query.toLowerCase();
    return conversations.filter(conv => {
      if (conv.type === 'group') {
        return conv.groupName?.toLowerCase().includes(lowercaseQuery);
      } else {
        const otherUser = conv.participants.find(p => p.id !== authUser?.id);
        return otherUser?.username.toLowerCase().includes(lowercaseQuery);
      }
    });
  }, [conversations, authUser]);

  // Get current messages
  const getCurrentMessages = useCallback((): (IndividualMessage | GroupMessage)[] => {
    if (!currentConversationId || !authUser) return [];

    if (currentConversationId.startsWith('group-')) {
      const groupId = currentConversationId.replace('group-', '');
      return groupChatHook.messages[groupId] || [];
    } else {
      return individualMessages[currentConversationId] || [];
    }
  }, [currentConversationId, authUser, individualMessages, groupChatHook.messages]);

  const currentMessages = getCurrentMessages();
  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  return {
    // State
    conversations,
    currentConversationId,
    currentConversation,
    currentMessages,
    messages: { ...individualMessages, ...groupChatHook.messages },
    loading,
    error,
    
    // Actions
    login,
    logout,
    updateUser,
    createIndividualConversation,
    selectConversation,
    markAsRead,
    deleteConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    forwardMessage,
    searchUsers,
    searchGroups,
    searchConversations,
    
    // Group chat data
    groups: groupChatHook.groups,
    availableUsers: sampleUsers,
    currentUser: authUser,
    
    // Group actions
    createGroup: groupChatHook.createGroup,
    updateGroup: groupChatHook.updateGroup,
    addMembers: groupChatHook.addMembers,
    removeMember: groupChatHook.removeMember,
    leaveGroup: groupChatHook.leaveGroup,
    deleteGroup: groupChatHook.deleteGroup,
    selectGroup: groupChatHook.selectGroup
  };
};