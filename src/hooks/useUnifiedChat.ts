import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupChat } from "@/hooks/useGroupChat";
import { apiService, User as ApiUser, Conversation as ApiConversation, Message as ApiMessage } from "@/lib/api";
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
  const [individualMessages, setIndividualMessages] = useState<Record<string, IndividualMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Load data from API
  useEffect(() => {
    if (!authUser) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load users for search and individual conversations
        const usersResponse = await apiService.getUsers();
        if (usersResponse.success && Array.isArray(usersResponse.data)) {
          // Filter out current user and convert status
          const otherUsers = usersResponse.data
            .filter((user: any) => user.id !== authUser.id)
            .map((user: any) => ({
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              status: (user.status === 'active' ? 'online' : user.status === 'away' ? 'away' : 'offline') as "online" | "away" | "offline"
            }));
          setAvailableUsers(otherUsers);
        }

        // Load conversations
        const conversationsResponse = await apiService.getConversations();
        if (conversationsResponse.success && Array.isArray(conversationsResponse.data)) {
          // Convert API conversations to local format
          const convertedConversations: Conversation[] = conversationsResponse.data.map((conv: any) => {
            const participants = conv.participants.map((p: any) => ({
              id: p.id,
              username: p.username,
              avatar: p.avatar,
              status: 'offline' as "online" | "away" | "offline"
            }));

            let lastMessage;
            if (conv.lastMessage) {
              lastMessage = {
                id: conv.lastMessage.id,
                content: conv.lastMessage.content,
                senderId: conv.lastMessage.sender,
                timestamp: new Date(conv.lastMessage.timestamp),
                receiverId: conv.type === 'individual' ? 
                  participants.find((p: any) => p.id !== authUser.id)?.id || authUser.id :
                  authUser.id,
                attachments: conv.lastMessage.attachments,
                edited: conv.lastMessage.edited,
                editedAt: conv.lastMessage.editedAt ? new Date(conv.lastMessage.editedAt) : undefined,
                forwarded: conv.lastMessage.forwarded,
                originalSender: conv.lastMessage.originalSender
              };
            }

            return {
              id: conv.id,
              type: conv.type === 'group' ? 'group' : 'individual' as const,
              participants,
              lastMessage,
              lastActivity: new Date(conv.createdAt),
              unreadCount: 0,
              groupId: conv.type === 'group' ? conv.id : undefined,
              groupName: conv.type === 'group' ? conv.title : undefined,
              userId: conv.type === 'individual' ? 
                participants.find((p: any) => p.id !== authUser.id)?.id : undefined
            };
          });

          // Add group conversations from groupChatHook
          const groupConversations: Conversation[] = groupChatHook.groups.map(group => ({
            id: `group-${group.id}`,
            type: 'group',
            participants: group.members.map(member => ({
              id: member.userId,
              username: member.username,
              avatar: member.avatar,
              status: "online" as const // This would come from actual presence data
            })),
            lastMessage: groupChatHook.messages[group.id]?.[groupChatHook.messages[group.id].length - 1],
            lastActivity: group.lastActivity || group.updatedAt,
            unreadCount: group.unreadCount,
            groupId: group.id,
            groupName: group.name,
            groupAvatar: group.avatar,
            isGroupPrivate: group.isPrivate
          }));

          // Combine conversations
          const allConversations = [...convertedConversations, ...groupConversations]
            .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

          setConversations(allConversations);
          
          // Load messages for each conversation
          const messagePromises = allConversations.map(async (conv) => {
            if (conv.type === 'individual') {
              const messagesResponse = await apiService.getMessages(conv.id);
              if (messagesResponse.success && Array.isArray(messagesResponse.data)) {
                const convertedMessages: IndividualMessage[] = messagesResponse.data.map(msg => ({
                  id: msg.id,
                  content: msg.content,
                  senderId: msg.sender,
                  receiverId: msg.sender === authUser.id ? conv.userId! : authUser.id,
                  timestamp: new Date(msg.timestamp),
                  attachments: msg.attachments?.map(att => ({
                    id: att.id,
                    name: att.name,
                    type: att.type,
                    size: att.size,
                    url: att.url,
                    uploadedAt: att.uploadedAt
                  })),
                  edited: msg.edited,
                  editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
                  forwarded: msg.forwarded,
                  originalSender: msg.originalSender
                }));
                
                setIndividualMessages(prev => ({
                  ...prev,
                  [conv.id]: convertedMessages
                }));
              }
            }
          });

          await Promise.all(messagePromises);
          
          // Set current conversation to the most recent one if none selected
          if (!currentConversationId && allConversations.length > 0) {
            setCurrentConversationId(allConversations[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        
        // Fallback to sample data if API fails
        const fallbackConversations = createFallbackConversations();
        setConversations(fallbackConversations);
        setIndividualMessages(sampleIndividualMessages);
        setAvailableUsers(sampleUsers);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser, groupChatHook.groups, groupChatHook.messages, currentConversationId]);

  // Helper function to create fallback conversations when API fails
  const createFallbackConversations = (): Conversation[] => {
    // Create group conversations from groupChatHook data
    const groupConversations: Conversation[] = groupChatHook.groups.map(group => ({
      id: `group-${group.id}`,
      type: 'group',
      participants: group.members.map(member => ({
        id: member.userId,
        username: member.username,
        avatar: member.avatar,
        status: "online" as const
      })),
      lastMessage: groupChatHook.messages[group.id]?.[groupChatHook.messages[group.id].length - 1],
      lastActivity: group.lastActivity || group.updatedAt,
      unreadCount: group.unreadCount,
      groupId: group.id,
      groupName: group.name,
      groupAvatar: group.avatar,
      isGroupPrivate: group.isPrivate
    }));

    return groupConversations;
  };

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

    const otherUser = (availableUsers.length > 0 ? availableUsers : sampleUsers).find(u => u.id === userId);
    if (!otherUser) throw new Error("User not found");

    // Try to create conversation via API in background
    apiService.createConversation([userId]).then(response => {
      if (response.success && response.data) {
        // If API creation succeeds, update the conversation ID
        const updatedConversation: Conversation = {
          ...conversationId ? {
            id: response.data.id,
          } : {}
        } as any;
      }
    }).catch(error => {
      console.warn('Failed to create conversation via API:', error);
    });

    // Local creation (fallback)
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
  }, [authUser, availableUsers]);

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
  const sendMessage = useCallback(async (conversationId: string, content: string, attachments?: Attachment[]) => {
    if (!authUser) return;

    try {
      if (conversationId.startsWith('group-')) {
        // Handle group message
        const groupId = conversationId.replace('group-', '');
        await groupChatHook.sendMessage(groupId, content, attachments);
      } else {
        // Handle individual message - use real API call
        const response = await apiService.sendMessage(conversationId, content, 
          attachments?.map(att => new File([], att.name, { type: att.type }))
        );

        if (response.success && response.data) {
          // Convert API message to local format
          const newMessage: IndividualMessage = {
            id: response.data.id,
            content: response.data.content,
            senderId: response.data.sender,
            receiverId: authUser.id, // For sent messages, receiver is the other person
            timestamp: new Date(response.data.timestamp),
            attachments: response.data.attachments?.map(att => ({
              id: att.id,
              name: att.name,
              type: att.type,
              size: att.size,
              url: att.url,
              uploadedAt: att.uploadedAt
            })),
            edited: response.data.edited,
            editedAt: response.data.editedAt ? new Date(response.data.editedAt) : undefined,
            forwarded: response.data.forwarded,
            originalSender: response.data.originalSender
          };

          // Update local messages
          setIndividualMessages(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), newMessage]
          }));
        }
      }

      // Update conversation's last activity
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              lastMessage: {
                id: `msg-${Date.now()}`,
                content: content.trim(),
                senderId: authUser.id,
                receiverId: conv.type === 'individual' ? 
                  conv.participants.find(p => p.id !== authUser.id)?.id || authUser.id :
                  authUser.id,
                timestamp: new Date(),
                attachments: attachments
              } as IndividualMessage,
              lastActivity: new Date()
            }
          : conv
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    }
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
    const usersToSearch = availableUsers.length > 0 ? availableUsers : sampleUsers;
    return usersToSearch.filter(user => 
      user.username.toLowerCase().includes(lowercaseQuery)
    );
  }, [availableUsers]);

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
    availableUsers: availableUsers.length > 0 ? availableUsers : sampleUsers,
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