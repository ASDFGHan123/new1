import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Settings, LogOut, Users, MessageCircle, Paperclip, X, FileText, Image, Mic, MicOff, Play, Pause, Edit, Check, MoreHorizontal, Trash2, Copy, Forward, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  edited?: boolean;
  editedAt?: Date;
  forwarded?: boolean;
  originalSender?: string;
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
  const formRef = useRef<HTMLFormElement>(null);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  
  // Message editing states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  
  // Message menu states
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Voice recording functions
  const startRecording = async () => {
    setMicPermissionError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicPermissionError('Microphone access denied. Please enable microphone permissions in your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playAudio = (url: string, messageId: string) => {
    if (isPlaying === messageId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(null);
    } else {
      // Start playing
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsPlaying(null);
      }
      
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(messageId);
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Message editing functions
  const startEditingMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditMessageContent(currentContent);
    setOpenMenuId(null); // Close menu when editing starts
  };

  const saveMessageEdit = () => {
    if (!editingMessageId || !editMessageContent.trim()) return;

    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === editingMessageId
          ? { ...msg, content: editMessageContent.trim(), edited: true, editedAt: new Date() }
          : msg
      )
    );

    setEditingMessageId(null);
    setEditMessageContent("");
  };

  const cancelMessageEdit = () => {
    setEditingMessageId(null);
    setEditMessageContent("");
  };

  // Message management functions
  const deleteMessage = (messageId: string) => {
    setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    setOpenMenuId(null);
  };

  const forwardMessage = (message: Message) => {
    const forwardedContent = `Forwarded: ${message.content}`;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: forwardedContent,
      sender: user.id,
      timestamp: new Date(),
      attachments: message.attachments ? [...message.attachments] : undefined,
      forwarded: true,
      originalSender: message.sender
    };
    
    setMessages([...messages, newMessage]);
    setOpenMenuId(null);
  };

  const copyToClipboard = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      // You could add a toast notification here
      console.log('Message copied to clipboard');
    } catch (err) {
      console.error('Failed to copy message: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setOpenMenuId(null);
  };

  const shareMessage = async (message: Message) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Message from chat',
          text: message.content,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing: ', err);
      }
    } else {
      // Fallback to copy to clipboard
      await copyToClipboard(message);
    }
    setOpenMenuId(null);
  };

  const handleSendMessage = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!message.trim() && attachments.length === 0 && !audioBlob) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: user.id,
      timestamp: new Date(),
      attachments: [
        ...attachments.map((file, index) => ({
          id: `attachment-${Date.now()}-${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString()
        })),
        ...(audioBlob ? [{
          id: `voice-${Date.now()}`,
          name: `Voice message ${formatDuration(recordingDuration)}`,
          type: 'audio/webm',
          size: audioBlob.size,
          url: audioUrl!,
          uploadedAt: new Date().toISOString(),
          duration: recordingDuration
        }] : [])
      ]
    };

    setMessages([...messages, newMessage]);
    setMessage("");
    setAttachments([]);
    cancelRecording();
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
    if (fileType.startsWith('audio/')) {
      return <Mic className="h-4 w-4" />;
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

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
              className={`group flex ${
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
                {editingMessageId === msg.id ? (
                  // Editing interface
                  <div className="space-y-2">
                    <Input
                      value={editMessageContent}
                      onChange={(e) => setEditMessageContent(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          saveMessageEdit();
                        }
                        if (e.key === 'Escape') {
                          cancelMessageEdit();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveMessageEdit}
                        disabled={!editMessageContent.trim()}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelMessageEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal message display
                  <>
                    <p className="text-sm">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                            {getFileIcon(attachment.name, attachment.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{attachment.name}</p>
                              <div className="flex items-center gap-2 text-xs opacity-70">
                                <span>{formatFileSize(attachment.size)}</span>
                                {attachment.duration && (
                                  <span>• {formatDuration(attachment.duration)}</span>
                                )}
                              </div>
                            </div>
                            
                            {attachment.type.startsWith('image/') && (
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="h-12 w-12 object-cover rounded"
                              />
                            )}
                            
                            {attachment.type.startsWith('audio/') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => playAudio(attachment.url, msg.id)}
                                className="h-8 w-8 p-0"
                              >
                                {isPlaying === msg.id ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs opacity-70">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {msg.edited && (
                      <span className="ml-2 text-primary">• Edited</span>
                    )}
                    {msg.forwarded && (
                      <span className="ml-2 text-green-600">• Forwarded</span>
                    )}
                  </p>
                  
                  <div className="flex items-center gap-1">
                    {/* Edit controls - only show for user's own messages */}
                    {msg.sender === user.id && editingMessageId !== msg.id && !msg.content.includes('Voice message') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingMessage(msg.id, msg.content)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {/* Message menu dropdown */}
                    <DropdownMenu open={openMenuId === msg.id} onOpenChange={(open) => setOpenMenuId(open ? msg.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => copyToClipboard(msg)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => forwardMessage(msg)}>
                          <Forward className="h-4 w-4 mr-2" />
                          Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareMessage(msg)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        {msg.sender === user.id && (
                          <>
                            <DropdownMenuItem
                              onClick={() => deleteMessage(msg.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
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
          {/* Microphone Permission Error */}
          {micPermissionError && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800">{micPermissionError}</p>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                To enable microphone access: Click the camera/microphone icon in your browser's address bar → Select "Allow"
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMicPermissionError(null)}
                className="mt-2 text-amber-700 border-amber-300"
              >
                Dismiss
              </Button>
            </div>
          )}
          
          {/* Selected attachments preview */}
          {(attachments.length > 0 || audioBlob) && (
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
              {audioBlob && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {getFileIcon("Voice Message", "audio/webm")}
                  <div className="flex flex-col">
                    <span className="text-sm">Voice Message</span>
                    <span className="text-xs text-red-600">{formatDuration(recordingDuration)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={cancelRecording}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <form
            ref={formRef}
            onSubmit={handleSendMessage}
            className="flex gap-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          >
            <div
              className="flex-1 flex gap-3"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isRecording ? (
                // Recording interface
                <div className="flex-1 flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-medium">Recording</span>
                    <span className="text-red-600">{formatDuration(recordingDuration)}</span>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelRecording}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={stopRecording}
                      className="text-red-600 hover:text-red-700"
                    >
                      <MicOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Normal input
                <>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 transition-all duration-300 focus:shadow-glow"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSendMessage();
                      }
                    }}
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
                </>
              )}
              
              {!isRecording && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={startRecording}
                  className="px-3 text-red-600 hover:text-red-700"
                  title="Start voice recording"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="submit"
              disabled={attachments.length === 0 && !message.trim() && !audioBlob}
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