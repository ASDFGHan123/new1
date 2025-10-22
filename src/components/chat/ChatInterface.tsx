import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Settings, LogOut, Users, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  username: string;
  avatar?: string;
  status: "online" | "away" | "offline";
}

interface ChatInterfaceProps {
  user: User;
  onLogout: () => void;
  onUpdateUser?: (updates: Partial<User>) => void;
}

export const ChatInterface = ({ user, onLogout, onUpdateUser }: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState(user.avatar);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sync avatar with user prop
  useEffect(() => {
    setAvatar(user.avatar);
  }, [user.avatar]);

  // Update global user when avatar changes
  useEffect(() => {
    if (avatar !== user.avatar && onUpdateUser) {
      onUpdateUser({ avatar });
    }
  }, [avatar, user.avatar, onUpdateUser]);
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Welcome to OffChat! 🎉",
      sender: "system",
      timestamp: new Date(),
    },
    {
      id: "2",
      content: "Connect with friends and start chatting!",
      sender: "system",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      content: message,
      sender: user.id,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage("");
  };

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "bg-status-online";
      case "away":
        return "bg-status-away";
      case "offline":
        return "bg-status-offline";
      default:
        return "bg-status-offline";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">General Chat</h2>
                <p className="text-sm text-muted-foreground">
                  Community discussion space
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                    user.status
                  )} rounded-full border-2 border-card`}
                />
              </div>
              <div className="flex gap-1">
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Profile Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Profile Image</Label>
                        <ImageUpload value={avatar} onChange={setAvatar} />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === user.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  msg.sender === user.id
                    ? "bg-chat-bubble text-chat-bubble-foreground"
                    : msg.sender === "system"
                    ? "bg-muted text-muted-foreground"
                    : "bg-chat-bubble-other text-chat-bubble-other-foreground"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 transition-all duration-300 focus:shadow-glow"
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};