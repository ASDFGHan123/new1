import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Users,
  Plus,
  Search,
  Crown,
  Shield,
  Settings,
  Trash2,
  Eye,
  MessageSquare,
  Lock,
  Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateGroupDialog } from './CreateGroupDialog';
import { GroupMembersDialog } from './GroupMembersDialog';
import type { User, Group } from '@/types/group';

interface GroupSidebarProps {
  currentUser: User;
  groups: Group[];
  availableUsers: User[];
  currentGroupId?: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (groupData: any) => void;
  onUpdateGroup: (groupId: string, data: any) => void;
  onAddMembers: (groupId: string, memberIds: string[]) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function GroupSidebar({
  currentUser,
  groups,
  availableUsers,
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
}: GroupSidebarProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return groups.filter(group =>
      group.name.toLowerCase().includes(lowerSearchTerm) ||
      group.description?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [groups, searchTerm]);

  const getRoleForUser = (group: Group): string => {
    const member = group.members?.find(m => m.userId === currentUser.id);
    return member?.role || 'member';
  };

  const canManageGroup = (group: Group): boolean => {
    const role = getRoleForUser(group);
    return role === 'admin' || role === 'moderator';
  };

  const formatLastActivity = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t("common.justNow");
    if (minutes < 60) return t("common.minutesAgo", { count: minutes });
    if (hours < 24) return t("common.hoursAgo", { count: hours });
    if (days < 7) return t("common.daysAgo", { count: days });
    return date.toLocaleDateString();
  };

  const handleShowMembers = (group: Group) => {
    setSelectedGroupForMembers(group);
    setShowMembersDialog(true);
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("chat.groups")}</h2>
          </div>

          <CreateGroupDialog
            currentUser={currentUser}
            availableUsers={availableUsers}
            onCreateGroup={onCreateGroup}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("chat.searchGroups")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Groups List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{t("chat.noGroupsFound")}</p>
              <p className="text-sm mb-4">
                {searchTerm ? t("chat.tryAdjustingSearch") : t("chat.createFirstGroup")}
              </p>
              {!searchTerm && (
                <CreateGroupDialog
                  currentUser={currentUser}
                  availableUsers={availableUsers}
                  onCreateGroup={onCreateGroup}
                  trigger={
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("chat.createGroup")}
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isActive = currentGroupId === group.id;
              const userRole = getRoleForUser(group);
              const hasUnread = group.unreadCount > 0;

              return (
                <div
                  key={group.id}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => onSelectGroup(group.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Group Avatar */}
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={group.avatar} alt={group.name} />
                          <AvatarFallback>
                            {group.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
                        )}
                      </div>

                      {/* Group Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{group.name}</h3>
                          {group.isPrivate && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                          {userRole === 'admin' && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                          {userRole === 'moderator' && (
                            <Shield className="h-3 w-3 text-blue-500" />
                          )}
                        </div>

                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                            {group.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{group.members?.length || 0}</span>
                          </div>
                          {group.lastActivity && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{formatLastActivity(new Date(group.lastActivity))}</span>
                            </div>
                          )}
                        </div>

                        {hasUnread && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            {group.unreadCount} {t("chat.unread")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShowMembers(group)}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t("chat.viewMembers")}
                        </DropdownMenuItem>
                        
                        {canManageGroup(group) && (
                          <>
                            <DropdownMenuItem onClick={() => onSelectGroup(group.id)}>
                              <Settings className="h-4 w-4 mr-2" />
                              {t("chat.groupSettings")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        <DropdownMenuItem
                          onClick={() => onLeaveGroup(group.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("chat.leaveGroup")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Quick Stats */}
      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-primary">{groups.length}</p>
            <p className="text-xs text-muted-foreground">{t("chat.totalGroups")}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">
              {groups.filter(g => g.isPrivate).length}
            </p>
            <p className="text-xs text-muted-foreground">{t("chat.private")}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">
              {groups.filter(g => g.unreadCount > 0).length}
            </p>
            <p className="text-xs text-muted-foreground">{t("chat.unread")}</p>
          </div>
        </div>
      </div>

      {/* Members Dialog */}
      {selectedGroupForMembers && (
        <GroupMembersDialog
          group={selectedGroupForMembers}
          open={showMembersDialog}
          onOpenChange={setShowMembersDialog}
        />
      )}
    </div>
  );
}
