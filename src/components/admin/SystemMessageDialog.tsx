import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Send, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string, priority?: string) => void;
  mode?: "system" | "broadcast" | "targeted";
  selectedUsers?: string[];
  totalUsers?: number;
  initialContent?: string;
  initialPriority?: string;
}

export const SystemMessageDialog = ({
  isOpen,
  onClose,
  onSendMessage,
  mode = "system",
  selectedUsers = [],
  totalUsers = 0,
  initialContent = "",
  initialPriority = "normal",
}: SystemMessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Set initial content and priority when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setMessage(initialContent);
      setPriority(initialPriority);
    }
  }, [isOpen, initialContent, initialPriority]);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(message, priority);
      toast({
        title: "Success",
        description: "Message sent successfully.",
      });
      setMessage("");
      setPriority("normal");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getDialogTitle = () => {
    switch (mode) {
      case "broadcast":
        return "Broadcast Message to All Users";
      case "targeted":
        return "Send Targeted Message";
      default:
        return "Send System Message";
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case "broadcast":
        return `Send a message to all ${totalUsers} users in the system.`;
      case "targeted":
        return `Send a message to ${selectedUsers.length} selected user${selectedUsers.length !== 1 ? 's' : ''}.`;
      default:
        return "Send an important system-wide announcement or notification.";
    }
  };

  const getRecipientInfo = () => {
    switch (mode) {
      case "broadcast":
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Broadcasting to all {totalUsers} users
            </span>
          </div>
        );
      case "targeted":
        return (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <User className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Sending to {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              System-wide announcement
            </span>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {getRecipientInfo()}

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={priority === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("low")}
              >
                Low
              </Button>
              <Button
                type="button"
                variant={priority === "normal" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("normal")}
              >
                Normal
              </Button>
              <Button
                type="button"
                variant={priority === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("high")}
              >
                High
              </Button>
              <Button
                type="button"
                variant={priority === "urgent" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setPriority("urgent")}
              >
                Urgent
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {message.length} characters
            </div>
          </div>

          {priority === "urgent" && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Urgent messages will be displayed prominently to all recipients.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};