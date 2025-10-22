import { Trash2, RotateCcw, X, Search, Filter, Eye, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  status: "active" | "suspended" | "banned";
  role: string;
  joinDate: string;
  lastActive: string;
  messageCount: number;
  reportCount: number;
  avatar?: string;
  deletedAt?: string;
}

interface Conversation {
  id: string;
  type: "private" | "group";
  title: string;
  participants: string[];
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string;
    type?: string;
  }>;
  createdAt: string;
  isActive: boolean;
  deletedAt?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  deletedAt?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
  deletedAt?: string;
}

interface TrashProps {
  trashedUsers: User[];
  trashedConversations: Conversation[];
  trashedMessageTemplates: MessageTemplate[];
  trashedMessages: any[];
  trashedRoles: Role[];
  onRestoreUser: (userId: string) => void;
  onRestoreConversation: (conversationId: string) => void;
  onRestoreMessageTemplate: (templateId: string) => void;
  onRestoreMessage: (message: any) => void;
  onRestoreRole: (role: Role) => void;
  onPermanentDeleteUser: (userId: string) => void;
  onPermanentDeleteConversation: (conversationId: string) => void;
  onPermanentDeleteMessageTemplate: (templateId: string) => void;
  onPermanentDeleteMessage: (messageId: string) => void;
  onPermanentDeleteRole: (roleId: string) => void;
}

type TrashedItem = (User | Conversation | MessageTemplate | Role) & { itemType: string };

