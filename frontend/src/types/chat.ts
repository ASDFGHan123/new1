import { User, GroupMessage, Attachment } from "./group";

// Re-export types from group module for convenience
export type { User, GroupMessage, Attachment } from "./group";

// Individual conversation types
export interface IndividualMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  attachments?: Attachment[];
  edited?: boolean;
  editedAt?: Date;
  forwarded?: boolean;
  originalSender?: string;
  replyToId?: string;
}

export interface Conversation {
  id: string;
  type: 'individual' | 'group';
  participants: User[];
  lastMessage?: IndividualMessage | GroupMessage;
  lastActivity: Date;
  unreadCount: number;
  
  // Group-specific fields
  groupId?: string;
  groupName?: string;
  groupAvatar?: string;
  isGroupPrivate?: boolean;
  
  // Individual-specific fields
  userId?: string; // For individual chats, the other person's ID
}

// Authentication types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  lastSeen?: Date;
}

export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Chat state types
export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  currentMessages: (IndividualMessage | GroupMessage)[];
  messages: Record<string, (IndividualMessage | GroupMessage)[]>;
  loading: boolean;
  error: string | null;
}

// Search types
export interface SearchResult {
  users: User[];
  groups: Conversation[];
  conversations: Conversation[];
}

// Chat actions
export interface ChatActions {
  // Authentication
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  
  // Conversations
  createIndividualConversation: (userId: string) => Conversation;
  selectConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  
  // Messages
  sendMessage: (conversationId: string, content: string, attachments?: Attachment[]) => void;
  editMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  forwardMessage: (conversationId: string, message: IndividualMessage | GroupMessage) => void;
  
  // Search
  searchUsers: (query: string) => User[];
  searchGroups: (query: string) => Conversation[];
  searchConversations: (query: string) => Conversation[];
}

// Extended chat interface with group chat data
export interface UnifiedChatData extends ChatState, ChatActions {
  // Group chat data
  groups: any[];
  availableUsers: User[];
  currentUser: AuthUser | null;
  
  // Group actions
  createGroup: (data: any) => Promise<any>;
  updateGroup: (groupId: string, data: any) => Promise<void>;
  addMembers: (groupId: string, memberIds: string[]) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  selectGroup: (groupId: string) => void;
}