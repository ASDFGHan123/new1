import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Flag, Trash2, Eye, EyeOff, AlertTriangle, Shield, MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlaggedMessage {
  id: string;
  content: string;
  sender: string;
  senderId: string;
  conversationId: string;
  flaggedAt: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: "pending" | "reviewed" | "resolved";
}

export const MessageModeration = () => {
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFlaggedMessages();
    const interval = setInterval(loadFlaggedMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFlaggedMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/admin/flagged-messages/', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        console.error('Failed to fetch flagged messages:', response.status);
        setFlaggedMessages([]);
      } else {
        const data = await response.json();
        setFlaggedMessages(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Failed to load flagged messages:', error);
      setFlaggedMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateMessage = async (messageId: string, action: "approve" | "delete" | "warn") => {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = action === 'approve' 
        ? `http://localhost:8000/api/admin/flagged-messages/${messageId}/approve/`
        : action === 'delete'
        ? `http://localhost:8000/api/admin/flagged-messages/${messageId}/delete/`
        : `http://localhost:8000/api/admin/flagged-messages/${messageId}/warn/`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Message ${action === "approve" ? "approved" : action === "delete" ? "deleted" : "warning sent"}.`,
        });
        loadFlaggedMessages();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} message`,
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "dark:bg-yellow-950/30 bg-yellow-50";
      case "medium":
        return "dark:bg-orange-950/30 bg-orange-50";
      case "high":
        return "dark:bg-red-950/30 bg-red-50";
      default:
        return "dark:bg-gray-950/30 bg-gray-50";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "outline";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "reviewed":
        return "secondary";
      case "resolved":
        return "default";
      default:
        return "outline";
    }
  };

  const pendingMessages = flaggedMessages.filter(msg => msg.status === "pending");

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{pendingMessages.length}</div>
            <p className="text-sm text-muted-foreground">Messages awaiting moderation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Total Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{flaggedMessages.length}</div>
            <p className="text-sm text-muted-foreground">Messages flagged</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {flaggedMessages.filter(msg => msg.status === "resolved").length}
            </div>
            <p className="text-sm text-muted-foreground">Issues resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div>
            <CardTitle>Flagged Messages</CardTitle>
            <CardDescription>Messages that require moderation attention</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pr-4">
              {flaggedMessages.map((message) => (
                <div key={message.id} className={`border rounded-lg p-4 space-y-3 ${getSeverityColor(message.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityBadgeColor(message.severity)} className="text-xs">
                          {message.severity} severity
                        </Badge>
                        <Badge variant={getStatusColor(message.status)} className="text-xs">
                          {message.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {message.sender}
                        </span>
                      </div>
                      <p className="text-sm bg-muted p-2 rounded border-l-4 border-red-500">
                        {message.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {message.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.flaggedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {message.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerateMessage(message.id, "approve")}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-orange-600">
                            <EyeOff className="w-4 h-4 mr-1" />
                            Warn Sender
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Send Warning</AlertDialogTitle>
                            <AlertDialogDescription>
                              Send a warning to {message.sender} about their message content?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleModerateMessage(message.id, "warn")}
                            >
                              Send Warning
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Message
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this message? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleModerateMessage(message.id, "delete")}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {message.status !== "pending" && (
                    <div className="text-sm text-muted-foreground">
                      Reviewed on {new Date(message.flaggedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}

              {flaggedMessages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No flagged messages at this time.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
