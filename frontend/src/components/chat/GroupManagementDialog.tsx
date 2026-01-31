import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  User,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
  X
} from "lucide-react";
import { Group, GroupMember, User as UserType, UpdateGroupData } from "@/types/group";

interface GroupManagementDialogProps {
  group: Group;
  currentUser: UserType;
  availableUsers: UserType[];
  onUpdateGroup: (groupId: string, data: UpdateGroupData) => void;
  onAddMembers: (groupId: string, memberIds: string[]) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  trigger?: React.ReactNode;
}

export const GroupManagementDialog = ({
  group,
  currentUser,
  availableUsers,
  onUpdateGroup,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  trigger
}: GroupManagementDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("settings"); // settings, members
  const [editingGroup, setEditingGroup] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Group editing state
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(group.description || "");
  const [groupAvatar, setGroupAvatar] = useState(group.avatar);
  const [isPrivate, setIsPrivate] = useState(group.isPrivate);
  
  // Member management state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const isAdmin = group.members.find(m => m.userId === currentUser.id)?.role === "admin";
  const isModerator = group.members.find(m => m.userId === currentUser.id)?.role === "moderator";
  const canManageGroup = isAdmin || isModerator;
  const canManageMembers = isAdmin || (isModerator && group.members.filter(m => m.role === "admin").length > 0);

  useEffect(() => {
    if (open) {
      setGroupName(group.name);
      setGroupDescription(group.description || "");
      setGroupAvatar(group.avatar);
      setIsPrivate(group.isPrivate);
    }
  }, [open, group]);

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !group.members.some(member => member.userId === user.id) &&
    !selectedMembers.includes(user.id)
  );

  const getRoleIcon = (role: GroupMember["role"]) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "moderator":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: GroupMember["role"]) => {
    switch (role) {
      case "admin":
        return "border-yellow-200 bg-yellow-50";
      case "moderator":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const handleSaveGroup = async () => {
    setLoading(true);
    try {
      const updateData: UpdateGroupData = {
        name: groupName.trim() || group.name,
        description: groupDescription.trim() || undefined,
        avatar: groupAvatar,
        isPrivate
      };
      await onUpdateGroup(group.id, updateData);
      setEditingGroup(false);
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;
    
    setLoading(true);
    try {
      await onAddMembers(group.id, selectedMembers);
      setSelectedMembers([]);
      setShowAddMembers(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Error adding members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!canManageMembers && userId !== currentUser.id) return;
    
    if (userId === currentUser.id) {
      await onLeaveGroup(group.id);
    } else {
      await onRemoveMember(group.id, userId);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin) return;
    
    if (window.confirm(t('chat.confirmDeleteGroup'))) {
      await onDeleteGroup(group.id);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('chat.groupSettings')}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            {t('chat.settings')}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("members")}
          >
            {t('chat.members')} ({group.members.length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2">
        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Group Info */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('chat.groupInformation')}</h3>
                {canManageGroup && !editingGroup && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingGroup(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('common.edit')}
                  </Button>
                )}
              </div>

              {editingGroup ? (
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={groupAvatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {groupName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ImageUpload value={groupAvatar} onChange={setGroupAvatar} />
                    <Label className="text-center">{t('chat.changeGroupAvatar')}</Label>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="editGroupName">{t('chat.groupName')}</Label>
                    <Input
                      id="editGroupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="editGroupDescription">{t('chat.groupDescription')}</Label>
                    <Textarea
                      id="editGroupDescription"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      maxLength={200}
                      rows={3}
                    />
                  </div>

                  {/* Privacy */}
                  <div className="space-y-2">
                    <Label>{t('chat.groupPrivacy')}</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="editIsPrivate"
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                      />
                      <Label htmlFor="editIsPrivate">
                        {isPrivate ? t('chat.privateGroup') : t('chat.publicGroup')}
                      </Label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingGroup(false);
                        setGroupName(group.name);
                        setGroupDescription(group.description || "");
                        setGroupAvatar(group.avatar);
                        setIsPrivate(group.isPrivate);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSaveGroup} disabled={loading}>
                      {loading ? t('common.saving') : t('common.saveChanges')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display Mode */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {group.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold">{group.name}</h4>
                      <p className="text-muted-foreground">{group.description || t('chat.noDescription')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={group.isPrivate ? "secondary" : "outline"}>
                          {group.isPrivate ? t('chat.private') : t('chat.public')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {t('chat.created')} {new Date(group.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Group Stats */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{group.members.length}</p>
                      <p className="text-sm text-muted-foreground">{t('chat.members')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{group.members.filter(m => m.role === "admin").length}</p>
                      <p className="text-sm text-muted-foreground">{t('chat.admins')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{group.unreadCount}</p>
                      <p className="text-sm text-muted-foreground">{t('chat.unread')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            {canManageGroup && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold text-destructive">{t('chat.dangerZone')}</h3>
                <div className="space-y-2">
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteGroup}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('chat.deleteGroup')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => onLeaveGroup(group.id)}
                    className="w-full"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    {t('chat.leaveGroup')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('chat.groupMembers')}</h3>
              {canManageMembers && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMembers(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('chat.addMembers')}
                </Button>
              )}
            </div>

            {/* Add Members Modal */}
            {showAddMembers && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t('chat.addNewMembers')}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddMembers(false);
                      setSelectedMembers([]);
                      setSearchTerm("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('chat.searchUsers')}
                    className="pl-10"
                  />
                </div>

                {/* User List */}
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {filteredAvailableUsers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t('chat.noUsersFound')}</p>
                    </div>
                  ) : (
                    filteredAvailableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedMembers(prev =>
                            prev.includes(user.id)
                              ? prev.filter(id => id !== user.id)
                              : [...prev, user.id]
                          );
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback />
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {t(`chat.${user.status}`)} {/* Localized user status */}
                            </p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded border ${
                          selectedMembers.includes(user.id)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        }`}>
                          {selectedMembers.includes(user.id) && (
                            <div className="w-full h-full bg-primary rounded flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                {selectedMembers.length > 0 && (
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMembers([]);
                        setSearchTerm("");
                      }}
                    >
                      {t('common.clear')}
                    </Button>
                    <Button onClick={handleAddMembers} disabled={loading}>
                      {t('chat.add')} {selectedMembers.length} {t('chat.members')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
              {group.members.map((member) => {
                const user = availableUsers.find(u => u.id === member.userId);
                const isCurrentUser = member.userId === currentUser.id;
                const canRemoveMember = canManageMembers || (isCurrentUser && member.role === "member");

                return (
                  <div
                    key={member.userId}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getRoleColor(member.role)}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar || member.avatar} />
                        <AvatarFallback />
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.username}
                            {isCurrentUser && ` (${t('chat.you')})`}
                          </p>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {t(`chat.${member.role}`)} • {t('chat.joined')} {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Status indicator for online users */}
                      {user && (
                        <div className={`w-3 h-3 rounded-full ${
                          user.status === "online" ? "bg-green-500" :
                          user.status === "away" ? "bg-yellow-500" : "bg-gray-400"
                        }`} />
                      )}

                      {/* Actions Menu */}
                      {canRemoveMember && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isCurrentUser && (
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.userId)}
                                className="text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                {t('chat.removeFromGroup')}
                              </DropdownMenuItem>
                            )}
                            {isCurrentUser && (
                              <DropdownMenuItem
                                onClick={() => onLeaveGroup(group.id)}
                                className="text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                {t('chat.leaveGroup')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};