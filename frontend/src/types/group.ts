export interface User {
  id: string;
  username: string;
  avatar?: string;
  status: "online" | "away" | "offline";
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean;
  members: GroupMember[];
  lastActivity?: Date;
  unreadCount: number;
}

export interface GroupMember {
  userId: string;
  username: string;
  avatar?: string;
  role: "admin" | "moderator" | "member";
  joinedAt: Date;
  status: "active" | "left" | "kicked";
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface CreateGroupData {
  name: string;
  description?: string;
  avatar?: string;
  isPrivate: boolean;
  memberIds: string[];
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatar?: string;
  isPrivate?: boolean;
}

export interface GroupMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  groupId: string;
  attachments?: Attachment[];
  edited?: boolean;
  editedAt?: Date;
  forwarded?: boolean;
  originalSender?: string;
  replyToId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  duration?: number;
}

export interface GroupFilters {
  searchTerm?: string;
  sortBy: "name" | "lastActivity" | "created" | "members";
  sortOrder: "asc" | "desc";
  showPrivate: boolean;
  showPublic: boolean;
  memberCount?: number;
}