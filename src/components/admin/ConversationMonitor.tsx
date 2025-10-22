import { Search, Filter, Users, Clock, MessageCircle, ChevronUp, ChevronDown, Eye, MoreHorizontal, Download, Archive, Trash2, VolumeX, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useState, useEffect } from "react";

const initialConversations = [
  {
    id: 1,
    type: "private",
    title: "John Doe & Alice Smith",
    participants: 2,
    lastMessage: "Hey, are you available for the meeting?",
    lastActivity: "2 minutes ago",
    messageCount: 142,
    isActive: true,
  },
  {
    id: 2,
    type: "group",
    title: "Development Team",
    participants: 8,
    lastMessage: "The new feature is ready for testing",
    lastActivity: "5 minutes ago",
    messageCount: 1834,
    isActive: true,
  },
  {
    id: 3,
    type: "group",
    title: "Marketing Team",
    participants: 5,
    lastMessage: "Campaign results look promising",
    lastActivity: "1 hour ago",
    messageCount: 567,
    isActive: false,
  },
  {
    id: 4,
    type: "private",
    title: "Bob Wilson & Carol Davis",
    participants: 2,
    lastMessage: "Thanks for the update",
    lastActivity: "3 hours ago",
    messageCount: 89,
    isActive: false,
  },
  {
    id: 5,
    type: "group",
    title: "Project Alpha",
    participants: 12,
    lastMessage: "Sprint planning meeting scheduled for tomorrow",
    lastActivity: "15 minutes ago",
    messageCount: 2456,
    isActive: true,
  },
  {
    id: 6,
    type: "private",
    title: "Sarah Johnson & Mike Chen",
    participants: 2,
    lastMessage: "Can you review the design mockups?",
    lastActivity: "30 minutes ago",
    messageCount: 78,
    isActive: true,
  },
  {
    id: 7,
    type: "group",
    title: "Customer Support",
    participants: 6,
    lastMessage: "New ticket system is now live",
    lastActivity: "2 hours ago",
    messageCount: 1234,
    isActive: true,
  },
  {
    id: 8,
    type: "private",
    title: "David Brown & Emma Wilson",
    participants: 2,
    lastMessage: "The report has been submitted",
    lastActivity: "4 hours ago",
    messageCount: 234,
    isActive: false,
  },
  {
    id: 9,
    type: "group",
    title: "Design Team",
    participants: 4,
    lastMessage: "Wireframes are ready for feedback",
    lastActivity: "6 hours ago",
    messageCount: 892,
    isActive: false,
  },
  {
    id: 10,
    type: "private",
    title: "Lisa Garcia & Tom Anderson",
    participants: 2,
    lastMessage: "Meeting rescheduled to 3 PM",
    lastActivity: "8 hours ago",
    messageCount: 156,
    isActive: false,
  },
  {
    id: 11,
    type: "group",
    title: "Executive Board",
    participants: 7,
    lastMessage: "Q4 results discussion",
    lastActivity: "1 day ago",
    messageCount: 345,
    isActive: false,
  },
  {
    id: 12,
    type: "private",
    title: "Anna Martinez & Chris Lee",
    participants: 2,
    lastMessage: "Project deadline extended",
    lastActivity: "1 day ago",
    messageCount: 67,
    isActive: false,
  },
  {
    id: 13,
    type: "group",
    title: "QA Team",
    participants: 5,
    lastMessage: "Bug fixes deployed successfully",
    lastActivity: "2 days ago",
    messageCount: 1789,
    isActive: false,
  },
  {
    id: 14,
    type: "private",
    title: "Rachel Green & Ross Geller",
    participants: 2,
    lastMessage: "We were on a break!",
    lastActivity: "3 days ago",
    messageCount: 445,
    isActive: false,
  },
  {
    id: 15,
    type: "group",
    title: "Remote Workers",
    participants: 9,
    lastMessage: "Office reopening discussion",
    lastActivity: "4 days ago",
    messageCount: 567,
    isActive: false,
  },
];

interface ConversationMonitorProps {
  onTrashConversation?: (conversationId: string) => void;
}

