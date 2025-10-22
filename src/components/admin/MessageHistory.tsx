import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Filter, Eye, Trash2, Clock, Users, User, AlertTriangle, Plus, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface SentMessage {
  id: string;
  type: "system" | "broadcast" | "targeted";
  content: string;
  recipients: string[]; // user IDs or "all" for broadcast
  recipientCount: number;
  sentBy: string;
  sentAt: string;
  status: "sent" | "delivered" | "failed";
  priority: "low" | "normal" | "high" | "urgent";
}

interface MessageHistoryProps {
  messages?: SentMessage[];
  onMessageSent?: (content: string, type: "system" | "broadcast" | "targeted", priority: string, recipients: string[], recipientCount: number) => void;
  onTrashMessage?: (message: SentMessage) => void;
}

const mockMessages: SentMessage[] = [
  {
    id: "1",
    type: "broadcast",
    content: "Scheduled maintenance will begin at 2 AM UTC. The system will be unavailable for 30 minutes.",
    recipients: ["all"],
    recipientCount: 1250,
    sentBy: "admin",
    sentAt: "2024-10-04T10:30:00Z",
    status: "sent",
    priority: "high",
  },
  {
    id: "2",
    type: "system",
    content: "Welcome to OffChat! Please review our community guidelines.",
    recipients: ["new-users"],
    recipientCount: 45,
    sentBy: "admin",
    sentAt: "2024-10-04T09:15:00Z",
    status: "delivered",
    priority: "normal",
  },
  {
    id: "3",
    type: "targeted",
    content: "Your account has been flagged for suspicious activity. Please verify your identity.",
    recipients: ["user123", "user456", "user789"],
    recipientCount: 3,
    sentBy: "moderator",
    sentAt: "2024-10-04T08:45:00Z",
    status: "sent",
    priority: "urgent",
  },
  {
    id: "4",
    type: "broadcast",
    content: "New feature: Dark mode is now available! Check your settings to enable it.",
    recipients: ["all"],
    recipientCount: 1250,
    sentBy: "admin",
    sentAt: "2024-10-03T16:20:00Z",
    status: "delivered",
    priority: "low",
  },
];

