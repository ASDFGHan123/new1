import { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredUsers = searchQuery ? searchUsers(searchQuery) : [];
  const filteredGroups = searchQuery ? searchGroups(searchQuery) : [];
  const filteredConversations = searchQuery ? searchConversations(searchQuery) : [];

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg border w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Search</h3>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              ✕
            </Button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for users, groups, or conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-hidden">
          {searchQuery ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                <TabsTrigger value="users">
                  Users ({filteredUsers.length})
                </TabsTrigger>
                <TabsTrigger value="groups">
                  Groups ({filteredGroups.length})
                </TabsTrigger>
                <TabsTrigger value="conversations">
                  Conversations ({filteredConversations.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="users" className="h-full mt-0">
                  <ScrollArea className="h-full p-6">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <UserIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">No users found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                              onSelectUser(user);
                              onOpenChange(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback>
                                    {user.username.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
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
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Chat
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
                        <p className="text-sm text-muted-foreground">No groups found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredGroups.map((conversation) => (
                          <div
                            key={conversation.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                              if (conversation.groupId) {
                                onSelectGroup(conversation.groupId);
                                onOpenChange(false);
                              }
                            }}
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
                                    {conversation.participants.slice(0, 4).map((member) => (
                                      <Avatar key={member.id} className="h-6 w-6 border border-background">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="text-[10px]">
                                          {member.username.slice(0, 1)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {conversation.participants.length > 4 && (
                                      <div className="h-6 w-6 rounded-full bg-muted border border-background flex items-center justify-center">
                                        <span className="text-[10px]">
                                          +{conversation.participants.length - 4}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button size="sm">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Open
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
                        <p className="text-sm text-muted-foreground">No conversations found</p>
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
                              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                onSelectGroup(conversation.groupId || '');
                                onOpenChange(false);
                              }}
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
                              <Button size="sm">
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
            /* No search query - show suggestions */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Search OffChat</h3>
                <p className="text-muted-foreground mb-6">
                  Find users to chat with, join groups, or search through your existing conversations
                </p>
                
                <div className="grid gap-3 text-left">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <UserIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Users</p>
                      <p className="text-sm text-muted-foreground">Find friends and colleagues</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Groups</p>
                      <p className="text-sm text-muted-foreground">Discover public and private groups</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Conversations</p>
                      <p className="text-sm text-muted-foreground">Search your existing chats</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};