export const Trash = ({
  trashedUsers,
  trashedConversations,
  trashedMessageTemplates,
  trashedMessages,
  trashedRoles,
  onRestoreUser,
  onRestoreConversation,
  onRestoreMessageTemplate,
  onRestoreMessage,
  onRestoreRole,
  onPermanentDeleteUser,
  onPermanentDeleteConversation,
  onPermanentDeleteMessageTemplate,
  onPermanentDeleteMessage,
  onPermanentDeleteRole,
}: TrashProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "users" | "conversations" | "templates" | "roles">("all");
  const [sortBy, setSortBy] = useState<"deletedAt" | "name" | "type">("deletedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Combine all trashed items with type information
  const allTrashedItems: TrashedItem[] = [
    ...trashedUsers.map(user => ({ ...user, itemType: "User" })),
    ...trashedConversations.map(conv => ({ ...conv, itemType: "Conversation" })),
    ...trashedMessageTemplates.map(template => ({ ...template, itemType: "Template" })),
    ...trashedMessages.map(message => ({ ...message, itemType: "Message" as const, name: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : '') || 'Message' })),
    ...trashedRoles.map(role => ({ ...role, itemType: "Role" })),
  ];

  // Filter and sort items
  const filteredAndSortedItems = allTrashedItems
    .filter(item => {
      const matchesSearch = item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ("username" in item && item.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           ("title" in item && item.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           ("name" in item && item.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === "all" || item.itemType.toLowerCase() === typeFilter.slice(0, -1); // Remove 's' from plural
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "deletedAt":
          aValue = new Date(a.deletedAt || "").getTime();
          bValue = new Date(b.deletedAt || "").getTime();
          break;
        case "name":
          aValue = ("username" in a && a.username) || ("title" in a && a.title) || ("name" in a && a.name) || "";
          bValue = ("username" in b && b.username) || ("title" in b && b.title) || ("name" in b && b.name) || "";
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
          break;
        case "type":
          aValue = a.itemType.toLowerCase();
          bValue = b.itemType.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleRestore = (item: TrashedItem) => {
    switch (item.itemType) {
      case "User":
        onRestoreUser(item.id);
        break;
      case "Conversation":
        onRestoreConversation(item.id);
        break;
      case "Template":
        onRestoreMessageTemplate(item.id);
        break;
      case "Message":
        onRestoreMessage(item);
        break;
      case "Role":
        onRestoreRole(item as Role);
        break;
    }
  };

  const handlePermanentDelete = (item: TrashedItem) => {
    switch (item.itemType) {
      case "User":
        onPermanentDeleteUser(item.id);
        break;
      case "Conversation":
        onPermanentDeleteConversation(item.id);
        break;
      case "Template":
        onPermanentDeleteMessageTemplate(item.id);
        break;
      case "Message":
        onPermanentDeleteMessage(item.id);
        break;
      case "Role":
        onPermanentDeleteRole(item.id);
        break;
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredAndSortedItems.map(item => `${item.itemType}-${item.id}`));
      setSelectAll(true);
    } else {
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const handleBulkRestore = () => {
    selectedItems.forEach(itemId => {
      const [itemType, id] = itemId.split('-', 2);
      const item = filteredAndSortedItems.find(i => `${i.itemType}-${i.id}` === itemId);
      if (item) {
        handleRestore(item);
      }
    });
    setSelectedItems([]);
    setSelectAll(false);
  };

  const handleBulkPermanentDelete = () => {
    selectedItems.forEach(itemId => {
      const [itemType, id] = itemId.split('-', 2);
      const item = filteredAndSortedItems.find(i => `${i.itemType}-${i.id}` === itemId);
      if (item) {
        handlePermanentDelete(item);
      }
    });
    setSelectedItems([]);
    setSelectAll(false);
  };

  const getItemName = (item: TrashedItem): string => {
    if ("username" in item) return item.username;
    if ("title" in item) return item.title;
    if ("name" in item) return item.name;
    return "Unknown";
  };

  const getItemDetails = (item: TrashedItem): string => {
    switch (item.itemType) {
      case "User":
        const userItem = item as User & { itemType: string };
        return `Role: ${userItem.role} | Messages: ${userItem.messageCount}`;
      case "Conversation":
        const convItem = item as Conversation & { itemType: string };
        return `${convItem.type} | ${convItem.participants.length} participants`;
      case "Template":
        const templateItem = item as MessageTemplate & { itemType: string };
        return `Category: ${templateItem.category}`;
      case "Role":
        const roleItem = item as Role & { itemType: string };
        return `${roleItem.permissions.length} permissions`;
      default:
        return "";
    }
  };

  const getItemIcon = (item: TrashedItem) => {
    switch (item.itemType) {
      case "User":
        return (
          <Avatar className="w-8 h-8">
            <AvatarImage src={("avatar" in item && item.avatar) || undefined} />
            <AvatarFallback>
              {("username" in item && item.username?.slice(0, 2).toUpperCase()) || "U"}
            </AvatarFallback>
          </Avatar>
        );
      case "Conversation":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">
              {("type" in item && item.type === "group") ? "G" : "P"}
            </span>
          </div>
        );
      case "Template":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-semibold text-xs">T</span>
          </div>
        );
      case "Role":
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-xs">R</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center space-x-2">
              <Trash2 className="w-6 h-6" />
              <span>Trash</span>
            </CardTitle>
            <CardDescription>
              Manage deleted items - restore or permanently delete
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            {allTrashedItems.length} items
          </Badge>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-800">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleBulkRestore}
                className="bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restore Selected
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <X className="w-4 h-4 mr-1" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span>Permanently Delete Selected Items</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete {selectedItems.length} selected item{selectedItems.length !== 1 ? 's' : ''}?
                      This action cannot be undone and the items will be completely removed from the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkPermanentDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Permanently Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        <div className="mt-4">
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search trashed items..."
              className="pl-10 bg-input border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Item Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="conversations">Conversations</SelectItem>
                <SelectItem value="templates">Templates</SelectItem>
                <SelectItem value="messages">Messages</SelectItem>
                <SelectItem value="roles">Roles</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setSortBy("deletedAt");
                setSortOrder("desc");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Deleted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {allTrashedItems.length === 0 ? "Trash is empty" : "No items match your search criteria"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item) => (
                <TableRow key={`${item.itemType}-${item.id}`} className="hover:bg-muted/50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(`${item.itemType}-${item.id}`)}
                      onChange={(e) => handleSelectItem(`${item.itemType}-${item.id}`, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getItemIcon(item)}
                      <div>
                        <p className="font-medium text-foreground">{getItemName(item)}</p>
                        <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.itemType}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{getItemDetails(item)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(item)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <X className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center space-x-2">
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              <span>Permanently Delete Item</span>
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete this {item.itemType.toLowerCase()}?
                              This action cannot be undone and the item will be completely removed from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(item)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Permanently Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filteredAndSortedItems.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Items in trash are automatically deleted after 30 days</p>
                <p className="text-xs text-yellow-700">Restore items you want to keep or permanently delete them now</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};