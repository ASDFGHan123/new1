import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Settings, LogOut, Users, MessageCircle, Paperclip, X, FileText, Image } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Label } from "@/components/ui/label";
import type { Attachment } from "@/lib/api";

interface User {
  id: string;
  username: string;
  avatar?: string;
  status: "online" | "away" | "offline";
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  attachments?: Attachment[];
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Welcome to OffChat! ",
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

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setAttachments(prev => [...prev, ...fileArray]);
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: user.id,
      timestamp: new Date(),
      attachments: attachments.map((file, index) => ({
        id: `attachment-${Date.now()}-${index}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      }))
    };

    setMessages([...messages, newMessage]);
    setMessage("");
    setAttachments([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
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
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                        {getFileIcon(attachment.name, attachment.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{attachment.name}</p>
                          <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                        </div>
                        {attachment.type.startsWith('image/') && (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Drop zone overlay */}
          {isDragging && (
            <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-card p-8 rounded-lg border-2 border-dashed border-primary">
                <div className="text-center">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-lg font-semibold">Drop files to attach</p>
                  <p className="text-sm text-muted-foreground">Support for images, documents, and more</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-border/50 bg-card/30 backdrop-blur-sm">
          {/* Selected attachments preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                  {getFileIcon(file.name, file.type)}
                  <span className="text-sm truncate max-w-32">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1 flex gap-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 transition-all duration-300 focus:shadow-glow"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="px-3"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={!message.trim() && attachments.length === 0}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};