import { useState, useEffect, useCallback, useRef } from "react";
import { User, Group, GroupMessage, GroupMember, CreateGroupData, UpdateGroupData } from "@/types/group";
import { apiService } from "@/lib/api";

export const useGroupChat = (currentUserId: string = "1") => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [messages, setMessages] = useState<Record<string, GroupMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const sendMessageTimeoutRef = useRef<NodeJS.Timeout>();

  const loadConversations = useCallback(async () => {
    try {
      const conversationsResponse = await apiService.getConversations();
      if (conversationsResponse.success && Array.isArray(conversationsResponse.data)) {
        const groupConversations = conversationsResponse.data
          .filter((conv: any) => conv.conversation_type === 'group')
          .map((conv: any) => ({
            id: conv.id,
            name: conv.group?.name || conv.title,
            description: conv.group?.description || '',
            avatar: conv.group?.avatar,
            createdBy: conv.group?.created_by,
            createdAt: new Date(conv.created_at),
            updatedAt: new Date(conv.updated_at),
            isPrivate: conv.group?.is_private || false,
            members: conv.group?.members || [],
            lastActivity: conv.group?.last_activity ? new Date(conv.group.last_activity) : new Date(conv.created_at),
            unreadCount: 0
          }));
        
        setGroups(groupConversations);
        if (groupConversations.length > 0 && !currentGroupId) {
          setCurrentGroupId(groupConversations[0].id);
        }

        // Load messages with delay to avoid rate limiting
        for (let i = 0; i < groupConversations.length; i++) {
          const group = groupConversations[i];
          setTimeout(async () => {
            const messagesResponse = await apiService.getMessages(group.id);
            if (messagesResponse.success && Array.isArray(messagesResponse.data)) {
              const groupMessages = messagesResponse.data.map((msg: any) => ({
                id: msg.id,
                content: msg.content,
                senderId: msg.sender,
                senderName: msg.senderName || 'Unknown',
                timestamp: new Date(msg.timestamp),
                groupId: group.id,
                attachments: msg.attachments,
                edited: msg.edited,
                editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
                forwarded: msg.forwarded,
                originalSender: msg.originalSender
              }));
              
              setMessages(prev => ({
                ...prev,
                [group.id]: groupMessages
              }));
            }
          }, i * 500);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [currentGroupId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const usersResponse = await apiService.getUsers();
        if (usersResponse.success && Array.isArray(usersResponse.data)) {
          const users = usersResponse.data.map((user: any) => ({
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            status: (user.status === 'active' ? 'online' : user.status === 'away' ? 'away' : 'offline') as "online" | "away" | "offline"
          }));
          
          const current = users.find((u: User) => u.id === currentUserId);
          setCurrentUser(current || null);
          setAvailableUsers(users.filter((u: User) => u.id !== currentUserId));
        }

        await loadConversations();
      } catch (err) {
        console.error('Failed to load group chat data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      if (sendMessageTimeoutRef.current) clearTimeout(sendMessageTimeoutRef.current);
    };
  }, [currentUserId, loadConversations]);

  const currentGroup = groups.find(g => g.id === currentGroupId);
  const currentGroupMessages = messages[currentGroupId] || [];

  const selectGroup = useCallback((groupId: string) => {
    setCurrentGroupId(groupId);
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, unreadCount: 0 }
        : group
    ));
  }, []);

  const createGroup = useCallback(async (groupData: CreateGroupData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.createGroup({
        name: groupData.name,
        description: groupData.description,
        avatar: groupData.avatar,
        group_type: groupData.isPrivate ? 'private' : 'public',
        member_ids: groupData.memberIds.filter(id => id !== currentUserId)
      });
      
      if (response.success && response.data) {
        await loadConversations();
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create group');
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loadConversations]);

  const updateGroup = useCallback(async (groupId: string, updateData: UpdateGroupData) => {
    setLoading(true);
    setError(null);
    
    try {
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              ...updateData,
              updatedAt: new Date()
            }
          : group
      ));
    } catch (err) {
      console.error('Failed to update group:', err);
      setError(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMembers = useCallback(async (groupId: string, memberIds: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          const newMembers = memberIds.map(userId => {
            const user = availableUsers.find(u => u.id === userId);
            return {
              userId,
              username: user?.username || "Unknown User",
              avatar: user?.avatar,
              role: "member" as const,
              joinedAt: new Date(),
              status: "active" as const
            };
          });
          
          return {
            ...group,
            members: [...group.members, ...newMembers],
            updatedAt: new Date()
          };
        }
        return group;
      }));
    } catch (err) {
      console.error('Failed to add members:', err);
      setError(err instanceof Error ? err.message : 'Failed to add members');
    } finally {
      setLoading(false);
    }
  }, [availableUsers]);

  const removeMember = useCallback(async (groupId: string, userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              members: group.members.filter(m => m.userId !== userId),
              updatedAt: new Date()
            }
          : group
      ));
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  }, []);



  const deleteGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiService.request(`/chat/groups/${groupId}/`, {
        method: 'DELETE'
      });
      
      setGroups(prev => prev.filter(group => group.id !== groupId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[groupId];
        return newMessages;
      });

      if (currentGroupId === groupId) {
        const remainingGroups = groups.filter(g => g.id !== groupId);
        setCurrentGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : "");
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  }, [currentGroupId, groups]);

  const sendMessage = useCallback(async (groupId: string, content: string, attachments?: any[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;
    
    setError(null);
    
    try {
      const response = await apiService.sendMessage(groupId, content.trim());
      
      if (response.success && response.data) {
        const newMessage: GroupMessage = {
          id: response.data.id,
          content: response.data.content,
          senderId: currentUserId,
          senderName: currentUser?.username || "Unknown",
          timestamp: new Date(response.data.timestamp),
          groupId,
          attachments: response.data.attachments
        };

        setMessages(prev => ({
          ...prev,
          [groupId]: [...(prev[groupId] || []), newMessage]
        }));

        setGroups(prev => prev.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              lastActivity: new Date(),
              updatedAt: new Date()
            };
          }
          return group;
        }));
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  }, [currentUserId, currentUser]);

  const editMessage = useCallback(async (groupId: string, messageId: string, content: string) => {
    setError(null);
    
    try {
      setMessages(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                content: content.trim(),
                edited: true,
                editedAt: new Date()
              }
            : msg
        ) || []
      }));
    } catch (err) {
      console.error('Failed to edit message:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    }
  }, []);

  const deleteMessage = useCallback(async (groupId: string, messageId: string) => {
    setError(null);
    
    try {
      setMessages(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.filter(msg => msg.id !== messageId) || []
      }));
    } catch (err) {
      console.error('Failed to delete message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, []);

  const forwardMessage = useCallback(async (groupId: string, message: GroupMessage) => {
    setError(null);
    
    try {
      const forwardedMessage: GroupMessage = {
        ...message,
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        senderName: currentUser?.username || "Unknown",
        timestamp: new Date(),
        forwarded: true,
        originalSender: message.senderName
      };

      setMessages(prev => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), forwardedMessage]
      }));
    } catch (err) {
      console.error('Failed to forward message:', err);
      setError(err instanceof Error ? err.message : 'Failed to forward message');
    }
  }, [currentUserId, currentUser]);

  return {
    groups,
    currentGroupId,
    currentGroup,
    currentGroupMessages,
    messages,
    currentUser,
    availableUsers,
    loading,
    error,
    selectGroup,
    createGroup,
    updateGroup,
    addMembers,
    removeMember,
    deleteGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    forwardMessage
  };
};
