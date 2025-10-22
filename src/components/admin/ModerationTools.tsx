import React from "react";
import { AlertTriangle, Ban, Clock, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModerationAction {
  type: "warn" | "suspend" | "ban";
  duration?: string;
  reason: string;
}

interface ModerationToolsProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  onModerate: (userId: string, action: ModerationAction) => void;
}

export const ModerationTools = ({ userId, username, isOpen, onClose, onModerate }: ModerationToolsProps) => {
  const [actionType, setActionType] = React.useState<"warn" | "suspend" | "ban">("warn");
  const [duration, setDuration] = React.useState("1d");
  const [reason, setReason] = React.useState("");

  const handleSubmit = () => {
    if (!reason.trim()) return;
    
    const action: ModerationAction = {
      type: actionType,
      reason: reason.trim(),
      ...(actionType !== "warn" && { duration })
    };
    
    onModerate(userId, action);
    onClose();
    setReason("");
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "warn": return <MessageSquare className="w-4 h-4" />;
      case "suspend": return <Clock className="w-4 h-4" />;
      case "ban": return <Ban className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "warn": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "suspend": return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      case "ban": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Moderate User: {username}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Action Type Selection */}
          <div className="grid grid-cols-3 gap-2">
            {(["warn", "suspend", "ban"] as const).map((type) => (
              <Button
                key={type}
                variant={actionType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setActionType(type)}
                className={actionType === type ? getActionColor(type) : ""}
              >
                {getActionIcon(type)}
                <span className="ml-2 capitalize">{type}</span>
              </Button>
            ))}
          </div>

          {/* Duration Selection (for suspend/ban) */}
          {actionType !== "warn" && (
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="3d">3 Days</SelectItem>
                  <SelectItem value="7d">1 Week</SelectItem>
                  <SelectItem value="30d">1 Month</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Explain the reason for this moderation action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Preview */}
          <Card className={`border ${getActionColor(actionType)}`}>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                {getActionIcon(actionType)}
                <span className="font-medium">
                  {actionType === "warn" && "Warning will be issued"}
                  {actionType === "suspend" && `User will be suspended for ${duration}`}
                  {actionType === "ban" && `User will be banned ${duration === "permanent" ? "permanently" : `for ${duration}`}`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason.trim()}
            className={getActionColor(actionType)}
          >
            Apply {actionType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};