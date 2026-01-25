import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Plus,
  Settings,
  MessageCircle,
  Hash,
  Lock,
  Globe,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  MessageSquare,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { Group, User as UserType, GroupFilters } from "@/types/group";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupManagementDialog } from "./GroupManagementDialog";
import { GroupMembersDialog } from "./GroupMembersDialog";

interface GroupSidebarProps {
  groups: Group[];
  currentUser: UserType;
  availableUsers: UserType[];
  currentGroupId?: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (groupData: any) => void;
  onUpdateGroup: (groupId: string, data: any) => void;
  onAddMembers: (groupId: string, memberIds: string[]) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

export const GroupSidebar = ({
  groups,
  currentUser,
  availableUsers,
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
}: GroupSidebarProps) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<GroupFilters>({
    sortBy: "lastActivity",
    sortOrder: "desc",
    showPrivate: true,
    showPublic: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<
    Group | null
  >(null);

  const filteredGroups = groups
    .filter((group) => {
      // Search filter
      if (
        searchTerm &&
        !group.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Privacy filter
      if (!filters.showPrivate && group.isPrivate) return false;
      if (!filters.showPublic && !group.isPrivate) return false;

      // Member count filter
      if (filters.memberCount && group.members.length !== filters.memberCount) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "lastActivity":
          comparison =
            new Date(b.lastActivity || 0).getTime() -
            new Date(a.lastActivity || 0).getTime();
          break;
        case "created":
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "members":
          comparison = a.members.length - b.members.length;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

  const getGroupIcon = (group: Group) => {
    return group.isPrivate ? (
      <Lock className="h-4 w-4" />
    ) : (
      <Globe className="h-4 w-4" />
    );
  };

  const getRoleForUser = (group: Group) => {
    return group.members.find((m) => m.userId === currentUser.id)?.role ||
      "member";
  };

  const isAdmin = (group: Group) => getRoleForUser(group) === "admin";
  const isModerator = (group: Group) => getRoleForUser(group) === "moderator";

  const formatLastActivity = (date: Date) => {
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
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("chat.searchGroups")}
            className="pl-10 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-1" />
                {t("chat.filters")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-sm font-medium">{t("chat.sortBy")}</label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: any) =>
                      setFilters((prev) => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">{t("common.name")}</SelectItem>
                      <SelectItem value="lastActivity">
                        {t("chat.lastActivity")}
                      </SelectItem>
                      <SelectItem value="created">
                        {t("chat.dateCreated")}
                      </SelectItem>
                      <SelectItem value="members">
                        {t("chat.memberCount")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">{t("chat.order")}</label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: any) =>
                      setFilters((prev) => ({ ...prev, sortOrder: value }))
                    }
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          {t("chat.ascending")}
                        </div>
                      </SelectItem>
                      <SelectItem value="desc">
                        <div className="flex items-center gap-2">
                          <SortDesc className="h-4 w-4" />
                          {t("chat.descending")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">{t("chat.show")}</label>
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.showPublic}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, showPublic: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">{t("chat.publicGroups")}</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.showPrivate}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, showPrivate: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">{t("chat.privateGroups")}</span>
                    </label>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-xs text-muted-foreground">
            {filteredGroups.length} {t("common.of")} {groups.length}
          </div>
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
                  <div className="flex items-start gap-3">
                    {/* Group Avatar */}
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={group.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {group.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        {getGroupIcon(group)}
                      </div>
                    </div>

                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate text-sm">{group.name}</p>
                        {hasUnread && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            {group.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button
                          className="hover:text-primary hover:underline cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroupForMembers(group);
                            setShowMembersDialog(true);
                          }}
                        >
                          {group.members.length} {t("chat.members")}
                        </button>
                        {group.lastActivity && (
                          <>
                            <span>•</span>
                            <span>{formatLastActivity(group.lastActivity)}</span>
                          </>
                        )}
                      </div>

                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {group.description}
                        </p>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroupForMembers(group);
                              setShowMembersDialog(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {t("chat.viewMembers")}
                          </DropdownMenuItem>
                          
                          {(isAdmin(group) || isModerator(group)) && (
                            <GroupManagementDialog
                              group={group}
                              currentUser={currentUser}
                              availableUsers={availableUsers}
                              onUpdateGroup={onUpdateGroup}
                              onAddMembers={onAddMembers}
                              onRemoveMember={onRemoveMember}
                              onLeaveGroup={onLeaveGroup}
                              onDeleteGroup={onDeleteGroup}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  {t("chat.manageGroup")}
                                </DropdownMenuItem>
                              }
                            />
                          )}
                          
                          <DropdownMenuItem
                            onClick={() => onLeaveGroup(group.id)}
                            className="text-destructive"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            {t("chat.leaveGroup")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
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
};