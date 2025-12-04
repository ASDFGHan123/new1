import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Settings, LogOut, Users, MessageCircle, Paperclip, X, FileText, Image, Mic, MicOff, Play, Pause, Edit, Check, MoreHorizontal, Trash2, Copy, Forward, Share2, Info, Crown, Shield, User as UserIcon, Hash, Lock, Globe, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Label } from "@/components/ui/label";
import { User, Group, GroupMessage, Attachment, GroupMember } from "@/types/group";
import { GroupSidebar } from "./GroupSidebar";
import { GroupManagementDialog } from "./GroupManagementDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiService } from "@/lib/api";

interface GroupChatInterfaceProps {
  user: User;
  groups: Group[];
  availableUsers: User[];
  currentGroupId?: string;
  onLogout: () => void;
  onUpdateUser?: (updates: Partial<User>) => void;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (groupData: any) => void;
  onUpdateGroup: (groupId: string, data: any) => void;
  onAddMembers: (groupId: string, memberIds: string[]) => void;
  onRemoveMember: (groupId: string, userId: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onSendMessage: (groupId: string, content: string, attachments?: Attachment[]) => void;
  onEditMessage: (groupId: string, messageId: string, content: string) => void;
  onDeleteMessage: (groupId: string, messageId: string) => void;
  onForwardMessage: (groupId: string, message: GroupMessage) => void;
}

export const GroupChatInterface = ({
  user,
  groups,
  availableUsers,
  currentGroupId,
  onLogout,
  onUpdateUser,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onForwardMessage
}: GroupChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState(user.avatar);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // API Integration states
  const [currentGroupMessages, setCurrentGroupMessages] = useState<GroupMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editMessageLoading, setEditMessageLoading] = useState<string | null>(null);
  const [deleteMessageLoading, setDeleteMessageLoading] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentGroup = groups.find(g => g.id === currentGroupId);
  const isAdmin = currentGroup ? currentGroup.members.find(m => m.userId === user.id)?.role === "admin" : false;
  const isModerator = currentGroup ? currentGroup.members.find(m => m.userId === user.id)?.role === "moderator" : false;

