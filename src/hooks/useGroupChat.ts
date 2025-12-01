import { useState, useEffect, useCallback } from "react";
import { User, Group, GroupMessage, GroupMember, CreateGroupData, UpdateGroupData } from "@/types/group";

// Sample data for demonstration
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
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
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
    lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    unreadCount: 2
  },
  {
    id: "group-2",
    name: "Project Planning",
    description: "Weekly planning sessions and project discussions",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=planning",
    createdBy: "4",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isPrivate: true,
    members: [
      {
        userId: "4",
        username: "Diana Prince",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
        role: "admin",
        joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: "active"
      },
      {
        userId: "1",
        username: "Alice Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        role: "member",
        joinedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        status: "active"
      },
      {
        userId: "5",
        username: "Eve Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
        role: "member",
        joinedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        status: "active"
      }
    ],
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 0
  },
  {
    id: "group-3",
    name: "Random Chat",
    description: "Just for fun conversations",
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=random",
    createdBy: "2",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isPrivate: false,
    members: [
      {
        userId: "2",
        username: "Bob Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        role: "admin",
        joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: "active"
      },
      {
        userId: "3",
        username: "Charlie Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
        role: "member",
        joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "active"
      },
      {
        userId: "4",
        username: "Diana Prince",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
        role: "member",
        joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "active"
      },
      {
        userId: "5",
        username: "Eve Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
        role: "member",
        joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: "active"
      }
    ],
    lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    unreadCount: 5
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
    },
    {
      id: "msg-2", 
      content: "Absolutely! I've prepared the user stories.",
      senderId: "2",
      senderName: "Bob Smith",
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      groupId: "group-1"
    },
    {
      id: "msg-3",
      content: "Great! I can review the backend requirements.",
      senderId: "3",
      senderName: "Charlie Brown",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      groupId: "group-1"
    }
  ],
  "group-2": [
    {
      id: "msg-4",
      content: "Let's discuss the Q1 roadmap",
      senderId: "4",
      senderName: "Diana Prince",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      groupId: "group-2"
    },
    {
      id: "msg-5",
      content: "I've prepared the initial draft",
      senderId: "1",
      senderName: "Alice Johnson",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      groupId: "group-2"
    }
  ],
  "group-3": [
    {
      id: "msg-6",
      content: "Anyone up for pizza tonight? 🍕",
      senderId: "2",
      senderName: "Bob Smith",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      groupId: "group-3"
    },
    {
      id: "msg-7",
      content: "I'm in! What time?",
      senderId: "3",
      senderName: "Charlie Brown",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      groupId: "group-3"
    },
    {
      id: "msg-8",
      content: "Count me in too!",
      senderId: "4",
      senderName: "Diana Prince",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      groupId: "group-3"
    },
    {
      id: "msg-9",
      content: "Sorry, can't make it tonight. Maybe tomorrow?",
      senderId: "5",
      senderName: "Eve Wilson",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      groupId: "group-3"
    }
  ]
};

export const useGroupChat = (currentUserId: string = "1") => {
  const [groups, setGroups] = useState<Group[]>(sampleGroups);
  const [currentGroupId, setCurrentGroupId] = useState<string>(sampleGroups[0].id);
  const [messages, setMessages] = useState<Record<string, GroupMessage[]>>(sampleMessages);
  const [loading, setLoading] = useState(false);

  const currentUser = sampleUsers.find(u => u.id === currentUserId) || sampleUsers[0];
  const availableUsers = sampleUsers.filter(u => u.id !== currentUserId);

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
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
            username: currentUser.username,
            avatar: currentUser.avatar,
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
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              ...updateData,
              updatedAt: new Date()
            }
          : group
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  const addMembers = useCallback(async (groupId: string, memberIds: string[]) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    } finally {
      setLoading(false);
    }
  }, [availableUsers]);

  const removeMember = useCallback(async (groupId: string, userId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGroups(prev => prev.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              members: group.members.filter(m => m.userId !== userId),
              updatedAt: new Date()
            }
          : group
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentGroupId, groups]);

  const deleteGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    } finally {
      setLoading(false);
    }
  }, [currentGroupId, groups]);

  const sendMessage = useCallback(async (groupId: string, content: string, attachments?: any[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;
    
    const newMessage: GroupMessage = {
      id: `msg-${Date.now()}`,
      content: content.trim(),
      senderId: currentUserId,
      senderName: currentUser.username,
      timestamp: new Date(),
      groupId,
      attachments
    };

    setMessages(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), newMessage]
    }));

    // Update group's last activity and unread counts for other members
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
  }, [currentUserId, currentUser.username]);

  const editMessage = useCallback(async (groupId: string, messageId: string, content: string) => {
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
  }, []);

  const deleteMessage = useCallback(async (groupId: string, messageId: string) => {
    setMessages(prev => ({
      ...prev,
      [groupId]: prev[groupId]?.filter(msg => msg.id !== messageId) || []
    }));
  }, []);

  const forwardMessage = useCallback(async (groupId: string, message: GroupMessage) => {
    const forwardedMessage: GroupMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUser.username,
      timestamp: new Date(),
      forwarded: true,
      originalSender: message.senderName
    };

    setMessages(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), forwardedMessage]
    }));
  }, [currentUserId, currentUser.username]);

  return {
    // Data
    groups,
    currentGroupId,
    currentGroup,
    currentGroupMessages,
    messages,
    currentUser,
    availableUsers,
    
    // State
    loading,
    
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