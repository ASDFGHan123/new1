import { useState, useEffect, useCallback } from "react";
import { User, Group, GroupMessage, GroupMember, CreateGroupData, UpdateGroupData } from "@/types/group";
import { apiService } from "@/lib/api";

// Fallback sample data for when API fails
const sampleUsers: User[] = [
  {
    id: "1",
    username: "Alice Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    status: "online"
  },
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

const sampleGroups: Group[] = [
  {
    id: "group-1",
    name: "Development Team",
    description: "Frontend and backend developers working on the project",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=dev-team",
    createdBy: "1",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isPrivate: false,
    members: [
      {
        userId: "1",
        username: "Alice Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        role: "admin",
        joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: "active"
      },
      {
        userId: "2",
        username: "Bob Smith", 
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        role: "moderator",
        joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        status: "active"
      },
      {
        userId: "3",
        username: "Charlie Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
        role: "member",
        joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "active"
      }
    ],
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 2
  }
];

const sampleMessages: Record<string, GroupMessage[]> = {
  "group-1": [
    {
      id: "msg-1",
      content: "Hey team! Ready for the sprint planning?",
      senderId: "1",
      senderName: "Alice Johnson",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      groupId: "group-1"
    }
  ]
};

export const useGroupChat = (currentUserId: string = "1") => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [messages, setMessages] = useState<Record<string, GroupMessage[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load groups and users from API on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load users
        const usersResponse = await apiService.getUsers();
        if (usersResponse.success && Array.isArray(usersResponse.data)) {
          const users = usersResponse.data.map((user: any) => ({
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            status: (user.status === 'active' ? 'online' : user.status === 'away' ? 'away' : 'offline') as "online" | "away" | "offline"
          }));
          
          const current = users.find((u: User) => u.id === currentUserId);
          setCurrentUser(current || sampleUsers[0]);
          setAvailableUsers(users.filter((u: User) => u.id !== currentUserId));
        } else {
          // Fallback to sample data
          setCurrentUser(sampleUsers.find(u => u.id === currentUserId) || sampleUsers[0]);
          setAvailableUsers(sampleUsers.filter(u => u.id !== currentUserId));
        }

        // Load group conversations
        const conversationsResponse = await apiService.getConversations();
        if (conversationsResponse.success && Array.isArray(conversationsResponse.data)) {
          const groupConversations = conversationsResponse.data
            .filter((conv: any) => conv.type === 'group')
            .map((conv: any) => ({
              id: conv.id,
              name: conv.title,
              description: conv.description || '',
              avatar: conv.avatar,
              createdBy: conv.createdBy || currentUserId,
              createdAt: new Date(conv.createdAt),
              updatedAt: new Date(conv.createdAt),
              isPrivate: conv.isPrivate || false,
              members: conv.participants?.map((p: any) => ({
                userId: p.id,
                username: p.username,
                avatar: p.avatar,
                role: p.role || 'member',
                joinedAt: new Date(p.joinedAt || conv.createdAt),
                status: 'active'
              })) || [],
              lastActivity: new Date(conv.createdAt),
              unreadCount: 0
            }));
          
          if (groupConversations.length > 0) {
            setGroups(groupConversations);
            setCurrentGroupId(groupConversations[0].id);
            
            // Load messages for each group
            for (const group of groupConversations) {
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
            }
          } else {
            // Fallback to sample data
            setGroups(sampleGroups);
            setCurrentGroupId(sampleGroups[0].id);
            setMessages(sampleMessages);
          }
        } else {
          // Fallback to sample data
          setGroups(sampleGroups);
          setCurrentGroupId(sampleGroups[0].id);
          setMessages(sampleMessages);
        }
      } catch (err) {
        console.error('Failed to load group chat data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        
        // Fallback to sample data
        setCurrentUser(sampleUsers.find(u => u.id === currentUserId) || sampleUsers[0]);
        setAvailableUsers(sampleUsers.filter(u => u.id !== currentUserId));
        setGroups(sampleGroups);
        setCurrentGroupId(sampleGroups[0].id);
        setMessages(sampleMessages);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUserId]);

  const currentGroup = groups.find(g => g.id === currentGroupId);
  const currentGroupMessages = messages[currentGroupId] || [];

  const selectGroup = useCallback((groupId: string) => {
    setCurrentGroupId(groupId);
    // Mark messages as read when group is selected
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
      // Try to create group via API
      const response = await apiService.createConversation([...groupData.memberIds, currentUserId]);
      
      if (response.success && response.data) {
        const newGroup: Group = {
          id: response.data.id,
          name: groupData.name,
          description: groupData.description,
          avatar: groupData.avatar,
          createdBy: currentUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isPrivate: groupData.isPrivate,
          members: [
            {
              userId: currentUserId,
              username: currentUser?.username || "Unknown",
              avatar: currentUser?.avatar,
              role: "admin",
              joinedAt: new Date(),
              status: "active"
            },
            ...groupData.memberIds.map(userId => {
              const user = availableUsers.find(u => u.id === userId);
              return {
                userId,
                username: user?.username || "Unknown User",
                avatar: user?.avatar,
                role: "member" as const,
                joinedAt: new Date(),
                status: "active" as const
              };
            })
          ],
          lastActivity: new Date(),
          unreadCount: 0
        };

        setGroups(prev => [...prev, newGroup]);
        setMessages(prev => ({ ...prev, [newGroup.id]: [] }));
        setCurrentGroupId(newGroup.id);
        
        return newGroup;
      } else {
        throw new Error(response.error || 'Failed to create group');
      }
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
      
      // Fallback: create locally
      const newGroup: Group = {
        id: `group-${Date.now()}`,
        name: groupData.name,
        description: groupData.description,
        avatar: groupData.avatar,
        createdBy: currentUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPrivate: groupData.isPrivate,
        members: [
          {
            userId: currentUserId,
            username: currentUser?.username || "Unknown",
            avatar: currentUser?.avatar,
            role: "admin",
            joinedAt: new Date(),
            status: "active"
          },
          ...groupData.memberIds.map(userId => {
            const user = availableUsers.find(u => u.id === userId);
            return {
              userId,
              username: user?.username || "Unknown User",
              avatar: user?.avatar,
              role: "member" as const,
              joinedAt: new Date(),
              status: "active" as const
            };
          })
        ],
        lastActivity: new Date(),
        unreadCount: 0
      };

      setGroups(prev => [...prev, newGroup]);
      setMessages(prev => ({ ...prev, [newGroup.id]: [] }));
      setCurrentGroupId(newGroup.id);
      
      return newGroup;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentUser, availableUsers]);

  const updateGroup = useCallback(async (groupId: string, updateData: UpdateGroupData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Update locally first for immediate feedback
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              ...updateData,
              updatedAt: new Date()
            }
          : group
      ));
      
      // TODO: Add API call when endpoint is available
      // await apiService.updateGroup(groupId, updateData);
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
      // Update locally first
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
      
      // TODO: Add API call when endpoint is available
      // await apiService.addGroupMembers(groupId, memberIds);
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
      
      // TODO: Add API call when endpoint is available
      // await apiService.removeGroupMember(groupId, userId);
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              members: group.members.filter(m => m.userId !== currentUserId),
              updatedAt: new Date()
            }
          : group
      ));

      // If leaving current group, switch to another group or clear selection
      if (currentGroupId === groupId) {
        const remainingGroups = groups.filter(g => g.id !== groupId);
        setCurrentGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : "");
      }
      
      // TODO: Add API call when endpoint is available
      // await apiService.leaveGroup(groupId);
    } catch (err) {
      console.error('Failed to leave group:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentGroupId, groups]);

  const deleteGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      setGroups(prev => prev.filter(group => group.id !== groupId));
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[groupId];
        return newMessages;
      });

      // If deleting current group, switch to another group or clear selection
      if (currentGroupId === groupId) {
        const remainingGroups = groups.filter(g => g.id !== groupId);
        setCurrentGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : "");
      }
      
      // TODO: Add API call when endpoint is available
      // await apiService.deleteGroup(groupId);
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
      // Try to send via API
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
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message via API, using local fallback:', err);
      
      // Fallback: create message locally
      const newMessage: GroupMessage = {
        id: `msg-${Date.now()}`,
        content: content.trim(),
        senderId: currentUserId,
        senderName: currentUser?.username || "Unknown",
        timestamp: new Date(),
        groupId,
        attachments
      };

      setMessages(prev => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), newMessage]
      }));
    }

    // Update group's last activity
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
  }, [currentUserId, currentUser]);

  const editMessage = useCallback(async (groupId: string, messageId: string, content: string) => {
    setError(null);
    
    try {
      // Update locally first
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
      
      // TODO: Add API call when endpoint is available
      // await apiService.editMessage(groupId, messageId, content);
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
      
      // TODO: Add API call when endpoint is available
      // await apiService.deleteMessage(groupId, messageId);
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
      
      // TODO: Add API call when endpoint is available
      // await apiService.forwardMessage(groupId, message.id);
    } catch (err) {
      console.error('Failed to forward message:', err);
      setError(err instanceof Error ? err.message : 'Failed to forward message');
    }
  }, [currentUserId, currentUser]);

  return {
    // Data
    groups,
    currentGroupId,
    currentGroup,
    currentGroupMessages,
    messages,
    currentUser: currentUser || sampleUsers[0],
    availableUsers,
    
    // State
    loading,
    error,
    
    // Actions
    selectGroup,
    createGroup,
    updateGroup,
    addMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    sendMessage,
    editMessage,
    deleteMessage,
    forwardMessage
  };
};