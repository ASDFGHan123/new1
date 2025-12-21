import { Search, Filter, Users, Clock, MessageCircle, ChevronUp, ChevronDown, Eye, MoreHorizontal, Download, Archive, Trash2, VolumeX, AlertTriangle, Printer, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { openPrintWindow, generateConversationReportHTML } from "@/lib/printUtils";
import { ParticipantRow } from "./ParticipantRow";

interface Message {
  id: string;
  content: string;
  sender: string;
  senderId: string;
  timestamp: string;
  type: "text" | "image" | "file";
}

interface ConversationMonitorProps {
  onTrashConversation?: (conversationId: string) => void;
}

export const ConversationMonitor = ({ onTrashConversation }: ConversationMonitorProps) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "private" | "group">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"title" | "participants" | "messages" | "lastActivity">("lastActivity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [conversationToModerate, setConversationToModerate] = useState<any | null>(null);
  const [showMessageHistory, setShowMessageHistory] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('http://localhost:8000/api/chat/conversations/?is_deleted=false', { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (data.results && Array.isArray(data.results)) {
        results = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        results = data.data;
      }
      
      const formattedData = results.map((conv: any, idx: number) => {
        const lastMsg = conv.last_message;
        const lastMessageText = typeof lastMsg === 'string' ? lastMsg : (lastMsg?.content || 'No messages');
        
        let title = conv.title;
        if (!title) {
          if (Array.isArray(conv.participants) && conv.participants.length > 0) {
            const participantNames = conv.participants
              .map((p: any) => typeof p === 'string' ? p : (p.username || p.name || p.id))
              .join(', ');
            title = participantNames;
          } else if (conv.participant_names) {
            title = conv.participant_names.join(', ');
          } else {
            title = `Conversation ${idx + 1}`;
          }
        }
        
        const actTime = conv.last_message_at || conv.updated_at || conv.created_at;
        return {
          id: conv.id || idx + 1,
          type: conv.conversation_type === 'group' ? 'group' : 'private',
          title,
          participants: conv.participant_count || (Array.isArray(conv.participants) ? conv.participants.length : 2),
          participantsList: Array.isArray(conv.participants) ? conv.participants : [],
          lastMessage: lastMessageText,
          lastActivity: actTime ? new Date(actTime).toLocaleString() : 'N/A',
          messageCount: conv.message_count || 0,
          isActive: true,
          messages: conv.messages || []
        };
      });
      
      setConversations(formattedData);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

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
    setCurrentPage(1);
  };

  const handleViewDetails = (conversation: any) => {
    setSelectedConversation(conversation);
    setShowDetailsModal(true);
  };

  const handleViewMessageHistory = async (conversation: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:8000/api/chat/conversations/${conversation.id}/messages/`, { headers });
      if (res.ok) {
        const data = await res.json();
        const msgList = Array.isArray(data) ? data : (data.results || []);
        const messages = msgList.map((msg: any) => ({
          id: msg.id || '',
          content: msg.content || '',
          sender: msg.sender || 'Unknown',
          senderId: msg.sender_id || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'N/A',
          type: msg.message_type || 'text'
        }));
        setConversationMessages(messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
    setSelectedConversation(conversation);
    setShowMessageHistory(true);
  };

  const handleViewParticipants = async (conversation: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:8000/api/chat/conversations/${conversation.id}/`, { headers });
      if (res.ok) {
        const data = await res.json();
        const participants = Array.isArray(data.participants) ? data.participants : (conversation.participantsList || []);
        setSelectedParticipants(participants);
      } else {
        setSelectedParticipants(conversation.participantsList || []);
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setSelectedParticipants(conversation.participantsList || []);
    }
    setShowParticipantsModal(true);
  };

  const handleModerate = (conversation: any) => {
    setConversationToModerate(conversation);
    setShowModerationModal(true);
  };

  const handleModerationAction = async (action: "delete" | "archive" | "mute" | "warn" | "logout" | "print") => {
    if (!conversationToModerate) return;

    console.log(`Performing ${action} on conversation:`, conversationToModerate.id);

    if (action === "delete") {
      try {
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`http://localhost:8000/api/chat/conversations/${conversationToModerate.id}/`, {
          method: 'DELETE',
          headers
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        setConversations(prev => prev.filter(conv => conv.id !== conversationToModerate.id));
        if (onTrashConversation) {
          onTrashConversation(conversationToModerate.id.toString());
        }
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Failed to delete conversation');
      }
    } else {
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === conversationToModerate.id) {
            switch (action) {
              case "archive":
                return { ...conv, isActive: false, lastActivity: "Archived" };
              case "mute":
                return { ...conv, isActive: false, lastActivity: "Muted" };
              case "warn":
                setTimeout(() => {
                  alert(`Warning message sent successfully to all members of "${conversationToModerate.title}"`);
                }, 100);
                return { ...conv, lastActivity: "Warning Sent" };
              case "logout":
                setTimeout(() => {
                  alert(`All members of "${conversationToModerate.title}" have been logged out successfully`);
                }, 100);
                return { ...conv, isActive: false, lastActivity: "Members Logged Out" };
              default:
                return conv;
            }
          }
          return conv;
        })
      );
    }

    setShowModerationModal(false);
    setConversationToModerate(null);
  };

  const handleExport = (conversation: any) => {
    console.log('Export conversation data:', conversation.id);
    const dataStr = JSON.stringify(conversation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `conversation-${conversation.id}-data.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handlePrintConversations = () => {
    const printData = generateConversationReportHTML(filteredAndSortedConversations);
    openPrintWindow({
      ...printData,
      subtitle: `Filtered Results: ${filteredAndSortedConversations.length} of ${conversations.length} conversations`
    });
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
              onClick={handlePrintConversations}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Conversations
            </Button>
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
        <div className="max-h-[600px] overflow-y-auto scroll-smooth">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("title")}>
                  <div className="flex items-center space-x-1">
                    <span>Conversation</span>
                    {sortBy === "title" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("participants")}>
                  <div className="flex items-center space-x-1">
                    <span>Participants</span>
                    {sortBy === "participants" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("messages")}>
                  <div className="flex items-center space-x-1">
                    <span>Messages</span>
                    {sortBy === "messages" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort("lastActivity")}>
                  <div className="flex items-center space-x-1">
                    <span>Last Activity</span>
                    {sortBy === "lastActivity" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
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
                                {conversation.title.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
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
                      <button onClick={() => handleViewParticipants(conversation)} className="flex items-center space-x-1 hover:text-blue-600 cursor-pointer">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{conversation.participants}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => window.location.href = `/chat?conversation=${conversation.id}`} className="flex items-center space-x-1 hover:text-blue-600 cursor-pointer">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{conversation.messageCount.toLocaleString()}</span>
                      </button>
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
                          <DropdownMenuItem onClick={() => handleViewMessageHistory(conversation)}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            View Message History
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
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedConversations.length)} of {filteredAndSortedConversations.length} conversations
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className="w-8 h-8 p-0">
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
        <style>{`
          div::-webkit-scrollbar { width: 8px; }
          div::-webkit-scrollbar-track { background: #f1f5f9; }
          div::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          div::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </CardContent>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversation Details</DialogTitle>
            <DialogDescription>View detailed information about this conversation</DialogDescription>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
              <p><strong>Title:</strong> {selectedConversation.title}</p>
              <p><strong>Type:</strong> {selectedConversation.type}</p>
              <p><strong>Participants:</strong> {selectedConversation.participants}</p>
              <p><strong>Messages:</strong> {selectedConversation.messageCount}</p>
              <p><strong>Status:</strong> {selectedConversation.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showModerationModal} onOpenChange={setShowModerationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Moderate Conversation</DialogTitle>
            <DialogDescription>Choose a moderation action for this conversation</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button onClick={() => handleModerationAction("archive")} className="w-full">Archive</Button>
            <Button onClick={() => handleModerationAction("mute")} className="w-full">Mute</Button>
            <Button onClick={() => handleModerationAction("warn")} className="w-full">Send Warning</Button>
            <Button onClick={() => handleModerationAction("delete")} variant="destructive" className="w-full">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMessageHistory} onOpenChange={setShowMessageHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedConversation?.title} - Message History</DialogTitle>
            <DialogDescription>View all messages in this conversation</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-4">
            {conversationMessages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No messages</p>
            ) : (
              conversationMessages.map((msg) => (
                <div key={msg.id} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-sm">{msg.sender}</p>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowMessageHistory(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showParticipantsModal} onOpenChange={setShowParticipantsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Participants</DialogTitle>
            <DialogDescription>All participants in this conversation</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedParticipants.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No participants</p>
            ) : (
              selectedParticipants.map((participant: any, idx: number) => (
                <div key={idx} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.username || participant.id}`} />
                    <AvatarFallback>
                      {(participant.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{participant.username || 'Unknown'}</p>
                    {participant.email && (
                      <p className="text-xs text-muted-foreground truncate">{participant.email}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowParticipantsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
