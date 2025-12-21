import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupChat } from "@/hooks/useGroupChat";
import { apiService } from "@/lib/api";
import { 
  Conversation, 
  IndividualMessage, 
  User,
  GroupMessage,
  Attachment,
  UnifiedChatData
} from "@/types/chat";

export const useUnifiedChat = (): UnifiedChatData => {
  const { user: authUser } = useAuth();
  const groupChatHook = useGroupChat(authUser?.id || "1");
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [individualMessages, setIndividualMessages] = useState<Record<string, IndividualMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const messageLoadTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const conversationMapRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!authUser) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Only load all users if user has admin access
        const authToken = apiService.getAuthToken();
        if (authToken) {
          try {
            const usersResponse = await apiService.getUsers();
            const usersMap: Record<string, User> = {};
            
            if (usersResponse.success && Array.isArray(usersResponse.data)) {
              const otherUsers = usersResponse.data
                .filter((user: any) => String(user.id) !== String(authUser.id))
                .map((user: any) => {
                  const username = (user.username && user.username.trim()) || user.first_name || user.email?.split('@')[0] || 'Unknown';
                  const userData = {
                    id: String(user.id),
                    username,
                    avatar: user.avatar || '',
                    status: 'offline' as const
                  };
                  usersMap[String(user.id)] = userData;
                  return userData;
                });
              setAvailableUsers(otherUsers);
            }
          } catch (err) {
            // If getUsers fails (e.g., insufficient permissions), continue without user list
            console.warn('Could not load users list:', err);
          }
        }

        const conversationsResponse = await apiService.getConversations();
        if (conversationsResponse.success && Array.isArray(conversationsResponse.data)) {
          const convertedConversations: Conversation[] = conversationsResponse.data.map((conv: any) => {
            const isGroup = conv.conversation_type === 'group' || conv.type === 'group';
            
            let participants: any[] = [];
            let otherUserId: string | undefined;

            if (isGroup && conv.group) {
              participants = (conv.group.members || []).map((m: any) => {
                const username = (m.user?.username && m.user.username.trim()) || m.user?.first_name || m.username || 'Unknown';
                return {
                  id: String(m.user?.id || m.id),
                  username,
                  avatar: m.user?.avatar || m.avatar || '',
                  status: 'offline' as const
                };
              });
            } else {
              if (conv.participants && Array.isArray(conv.participants) && conv.participants.length > 0) {
                participants = conv.participants.map((p: any) => {
                  const username = (p.username && p.username.trim()) || p.first_name || p.email?.split('@')[0] || 'Unknown';
                  return {
                    id: String(p.id),
                    username,
                    avatar: p.avatar || '',
                    status: 'offline' as const
                  };
                });
                if (participants.length > 0) {
                  otherUserId = participants[0].id;
                }
              }
            }

            return {
              id: conv.id,
              type: isGroup ? 'group' : 'individual' as const,
              participants,
              lastActivity: new Date(conv.last_message_at || conv.created_at),
              unreadCount: 0,
              groupId: isGroup ? (conv.group?.id || conv.id) : undefined,
              groupName: isGroup ? (conv.group?.name || conv.title) : undefined,
              userId: otherUserId
            };
          });

          setConversations(convertedConversations);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      messageLoadTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      messageLoadTimeoutRef.current = [];
    };
  }, [authUser]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    
    try {
      const response = await apiService.getMessages(conversationId);
      if (response.success && Array.isArray(response.data)) {
        const messages = response.data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          senderId: String(msg.sender?.id || msg.sender),
          timestamp: new Date(msg.created_at || msg.timestamp),
          attachments: msg.attachments || []
        }));
        setIndividualMessages(prev => ({
          ...prev,
          [conversationId]: messages
        }));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  const createIndividualConversation = useCallback((userId: string): Conversation => {
    if (!authUser) throw new Error("User not authenticated");

    const otherUser = availableUsers.find(u => String(u.id) === String(userId));
    if (!otherUser) throw new Error("User not found");

    const existingConv = conversations.find(c => 
      c.type === 'individual' && String(c.userId) === String(userId)
    );
    
    if (existingConv) {
      setCurrentConversationId(existingConv.id);
      loadMessages(existingConv.id);
      return existingConv;
    }

    const tempId = `individual-${authUser.id}-${userId}`;
    const newConversation: Conversation = {
      id: tempId,
      type: 'individual',
      participants: [otherUser],
      lastActivity: new Date(),
      unreadCount: 0,
      userId
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(tempId);

    (async () => {
      try {
        const response = await apiService.createConversation([userId]);
        if (response.success && response.data?.id) {
          conversationMapRef.current[tempId] = response.data.id;
          setConversations(prev => prev.map(conv => 
            conv.id === tempId ? { ...conv, id: response.data.id } : conv
          ));
          setCurrentConversationId(response.data.id);
          await loadMessages(response.data.id);
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
    })();

    return newConversation;
  }, [authUser, availableUsers, conversations, loadMessages]);

  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    loadMessages(conversationId);
  }, [loadMessages]);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    ));
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const id = conversationId.startsWith('group-') ? conversationId.replace('group-', '') : conversationId;
      await apiService.deleteConversation(id);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
    
    setConversations(prev => {
      const remaining = prev.filter(conv => conv.id !== conversationId);
      if (currentConversationId === conversationId) {
        setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  }, [currentConversationId]);

  const sendMessage = useCallback(async (conversationId: string, content: string, attachments?: Attachment[]) => {
    if (!authUser || !conversationId) return;

    try {
      let actualConversationId = conversationId;
      if (conversationId.startsWith('individual-')) {
        const mappedId = conversationMapRef.current[conversationId];
        if (mappedId) {
          actualConversationId = mappedId;
        }
      }

      const files = attachments?.filter(att => att instanceof File) as File[] || [];
      await apiService.sendMessage(actualConversationId, content, files);

      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, lastActivity: new Date() }
          : conv
      ));
      
      await loadMessages(actualConversationId);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    }
  }, [authUser, loadMessages]);

  const editMessage = useCallback((conversationId: string, messageId: string, content: string) => {
    setIndividualMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => 
        msg.id === messageId ? { ...msg, content } : msg
      )
    }));
  }, []);

  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    setIndividualMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter(msg => msg.id !== messageId)
    }));
  }, []);

  const forwardMessage = useCallback((conversationId: string, message: IndividualMessage | GroupMessage) => {
    console.log('Forward message:', conversationId, message);
  }, []);

  const searchUsers = useCallback((query: string): User[] => {
    if (!query.trim()) return availableUsers;
    const lowercaseQuery = query.toLowerCase();
    return availableUsers.filter(user => 
      user.username.toLowerCase().includes(lowercaseQuery)
    );
  }, [availableUsers]);

  const searchGroups = useCallback((query: string): Conversation[] => {
    return conversations.filter(conv => 
      conv.type === 'group' && conv.groupName?.toLowerCase().includes(query.toLowerCase())
    );
  }, [conversations]);

  const searchConversations = useCallback((query: string): Conversation[] => {
    return conversations.filter(conv => {
      if (conv.type === 'group') {
        return conv.groupName?.toLowerCase().includes(query.toLowerCase());
      } else {
        const otherUser = conv.participants.find(p => p.id !== authUser?.id);
        return otherUser?.username?.toLowerCase().includes(query.toLowerCase()) || false;
      }
    });
  }, [conversations, authUser]);

  const getCurrentMessages = useCallback((): (IndividualMessage | GroupMessage)[] => {
    return individualMessages[currentConversationId || ''] || [];
  }, [currentConversationId, individualMessages]);

  useEffect(() => {
    if (currentConversationId && !individualMessages[currentConversationId]) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId, individualMessages, loadMessages]);

  const currentMessages = getCurrentMessages();
  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  return {
    conversations,
    currentConversationId,
    currentConversation,
    currentMessages,
    messages: individualMessages,
    loading,
    error,
    login: async () => authUser!,
    logout: () => {},
    updateUser: () => {},
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
    groups: groupChatHook.groups,
    availableUsers,
    currentUser: authUser,
    createGroup: groupChatHook.createGroup,
    updateGroup: groupChatHook.updateGroup,
    addMembers: groupChatHook.addMembers,
    removeMember: groupChatHook.removeMember,
    leaveGroup: groupChatHook.leaveGroup,
    deleteGroup: groupChatHook.deleteGroup,
    selectGroup: groupChatHook.selectGroup,
    loadMessages
  };
};
