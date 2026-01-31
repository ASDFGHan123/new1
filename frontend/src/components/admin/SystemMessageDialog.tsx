import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        title: t('common.error'),
        description: t('system.failedToSend'),
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(message, priority);
      toast({
        title: t('common.success'),
        description: t('system.messageSent'),
      });
      setMessage("");
      setPriority("normal");
      onClose();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('system.failedToSend'),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getDialogTitle = () => {
    switch (mode) {
      case "broadcast":
        return t('system.sendSystemMessage');
      case "targeted":
        return t('system.sendSystemMessage');
      default:
        return t('system.sendSystemMessage');
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case "broadcast":
        return t('system.selectRecipients');
      case "targeted":
        return t('system.selectRecipients');
      default:
        return t('system.selectRecipients');
    }
  };

  const getRecipientInfo = () => {
    switch (mode) {
      case "broadcast":
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {t('system.broadcastingToAll', { count: totalUsers })}
            </span>
          </div>
        );
      case "targeted":
        return (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <User className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {t('system.sendingToSelected', { count: selectedUsers.length })}
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              {t('system.systemWideAnnouncement')}
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
            <Label htmlFor="priority">{t('messages.priority')}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={priority === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("low")}
              >
                {t('messages.low')}
              </Button>
              <Button
                type="button"
                variant={priority === "normal" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("normal")}
              >
                {t('messages.normal')}
              </Button>
              <Button
                type="button"
                variant={priority === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriority("high")}
              >
                {t('messages.high')}
              </Button>
              <Button
                type="button"
                variant={priority === "urgent" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setPriority("urgent")}
              >
                {t('messages.urgent')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('system.messageContent')}</Label>
            <Textarea
              id="message"
              placeholder={t('system.enterMessage')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {message.length} {t('common.characters')}
            </div>
          </div>

          {priority === "urgent" && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                  {t('system.urgentMessageWarning')}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message.trim()}>
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('messages.sendMessage')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};