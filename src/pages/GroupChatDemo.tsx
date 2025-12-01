import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageCircle, 
  Settings, 
  UserPlus,
  Crown,
  Shield,
  User,
  LogOut,
  Info
} from "lucide-react";
import { GroupChatInterface } from "@/components/chat/GroupChatInterface";
import { useGroupChat } from "@/hooks/useGroupChat";
import { User as UserType } from "@/types/group";

export const GroupChatDemo = () => {
  const [currentUserId, setCurrentUserId] = useState("1");
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  
  const {
    groups,
    currentGroupId,
    currentGroup,
    currentGroupMessages,
    currentUser,
    availableUsers,
    loading,
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
  } = useGroupChat(currentUserId);

  const handleLogout = () => {
    // Demo logout - in real app this would handle actual logout
    console.log("Logout clicked");
  };

  const handleUpdateUser = (updates: Partial<UserType>) => {
    // Demo user update - in real app this would update user profile
    console.log("Update user:", updates);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Demo Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                OffChat Group Chat Demo
              </h1>
            </div>
            <Badge variant="secondary" className="text-xs">
              Demo Mode
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Current User Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Logged in as:</span>
              <select
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="px-2 py-1 rounded border bg-background text-sm"
              >
                <option value="1">Alice Johnson (Admin)</option>
                <option value="2">Bob Smith (Moderator)</option>
                <option value="3">Charlie Brown (Member)</option>
                <option value="4">Diana Prince (Member)</option>
                <option value="5">Eve Wilson (Member)</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDemoInfo(true)}
            >
              <Info className="h-4 w-4 mr-2" />
              Demo Info
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="flex-1">
        <GroupChatInterface
          user={currentUser}
          groups={groups}
          availableUsers={availableUsers}
          currentGroupId={currentGroupId}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
          onSelectGroup={selectGroup}
          onCreateGroup={createGroup}
          onUpdateGroup={updateGroup}
          onAddMembers={addMembers}
          onRemoveMember={removeMember}
          onLeaveGroup={leaveGroup}
          onDeleteGroup={deleteGroup}
          onSendMessage={sendMessage}
          onEditMessage={editMessage}
          onDeleteMessage={deleteMessage}
          onForwardMessage={forwardMessage}
        />
      </div>

      {/* Demo Info Modal */}
      {showDemoInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Group Chat Demo Features</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDemoInfo(false)}
                >
                  ✕
                </Button>
              </div>

              <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="users">Sample Users</TabsTrigger>
                  <TabsTrigger value="groups">Sample Groups</TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Core Group Chat Features</h3>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Group Creation & Management</p>
                          <p className="text-sm text-muted-foreground">
                            Create groups with custom names, descriptions, avatars, and privacy settings
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <UserPlus className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Member Management</p>
                          <p className="text-sm text-muted-foreground">
                            Add/remove members, assign roles (Admin, Moderator, Member)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Group Messaging</p>
                          <p className="text-sm text-muted-foreground">
                            Send messages, attachments, voice messages with group context
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Settings className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Advanced Features</p>
                          <p className="text-sm text-muted-foreground">
                            Group search/filtering, message editing, forwarding, unread counts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sample Users & Roles</h3>
                    <div className="space-y-3">
                      {[
                        { id: "1", name: "Alice Johnson", role: "admin", status: "online", description: "Full group management permissions" },
                        { id: "2", name: "Bob Smith", role: "moderator", status: "online", description: "Can manage members and group settings" },
                        { id: "3", name: "Charlie Brown", role: "member", status: "away", description: "Standard group member" },
                        { id: "4", name: "Diana Prince", role: "member", status: "online", description: "Standard group member" },
                        { id: "5", name: "Eve Wilson", role: "member", status: "offline", description: "Standard group member" }
                      ].map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.toLowerCase().replace(' ', '')}`} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.name}</p>
                              {user.role === "admin" && <Crown className="h-4 w-4 text-yellow-500" />}
                              {user.role === "moderator" && <Shield className="h-4 w-4 text-blue-500" />}
                              {user.role === "member" && <User className="h-4 w-4 text-gray-500" />}
                              <Badge variant={user.status === "online" ? "default" : "secondary"} className="text-xs">
                                {user.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{user.description}</p>
                          </div>
                          {currentUserId === user.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Sample Groups</h3>
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <div key={group.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={group.avatar} />
                              <AvatarFallback>
                                {group.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{group.name}</p>
                                <Badge variant={group.isPrivate ? "secondary" : "outline"} className="text-xs">
                                  {group.isPrivate ? "Private" : "Public"}
                                </Badge>
                                {group.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {group.unreadCount} unread
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{group.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{group.members.length} members</span>
                                <span>•</span>
                                <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Last activity {new Date(group.lastActivity || group.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {group.members.slice(0, 6).map((member) => (
                              <div key={member.userId} className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={member.avatar} />
                                  <AvatarFallback className="text-[8px]">
                                    {member.username.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.username}</span>
                                {member.role === "admin" && <Crown className="h-3 w-3 text-yellow-500" />}
                                {member.role === "moderator" && <Shield className="h-3 w-3 text-blue-500" />}
                              </div>
                            ))}
                            {group.members.length > 6 && (
                              <div className="px-2 py-1 bg-muted rounded text-xs">
                                +{group.members.length - 6} more
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">How to Test</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Switch between different users using the dropdown in the header</li>
                  <li>• Create new groups using the "Create Group" button</li>
                  <li>• Test member management by adding/removing users from groups</li>
                  <li>• Try different user roles (Admin, Moderator, Member) to see permission differences</li>
                  <li>• Send messages and test message editing/deletion features</li>
                  <li>• Use the search and filtering features in the group sidebar</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};