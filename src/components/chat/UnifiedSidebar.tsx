import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Users, 
  Hash, 
  Lock, 
  Globe,
  Crown,
  Shield,
  User as UserIcon,
  MoreVertical,
  X
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Conversation, User, AuthUser } from "@/types/chat";

interface UnifiedSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onSearchOpen: () => void;
  currentUser: AuthUser;
  availableUsers: User[];
  groups: any[];
  onCreateGroup: (data: any) => Promise<any>;
  onCreateIndividualChat: (userId: string) => Conversation;
  onDeleteConversation?: (conversationId: string) => void;
}

export const UnifiedSidebar = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onSearchOpen,
  currentUser,
  availableUsers,
  groups,
  onCreateGroup,
  onCreateIndividualChat,
  onDeleteConversation
}: UnifiedSidebarProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.groupName || t('chat.unnamedGroup');
    } else {
      const otherUser = conversation.participants?.find(p => String(p.id) !== String(currentUser.id));
      if (otherUser?.username) return otherUser.username;
      return t('chat.unknownUser');
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    if (conversation.type === 'group') {
      return conversation.groupName?.toLowerCase().includes(searchLower) || false;
    } else {
      const title = getConversationTitle(conversation);
      return title?.toLowerCase().includes(searchLower) || false;
    }
  });

  const formatLastMessage = (conversation: Conversation) => {
    if (!conversation.lastMessage) return t('chat.noMessagesYet');
    
    const message = conversation.lastMessage;
    const senderName = 'senderName' in message ? message.senderName : t('common.unknown');
    const content = message.content;
    
    if (content.length > 50) {
      return `${senderName}: ${content.substring(0, 50)}...`;
    }
    return `${senderName}: ${content}`;
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? t('common.justNow') : t('common.minutesAgo', { count: diffInMinutes });
    } else if (diffInHours < 24) {
      return t('common.hoursAgo', { count: Math.floor(diffInHours) });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t('common.daysAgo', { count: diffInDays });
    }
  };

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getGroupIcon = (conversation: Conversation) => {
    if (conversation.type !== 'group') return null;
    return conversation.isGroupPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.groupAvatar;
    } else {
      const otherUser = conversation.participants?.find(p => String(p.id) !== String(currentUser.id));
      if (otherUser?.avatar) return otherUser.avatar;
      return undefined;
    }
  };

  const getConversationAvatarFallback = (conversation: Conversation) => {
    const title = getConversationTitle(conversation);
    return (title || '??').slice(0, 2).toUpperCase();
  };

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    onDeleteConversation?.(conversationId);
  };

  return (
    <div className="w-80 bg-card/30 backdrop-blur-sm border-r border-border/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback showDefaultIcon={false} className="bg-primary text-primary-foreground">
              {(currentUser.username || '??').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{currentUser.username}</h3>
            <p className="text-sm text-muted-foreground">{t('users.online')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onSearchOpen}
          >
            <Search className="h-4 w-4 mr-2" />
            {t('common.search')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateGroup(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('chat.searchConversations')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? t('chat.noConversationsFound') : t('chat.noConversationsYet')}
              </p>
              {!searchTerm && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('chat.startBySearchingOrCreatingGroup')}
                </p>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conversation.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback showDefaultIcon={false} className="bg-muted">
                        {getConversationAvatarFallback(conversation)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {conversation.type === 'individual' && (
                      <div 
                        className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                          availableUsers.find(u => String(u.id) === String(conversation.userId))?.status || 'offline'
                        )} rounded-full border-2 border-card`}
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate text-sm">
                        {getConversationTitle(conversation)}
                      </h4>
                      {getGroupIcon(conversation)}
                      {conversation.type === 'group' && (
                        <div className="flex -space-x-1">
                          {(conversation.participants || []).slice(0, 3).map((member, idx) => (
                            <Avatar key={`${member.id}-${idx}`} className="h-4 w-4 border border-card">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-[8px]">
                                {(member.username || '?').slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {conversation.participants.length > 3 && (
                            <div className="h-4 w-4 rounded-full bg-muted border border-card flex items-center justify-center">
                              <span className="text-[8px]">
                                +{(conversation.participants || []).length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {formatLastMessage(conversation)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatLastActivity(conversation.lastActivity)}
                      </span>
                      
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Conversation Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem>
                      View Details
                    </DropdownMenuItem>
                    {conversation.type === 'individual' && (
                      <DropdownMenuItem>
                        Mark as Read
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem 
                      onClick={(e) => handleDeleteConversation(e as any, conversation.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border/50">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Quick Start</h4>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onSearchOpen}
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Find Friends
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowCreateGroup(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Create Group Dialog */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Group</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateGroup(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              <CreateGroupDialog
                currentUser={currentUser as any}
                availableUsers={availableUsers}
                onCreateGroup={async (data) => {
                  await onCreateGroup(data);
                  setShowCreateGroup(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