  // API Integration Functions
  const fetchGroupMessages = async (groupId: string, retryAttempt = 0) => {
    if (!groupId) return;
    
    setMessagesLoading(true);
    setMessagesError(null);
    
    try {
      const response = await apiService.getMessages(groupId);
      
      if (response.success && response.data) {
        // Convert API messages to GroupMessage format
        const messages: GroupMessage[] = response.data.map(msg => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.sender,
          senderName: msg.sender,
          timestamp: new Date(msg.timestamp),
          groupId: groupId,
          attachments: msg.attachments,
          edited: msg.edited,
          editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
          forwarded: msg.forwarded,
          originalSender: msg.originalSender
        }));
        
        setCurrentGroupMessages(messages);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(response.error || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      setMessagesError(errorMessage);
      
      // Retry logic (up to 3 attempts)
      if (retryAttempt < 3) {
        setTimeout(() => {
          fetchGroupMessages(groupId, retryAttempt + 1);
          setRetryCount(retryAttempt + 1);
        }, Math.pow(2, retryAttempt) * 1000); // Exponential backoff
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessageToApi = async (content: string, attachments: File[]) => {
    if (!currentGroupId) return;
    
    setSendingMessage(true);
    
    try {
      const response = await apiService.sendMessage(currentGroupId, content, attachments);
      
      if (response.success && response.data) {
        // Add the new message to the local state
        const newMessage: GroupMessage = {
          id: response.data.id,
          content: response.data.content,
          senderId: response.data.sender,
          senderName: response.data.sender,
          timestamp: new Date(response.data.timestamp),
          groupId: currentGroupId,
          attachments: response.data.attachments,
          edited: response.data.edited,
          editedAt: response.data.editedAt ? new Date(response.data.editedAt) : undefined,
          forwarded: response.data.forwarded,
          originalSender: response.data.originalSender
        };
        
        setCurrentGroupMessages(prev => [...prev, newMessage]);
        
        // Call the original callback if provided
        if (onSendMessage) {
          onSendMessage(currentGroupId, content, attachments);
        }
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setMessagesError(errorMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  const editMessageInApi = async (messageId: string, content: string) => {
    if (!currentGroupId) return;
    
    setEditMessageLoading(messageId);
    
    try {
      // Call the edit message API endpoint
      const response = await apiService.request(`/chat/messages/${messageId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ content })
      });
      
      if (response.success) {
        // Update the local message state
        setCurrentGroupMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content, edited: true, editedAt: new Date() }
              : msg
          )
        );
        
        // Call the original callback if provided
        if (onEditMessage) {
          onEditMessage(currentGroupId, messageId, content);
        }
      } else {
        throw new Error(response.error || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit message';
      setMessagesError(errorMessage);
    } finally {
      setEditMessageLoading(null);
    }
  };

  const deleteMessageFromApi = async (messageId: string) => {
    if (!currentGroupId) return;
    
    setDeleteMessageLoading(messageId);
    
    try {
      const response = await apiService.request(`/chat/messages/${messageId}/`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Remove the message from local state
        setCurrentGroupMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        // Call the original callback if provided
        if (onDeleteMessage) {
          onDeleteMessage(currentGroupId, messageId);
        }
      } else {
        throw new Error(response.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
      setMessagesError(errorMessage);
    } finally {
      setDeleteMessageLoading(null);
    }
  };

  const handleRetryMessages = () => {
    if (currentGroupId) {
      fetchGroupMessages(currentGroupId);
    }
  };

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

  // Fetch messages when current group changes
  useEffect(() => {
    if (currentGroupId) {
      fetchGroupMessages(currentGroupId);
    }
  }, [currentGroupId]);

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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(null);
    } else {
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
    setOpenMenuId(null);
  };

  const saveMessageEdit = async () => {
    if (!editingMessageId || !editMessageContent.trim() || !currentGroupId) return;

    const content = editMessageContent.trim();
    
    // Use the new API integration
    await editMessageInApi(editingMessageId, content);

    setEditingMessageId(null);
    setEditMessageContent("");
  };

  const cancelMessageEdit = () => {
    setEditingMessageId(null);
    setEditMessageContent("");
  };

  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!message.trim() && attachments.length === 0 && !audioBlob) return;
    if (!currentGroupId) return;

    const messageText = message.trim();
    const filesToSend = [...attachments];
    
    // Add audio blob to attachments if recording
    if (audioBlob && audioUrl) {
      // Convert audio blob to file for upload
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      filesToSend.push(audioFile);
    }

    // Use the new API integration
    await sendMessageToApi(messageText, filesToSend);

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

  const getStatusColor = (status: "online" | "away" | "offline") => {
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

  const getRoleIcon = (role: GroupMember["role"]) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "moderator":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getGroupIcon = (group: Group) => {
    return group.isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  const getMemberById = (userId: string) => {
    return currentGroup?.members.find(m => m.userId === userId);
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
  }, [audioUrl]);

  if (!currentGroup) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background to-muted">
        <GroupSidebar
          groups={groups}
          currentUser={user}
          availableUsers={availableUsers}
          currentGroupId={currentGroupId}
          onSelectGroup={onSelectGroup}
          onCreateGroup={onCreateGroup}
          onUpdateGroup={onUpdateGroup}
          onAddMembers={onAddMembers}
          onRemoveMember={onRemoveMember}
          onLeaveGroup={onLeaveGroup}
          onDeleteGroup={onDeleteGroup}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Welcome to Group Chat</h3>
            <p className="text-muted-foreground mb-6">
              Select a group from the sidebar or create a new one to start chatting
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      {/* Group Sidebar */}
      <GroupSidebar
        groups={groups}
        currentUser={user}
        availableUsers={availableUsers}
        currentGroupId={currentGroupId}
        onSelectGroup={onSelectGroup}
        onCreateGroup={onCreateGroup}
        onUpdateGroup={onUpdateGroup}
        onAddMembers={onAddMembers}
        onRemoveMember={onRemoveMember}
        onLeaveGroup={onLeaveGroup}
        onDeleteGroup={onDeleteGroup}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentGroup.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentGroup.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{currentGroup.name}</h2>
                  {getGroupIcon(currentGroup)}
                  {currentGroup.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {currentGroup.unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{currentGroup.members.length} members</span>
                  {currentGroup.description && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-xs">{currentGroup.description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Online Members */}
              <div className="flex -space-x-2">
                {currentGroup.members
                  .filter(member => {
                    const memberUser = availableUsers.find(u => u.id === member.userId);
                    return memberUser?.status === "online";
                  })
                  .slice(0, 3)
                  .map((member) => (
                    <Avatar key={member.userId} className="h-8 w-8 border-2 border-card">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-xs">
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                {currentGroup.members.filter(member => {
                  const memberUser = availableUsers.find(u => u.id === member.userId);
                  return memberUser?.status === "online";
                }).length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                    <span className="text-xs font-medium">
                      +{currentGroup.members.filter(member => {
                        const memberUser = availableUsers.find(u => u.id === member.userId);
                        return memberUser?.status === "online";
                      }).length - 3}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGroupInfo(true)}
              >
                <Info className="h-4 w-4" />
              </Button>

              <ThemeToggle />

              {(isAdmin || isModerator) && (
                <GroupManagementDialog
                  group={currentGroup}
                  currentUser={user}
                  availableUsers={availableUsers}
                  onUpdateGroup={onUpdateGroup}
                  onAddMembers={onAddMembers}
                  onRemoveMember={onRemoveMember}
                  onLeaveGroup={onLeaveGroup}
                  onDeleteGroup={onDeleteGroup}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  }
                />
              )}

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

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {/* Error Message */}
            {messagesError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="flex items-center justify-between">
                    <span>{messagesError}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryMessages}
                      disabled={retryCount >= 3}
                      className="ml-2"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${retryCount > 0 ? 'animate-spin' : ''}`} />
                      Retry ({retryCount}/3)
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Loading State */}
            {messagesLoading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            )}

            {currentGroupMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                <p className="text-muted-foreground">
                  Be the first to send a message in {currentGroup.name}
                </p>
              </div>
            ) : (
              currentGroupMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group flex ${
                    msg.senderId === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      msg.senderId === user.id
                        ? "bg-chat-bubble text-chat-bubble-foreground"
                        : "bg-chat-bubble-other text-chat-bubble-other-foreground"
                    }`}
                  >
                    {msg.senderId !== user.id && (
                      <div className="flex items-center gap-2 mb-1">
                        {getRoleIcon(getMemberById(msg.senderId)?.role || "member")}
                        <span className="text-xs font-medium">{msg.senderName}</span>
                      </div>
                    )}
                    
                    {/* Message content */}
                    {editingMessageId === msg.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editMessageContent}
                          onChange={(e) => setEditMessageContent(e.target.value)}
                          className="text-sm"
                          placeholder="Edit your message..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveMessageEdit();
                            } else if (e.key === 'Escape') {
                              cancelMessageEdit();
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={saveMessageEdit}
                            disabled={editMessageLoading === msg.id}
                          >
                            {editMessageLoading === msg.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelMessageEdit}
                            disabled={editMessageLoading === msg.id}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground">{msg.content}</p>
                    )}
                    
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                            {getFileIcon(attachment.name, attachment.type)}
                            <span className="text-xs truncate">{attachment.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(attachment.size)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {msg.edited && <span className="ml-1">(edited)</span>}
                      </p>
                      
                      {/* Message actions */}
                      {(isAdmin || isModerator || msg.senderId === user.id) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {msg.senderId === user.id && (
                              <DropdownMenuItem 
                                onClick={() => startEditingMessage(msg.id, msg.content)}
                                disabled={editMessageLoading === msg.id}
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {(isAdmin || isModerator) && (
                              <DropdownMenuItem 
                                onClick={() => deleteMessageFromApi(msg.id)}
                                disabled={deleteMessageLoading === msg.id}
                                className="text-red-600"
                              >
                                {deleteMessageLoading === msg.id ? (
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3 mr-2" />
                                )}
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-6 border-t border-border/50 bg-card/30 backdrop-blur-sm">
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
          >
            <div
              className="flex-1 flex gap-3"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isRecording ? (
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
                <>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message ${currentGroup.name}...`}
                    className="flex-1"
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
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="submit"
              disabled={(attachments.length === 0 && !message.trim() && !audioBlob) || sendingMessage}
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Group Info Dialog */}
      <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Group Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Group Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentGroup.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentGroup.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{currentGroup.name}</h3>
                <p className="text-muted-foreground">{currentGroup.description || "No description"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={currentGroup.isPrivate ? "secondary" : "outline"}>
                    {currentGroup.isPrivate ? "Private" : "Public"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created {new Date(currentGroup.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Members List */}
            <div>
              <h4 className="font-semibold mb-3">Members ({currentGroup.members.length})</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentGroup.members.map((member) => {
                  const memberUser = availableUsers.find(u => u.id === member.userId);
                  return (
                    <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">
                          {member.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.username}</p>
                          {getRoleIcon(member.role)}
                          {member.userId === user.id && <span className="text-xs text-muted-foreground">(You)</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{member.role}</span>
                          <span>•</span>
                          <span className="capitalize">{memberUser?.status || "offline"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};