export const MessageHistory = ({ messages: initialMessages = mockMessages, onMessageSent, onTrashMessage }: MessageHistoryProps) => {
  const [messages, setMessages] = useState<SentMessage[]>(initialMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<SentMessage | null>(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('offchat-message-history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } catch (error) {
        console.error('Failed to parse stored message history:', error);
      }
    }
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('offchat-message-history', JSON.stringify(messages));
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = searchQuery === "" || (
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sentBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.recipientCount.toString().includes(searchQuery) ||
        format(new Date(message.sentAt), "PPP").toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesType = typeFilter === "all" || message.type === typeFilter;
      const matchesStatus = statusFilter === "all" || message.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || message.priority === priorityFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [messages, searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Calculate statistics
  const messageStats = useMemo(() => {
    const total = messages.length;
    const byType = messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = messages.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = messages.reduce((acc, msg) => {
      acc[msg.priority] = (acc[msg.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRecipients = messages.reduce((sum, msg) => sum + msg.recipientCount, 0);

    return { total, byType, byStatus, byPriority, totalRecipients };
  }, [messages]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "broadcast":
        return <Users className="w-4 h-4" />;
      case "system":
        return <AlertTriangle className="w-4 h-4" />;
      case "targeted":
        return <User className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "broadcast":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "system":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "targeted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  // Function to add a new sent message to history
  const addSentMessage = (content: string, type: "system" | "broadcast" | "targeted", priority: string, recipients: string[] = [], recipientCount: number = 0) => {
    const newMessage: SentMessage = {
      id: Date.now().toString(),
      type,
      content,
      recipients,
      recipientCount: type === "broadcast" ? recipientCount : recipients.length,
      sentBy: "admin", // In a real app, this would come from auth context
      sentAt: new Date().toISOString(),
      status: "sent",
      priority: priority as "low" | "normal" | "high" | "urgent",
    };

    setMessages(prev => [newMessage, ...prev]);

    // Call the callback if provided (for external integration)
    if (onMessageSent) {
      onMessageSent(content, type, priority, recipients, recipientCount);
    }
  };

  // Function to view message details
  const handleViewMessage = (message: SentMessage) => {
    setSelectedMessage(message);
    setShowMessageDetail(true);
  };

  // Function to delete message from history (move to trash)
   const handleDeleteMessage = async (messageId: string) => {
     const messageToTrash = messages.find(msg => msg.id === messageId);
     if (messageToTrash) {
       if (onTrashMessage) {
         onTrashMessage(messageToTrash);
       }
       // Always remove from local state
       setMessages(prev => prev.filter(msg => msg.id !== messageId));
       toast({
         title: "Message Moved to Trash",
         description: "Message has been moved to trash and can be restored.",
       });
     }
   };

  // Function to add a test message for demo purposes
  const addTestMessage = () => {
    const testMessages = [
      "System maintenance completed successfully. All services are now operational.",
      "Welcome to our updated platform! Check out the new features in your dashboard.",
      "Security update: Two-factor authentication is now available for all accounts.",
      "Important: Please update your password for enhanced security.",
    ];

    const randomContent = testMessages[Math.floor(Math.random() * testMessages.length)];
    const types: ("system" | "broadcast" | "targeted")[] = ["system", "broadcast", "targeted"];
    const priorities: ("low" | "normal" | "high" | "urgent")[] = ["low", "normal", "high", "urgent"];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];

    addSentMessage(randomContent, randomType, randomPriority, ["all"], 1250);
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Message History</CardTitle>
            <CardDescription>View and manage sent system messages</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addTestMessage}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Test Message
            </Button>
            <Badge variant="secondary" className="text-xs">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Message Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{messageStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{messageStats.byType.broadcast || 0}</div>
              <div className="text-sm text-muted-foreground">Broadcast</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{messageStats.byStatus.delivered || 0}</div>
              <div className="text-sm text-muted-foreground">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{messageStats.totalRecipients}</div>
              <div className="text-sm text-muted-foreground">Total Recipients</div>
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by content, sender, type, status, priority, date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="broadcast">Broadcast</SelectItem>
                <SelectItem value="targeted">Targeted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages Table */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(message.type)}
                        <Badge className={`text-xs ${getTypeColor(message.type)}`}>
                          {message.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate" title={message.content}>
                          {truncateContent(message.content)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {message.type === "broadcast" ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {message.recipientCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                        {message.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(message.sentAt), "MMM dd, HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewMessage(message)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Move to Trash</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to move this message to trash? It can be restored later from the Trash tab.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMessage(message.id)}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                Move to Trash
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No messages found matching your filters.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>

      {/* Message Detail Modal */}
      <Dialog open={showMessageDetail} onOpenChange={setShowMessageDetail}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && getTypeIcon(selectedMessage.type)}
              Message Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the sent message
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedMessage.type)}
                    <Badge className={`text-xs ${getTypeColor(selectedMessage.type)}`}>
                      {selectedMessage.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    <Badge className={`text-xs ${getPriorityColor(selectedMessage.priority)}`}>
                      {selectedMessage.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={`text-xs ${getStatusColor(selectedMessage.status)}`}>
                      {selectedMessage.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sent By</Label>
                  <p className="text-sm mt-1">{selectedMessage.sentBy}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Recipients</Label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedMessage.type === "broadcast" ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {selectedMessage.recipientCount} recipient{selectedMessage.recipientCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Sent At</Label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {format(new Date(selectedMessage.sentAt), "PPP 'at' pp")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Message Content</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              {selectedMessage.recipients.length > 0 && selectedMessage.recipients[0] !== "all" && (
                <div>
                  <Label className="text-sm font-medium">Recipient List</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedMessage.recipients.slice(0, 10).map((recipient, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {recipient}
                      </Badge>
                    ))}
                    {selectedMessage.recipients.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedMessage.recipients.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDetail(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};