export const ConversationMonitor = ({ onTrashConversation }: ConversationMonitorProps) => {
  const [conversations, setConversations] = useState(initialConversations);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "private" | "group">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"title" | "participants" | "messages" | "lastActivity">("lastActivity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<typeof initialConversations[0] | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [conversationToModerate, setConversationToModerate] = useState<typeof initialConversations[0] | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const interval = setInterval(() => {
      setConversations(prev =>
        prev.map(conv => {
          let messageIncrease = 0;
          let newActive = conv.isActive;
          let newLastActivity = conv.lastActivity;

          if (conv.isActive) {
            // Active conversations get more frequent updates
            messageIncrease = Math.floor(Math.random() * 3) + 1; // 1-3 messages
            newLastActivity = "Just now";
          } else {
            // Inactive conversations occasionally become active
            if (Math.random() < 0.05) { // 5% chance to reactivate
              newActive = true;
              messageIncrease = Math.floor(Math.random() * 2) + 1; // 1-2 messages
              newLastActivity = "Just now";
            }
          }

          // Occasionally deactivate active conversations
          if (conv.isActive && Math.random() < 0.02) { // 2% chance to deactivate
            newActive = false;
            newLastActivity = Math.random() < 0.5 ? "A few minutes ago" : conv.lastActivity;
          }

          return {
            ...conv,
            messageCount: conv.messageCount + messageIncrease,
            isActive: newActive,
            lastActivity: newLastActivity,
          };
        })
      );
    }, 3000); // Update every 3 seconds for more dynamic feel

    return () => clearInterval(interval);
  }, []);

  // Filter and sort conversations
  const filteredAndSortedConversations = conversations
    .filter(conv => {
      const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || conv.type === typeFilter;
      const matchesStatus = statusFilter === "all" ||
                           (statusFilter === "active" && conv.isActive) ||
                           (statusFilter === "inactive" && !conv.isActive);
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "participants":
          aValue = a.participants;
          bValue = b.participants;
          break;
        case "messages":
          aValue = a.messageCount;
          bValue = b.messageCount;
          break;
        case "lastActivity":
          // Simple string comparison for demo - in real app would parse timestamps
          aValue = a.lastActivity;
          bValue = b.lastActivity;
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

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedConversations.length / itemsPerPage);
  const paginatedConversations = filteredAndSortedConversations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleViewDetails = (conversation: typeof initialConversations[0]) => {
    setSelectedConversation(conversation);
    setShowDetailsModal(true);
  };

  const handleModerate = (conversation: typeof initialConversations[0]) => {
    setConversationToModerate(conversation);
    setShowModerationModal(true);
  };

  const handleModerationAction = (action: "delete" | "archive" | "mute") => {
    if (!conversationToModerate) return;

    // Simulate moderation action
    console.log(`Performing ${action} on conversation:`, conversationToModerate.id);

    // Update conversation state based on action
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === conversationToModerate.id) {
          switch (action) {
            case "delete":
              // For delete action, move to trash instead of removing completely
              if (onTrashConversation) {
                onTrashConversation(conversationToModerate.id.toString());
              }
              // Remove from local state (will be handled by parent component)
              return null;
            case "archive":
              return { ...conv, isActive: false, lastActivity: "Archived" };
            case "mute":
              return { ...conv, isActive: false, lastActivity: "Muted" };
            default:
              return conv;
          }
        }
        return conv;
      }).filter(Boolean) as typeof initialConversations
    );

    setShowModerationModal(false);
    setConversationToModerate(null);
  };

  const handleExport = (conversation: typeof initialConversations[0]) => {
    // In a real implementation, this would trigger a data export
    console.log('Export conversation data:', conversation.id);
    const dataStr = JSON.stringify(conversation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `conversation-${conversation.id}-data.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Conversation Monitor</CardTitle>
            <CardDescription>
              Monitor active conversations and message flow
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-admin-success/20 text-admin-success border-admin-success/30">
              {conversations.filter(c => c.isActive).length} Active
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dataStr = JSON.stringify(filteredAndSortedConversations, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `conversations-export-${new Date().toISOString().split('T')[0]}.json`;
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-input border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => {
              setSearchTerm("");
              setTypeFilter("all");
              setStatusFilter("all");
              setSortBy("lastActivity");
              setSortOrder("desc");
              setCurrentPage(1);
            }}>
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center space-x-1">
                  <span>Conversation</span>
                  {sortBy === "title" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("participants")}
              >
                <div className="flex items-center space-x-1">
                  <span>Participants</span>
                  {sortBy === "participants" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("messages")}
              >
                <div className="flex items-center space-x-1">
                  <span>Messages</span>
                  {sortBy === "messages" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 select-none"
                onClick={() => handleSort("lastActivity")}
              >
                <div className="flex items-center space-x-1">
                  <span>Last Activity</span>
                  {sortBy === "lastActivity" && (
                    sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedConversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No conversations found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedConversations.map((conversation) => (
                <TableRow key={conversation.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        {conversation.type === 'group' ? (
                          <div className="w-8 h-8 bg-admin-secondary/20 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-admin-secondary" />
                          </div>
                        ) : (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.id}`} />
                            <AvatarFallback>
                              {conversation.title.split(' ').slice(0, 2).map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{conversation.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={conversation.type === 'group' ? 'default' : 'secondary'}>
                      {conversation.type === 'group' ? 'Group' : 'Private'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{conversation.participants}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <span>{conversation.messageCount.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{conversation.lastActivity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${conversation.isActive ? 'bg-admin-success animate-pulse' : 'bg-muted-foreground'}`} />
                      <span className="text-sm">
                        {conversation.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(conversation)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleModerate(conversation)}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Moderate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(conversation)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export Data
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedConversations.length)} of {filteredAndSortedConversations.length} conversations
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Conversation Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {selectedConversation?.type === 'group' ? (
                <div className="w-10 h-10 bg-admin-secondary/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-admin-secondary" />
                </div>
              ) : (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation?.id}`} />
                  <AvatarFallback>
                    {selectedConversation?.title.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <span>{selectedConversation?.title}</span>
                <Badge variant={selectedConversation?.type === 'group' ? 'default' : 'secondary'} className="ml-2">
                  {selectedConversation?.type}
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this conversation
            </DialogDescription>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-6">
              {/* Status and Activity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedConversation.isActive ? 'bg-admin-success animate-pulse' : 'bg-muted-foreground'}`} />
                    <span className="text-sm">{selectedConversation.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Activity</Label>
                  <p className="text-sm text-muted-foreground">{selectedConversation.lastActivity}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{selectedConversation.participants}</p>
                        <p className="text-xs text-muted-foreground">Participants</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{selectedConversation.messageCount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Messages</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">
                          {Math.floor(selectedConversation.messageCount / Math.max(selectedConversation.participants, 1))}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg per user</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Last Message */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Message</Label>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm">{selectedConversation.lastMessage}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleModerate(selectedConversation)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Moderate Conversation
                </Button>
                <Button variant="outline" onClick={() => handleExport(selectedConversation)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation Dialog */}
      <Dialog open={showModerationModal} onOpenChange={setShowModerationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Moderate Conversation</DialogTitle>
            <DialogDescription>
              Choose an action for conversation: {conversationToModerate?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                onClick={() => handleModerationAction("archive")}
                className="justify-start h-auto p-4"
              >
                <Archive className="w-5 h-5 mr-3 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Archive Conversation</div>
                  <div className="text-sm text-muted-foreground">Move to archive, participants can still view</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleModerationAction("mute")}
                className="justify-start h-auto p-4"
              >
                <VolumeX className="w-5 h-5 mr-3 text-orange-500" />
                <div className="text-left">
                  <div className="font-medium">Mute Conversation</div>
                  <div className="text-sm text-muted-foreground">Temporarily disable new messages</div>
                </div>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="justify-start h-auto p-4"
                  >
                    <Trash2 className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Move to Trash</div>
                      <div className="text-sm text-muted-foreground">Move conversation to trash</div>
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span>Move to Trash</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to move this conversation to trash? It can be restored later from the Trash tab.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleModerationAction("delete")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Move to Trash
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModerationModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};