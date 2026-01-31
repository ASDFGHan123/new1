import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  MessageCircle, 
  Users, 
  Hash, 
  Lock, 
  Globe,
  Crown,
  Shield,
  User as UserIcon,
  Plus
} from "lucide-react";
import type { User, Conversation } from "@/types/chat";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: User) => void;
  onSelectGroup: (groupId: string) => void;
  searchUsers: (query: string) => User[];
  searchGroups: (query: string) => Conversation[];
  searchConversations: (query: string) => Conversation[];
}

export const SearchDialog = ({
  open,
  onOpenChange,
  onSelectUser,
  onSelectGroup,
  searchUsers,
  searchGroups,
  searchConversations
}: SearchDialogProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredUsers = searchUsers(searchQuery.trim() || '');
  const filteredGroups = searchGroups(searchQuery.trim() || '');
  const filteredConversations = searchConversations(searchQuery.trim() || '');

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

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "moderator":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getGroupIcon = (conversation: Conversation) => {
    if (conversation.type !== 'group') return null;
    return conversation.isGroupPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  const formatMemberCount = (conversation: Conversation) => {
    return `${conversation.participants.length} member${conversation.participants.length !== 1 ? 's' : ''}`;
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
          <div className="bg-background rounded-lg border w-11/12 h-[90vh] flex flex-col overflow-hidden relative z-50">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{t('searchDialog.search')}</h3>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              ✕
            </Button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchDialog.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-hidden min-h-0">
          {filteredUsers.length > 0 || filteredGroups.length > 0 || filteredConversations.length > 0 || !searchQuery.trim() ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                <TabsTrigger value="users">
                  {t('chat.users')} ({filteredUsers.length})
                </TabsTrigger>
                <TabsTrigger value="groups">
                  {t('chat.groups')} ({filteredGroups.length})
                </TabsTrigger>
                <TabsTrigger value="conversations">
                  {t('conversations.conversationList')} ({filteredConversations.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="users" className="h-full mt-0">
                  <ScrollArea className="h-full p-6">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <UserIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">{t('users.noUsersFound')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback />
                                </Avatar>
                                <div 
                                  className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(user.status)} rounded-full border-2 border-background`}
                                />
                              </div>
                              <div>
                                <h4 className="font-medium">{user.username}</h4>
                                <p className="text-sm text-muted-foreground capitalize">{user.status}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              className="relative z-10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectUser(user);
                                onOpenChange(false);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t('chat.chat')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="groups" className="h-full mt-0">
                  <ScrollArea className="h-full p-6">
                    {filteredGroups.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">{t('chat.noGroupsFound')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredGroups.map((conversation) => (
                          <div
                            key={conversation.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={conversation.groupAvatar} />
                                <AvatarFallback>
                                  {conversation.groupName?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{conversation.groupName}</h4>
                                  {getGroupIcon(conversation)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {formatMemberCount(conversation)}
                                </p>
                                {conversation.participants.length > 0 && (
                                  <div className="flex -space-x-1 mt-1">
                                    {(conversation.participants || []).slice(0, 4).map((member) => (
                                      <Avatar key={member.id} className="h-6 w-6 border border-background">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="text-[10px]" />
                                      </Avatar>
                                    ))}
                                    {(conversation.participants || []).length > 4 && (
                                      <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center">
                                        <span className="text-[10px]">
                                          +{(conversation.participants || []).length - 4}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button 
                              size="sm"
                              className="relative z-10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (conversation.groupId) {
                                  onSelectGroup(conversation.groupId);
                                  onOpenChange(false);
                                }
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              {t('common.open')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="conversations" className="h-full mt-0">
                  <ScrollArea className="h-full p-6">
                    {filteredConversations.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">{t('conversations.noConversations')}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredConversations.map((conversation) => {
                          const title = conversation.type === 'group' 
                            ? conversation.groupName 
                            : conversation.participants.find(p => p.id !== conversation.userId)?.username;
                          
                          return (
                            <div
                              key={conversation.id}
                              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={conversation.groupAvatar} />
                                  <AvatarFallback>
                                    {title?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{title}</h4>
                                    {getGroupIcon(conversation)}
                                    <Badge variant="outline" className="text-xs">
                                      {conversation.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {conversation.lastMessage ? 
                                      `${conversation.lastMessage.content.substring(0, 50)}...` : 
                                      'No messages yet'
                                    }
                                  </p>
                                </div>
                              </div>
                              <Button 
                                size="sm"
                                className="relative z-10"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onSelectGroup(conversation.groupId || conversation.id);
                                  onOpenChange(false);
                                }}
                              >
                                Open
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6">
                <div className="text-center max-w-md mx-auto">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">{t('searchDialog.searchOffChat')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('searchDialog.searchDescription')}
                  </p>
                  
                  <div className="grid gap-3 text-left">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <UserIcon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{t('chat.users')}</p>
                        <p className="text-sm text-muted-foreground">{t('searchDialog.findUsers')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{t('chat.groups')}</p>
                        <p className="text-sm text-muted-foreground">{t('searchDialog.discoverGroups')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{t('conversations.conversationList')}</p>
                        <p className="text-sm text-muted-foreground">{t('searchDialog.searchChats')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
          </div>
        </div>
      )}
    </>
  );
};
