import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useUnifiedChat } from "@/hooks/useUnifiedChat";
import { useAuth } from "@/contexts/AuthContext";
import { UnifiedSidebar } from "./UnifiedSidebar.tsx";
import { SearchDialog } from "./SearchDialog.tsx";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/ui/image-upload";
import { Label } from "@/components/ui/label";
import { CreateGroupDialog } from "./CreateGroupDialog.tsx";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { 
  Send, 
  Search, 
  Settings, 
  LogOut, 
  MessageCircle, 
  Paperclip, 
  X, 
  FileText, 
  Image, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Edit, 
  Check, 
  MoreHorizontal, 
  Trash2, 
  Copy, 
  Forward, 
  Share2, 
  Users, 
  UserPlus,
  Crown,
  Shield,
  User as UserIcon,
  Hash,
  Lock,
  Globe,
  Info,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { apiService } from "@/lib/api";
import type { Conversation, IndividualMessage, GroupMessage, User, Attachment } from "@/types/chat";

export const UnifiedChatInterface = ({ initialConversationId }: { initialConversationId?: string | null }) => {
  const { t } = useTranslation();
  const { user: authUser, logout: authLogout } = useAuth();
  const chat = useUnifiedChat();
  
  const [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState(authUser?.avatar);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageContent, setEditMessageContent] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editMessageLoading, setEditMessageLoading] = useState<string | null>(null);
  const [deleteMessageLoading, setDeleteMessageLoading] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingMimeTypeRef = useRef<string | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentConversation = chat.currentConversation;

  useEffect(() => {
    if (initialConversationId && chat.conversations.length > 0) {
      chat.selectConversation(initialConversationId);
    }
  }, [initialConversationId, chat.conversations.length]);



  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!message.trim() && attachments.length === 0 && !audioBlob) return;
    if (!chat.currentConversationId) return;

    setSendingMessage(true);
    const messageText = message.trim();
    if (!messageText && attachments.length === 0 && !audioBlob) {
      setSendingMessage(false);
      return;
    }

    const filesToSend = [...attachments];
    
    if (audioBlob && audioUrl) {
      const mimeType = recordingMimeTypeRef.current || audioBlob.type || 'audio/ogg';
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.ogg`, {
        type: mimeType
      });
      filesToSend.push(audioFile);
    }

    await chat.sendMessage(chat.currentConversationId, messageText || "", filesToSend as any);

    setMessage("");
    setAttachments([]);
    cancelRecording();
    setSendingMessage(false);
  };

  const editMessageInApi = async (conversationId: string, messageId: string, content: string) => {
    if (!conversationId || !messageId) return;
    
    setEditMessageLoading(messageId);
    
    try {
      if (conversationId.startsWith('group-')) {
        await chat.editMessage(conversationId, messageId, content);
      } else {
        const response = await apiService.httpRequest(`/chat/messages/${messageId}/`, {
          method: 'PATCH',
          body: JSON.stringify({ content })
        });
        
        if (!response.success) {
            throw new Error(response.error || t('messages.failedToEditMessage'));
        }
        
        chat.editMessage(conversationId, messageId, content);
      }
    } catch (error) {
      console.error('Error editing message:', error);
    } finally {
      setEditMessageLoading(null);
    }
  };

  const deleteMessageFromApi = async (conversationId: string, messageId: string) => {
    if (!conversationId || !messageId) return;
    
    setDeleteMessageLoading(messageId);
    
    try {
      if (conversationId.startsWith('group-')) {
        chat.deleteMessage(conversationId, messageId);
      } else {
        const response = await apiService.httpRequest(`/chat/messages/${messageId}/`, {
          method: 'DELETE'
        });
        
        if (!response.success) {
          throw new Error(response.error || t('messages.failedToDeleteMessage'));
        }
        
        chat.deleteMessage(conversationId, messageId);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleteMessageLoading(null);
    }
  };

  if (!authUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">{t('auth.pleaseLogin')}</h3>
          <p className="text-muted-foreground">{t('auth.needToLogin')}</p>
        </div>
      </div>
    );
  }

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

  const startEditingMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditMessageContent(currentContent);
    setOpenMenuId(null);
  };

  const saveMessageEdit = async () => {
    if (!editingMessageId || !editMessageContent.trim() || !chat.currentConversationId) return;
    await editMessageInApi(chat.currentConversationId, editingMessageId, editMessageContent.trim());
    setEditingMessageId(null);
    setEditMessageContent("");
  };

  const cancelMessageEdit = () => {
    setEditingMessageId(null);
    setEditMessageContent("");
  };

  const handleLogout = () => {
    chat.logout();
    authLogout();
  };

  const getOtherUser = (conversation: Conversation): User | null => {
    if (conversation.type !== 'individual') return null;
    return conversation.participants.find(p => p.id !== authUser.id) || null;
  };

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "moderator":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getGroupIcon = (conversation: Conversation) => {
    if (conversation.type !== 'group') return null;
    return conversation.isGroupPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return t('common.zeroBytes');
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, fileType?: string) => {
    const type = fileType || '';
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Mic className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      const preferredTypes = [
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      const supportedType = preferredTypes.find((t) =>
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)
      );

      if (!supportedType) {
        stream.getTracks().forEach(track => track.stop());
        setMicPermissionError('Voice recording is not supported in this browser (no supported audio format: ogg).');
        return;
      }

      recordingMimeTypeRef.current = supportedType;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recordingMimeTypeRef.current || 'audio/ogg' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicPermissionError('Microphone access denied. Please enable microphone permissions in your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    recordingMimeTypeRef.current = null;
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background to-muted">
        <UnifiedSidebar 
          conversations={chat.conversations}
          currentConversationId={chat.currentConversationId}
          onSelectConversation={chat.selectConversation}
          onSearchOpen={() => setShowSearch(true)}
          currentUser={authUser}
          availableUsers={chat.availableUsers}
          groups={chat.groups}
          onCreateGroup={chat.createGroup}
          onCreateIndividualChat={chat.createIndividualConversation}
          onDeleteConversation={chat.deleteConversation}
        />
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t('chat.offChat')}</h2>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t('chat.welcomeToOffChat')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('chat.selectConversationToStart')}
              </p>
              <Button onClick={() => setShowSearch(true)}>
                <Search className="h-4 w-4 mr-2" />
                {t('chat.searchUsersAndGroups')}
              </Button>
            </div>
          </div>
        </div>
        <SearchDialog 
          key={showSearch ? 'open' : 'closed'}
          open={showSearch}
          onOpenChange={setShowSearch}
          onSelectUser={(user) => {
            chat.createIndividualConversation(user.id);
            setShowSearch(false);
          }}
          onSelectGroup={(groupId) => {
            chat.selectConversation(`group-${groupId}`);
            setShowSearch(false);
          }}
          searchUsers={chat.searchUsers}
          searchGroups={chat.searchGroups}
          searchConversations={chat.searchConversations}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <UnifiedSidebar 
        conversations={chat.conversations}
        currentConversationId={chat.currentConversationId}
        onSelectConversation={chat.selectConversation}
        onSearchOpen={() => setShowSearch(true)}
        currentUser={authUser}
        availableUsers={chat.availableUsers}
        groups={chat.groups}
        onCreateGroup={chat.createGroup}
        onCreateIndividualChat={chat.createIndividualConversation}
        onDeleteConversation={chat.deleteConversation}
      />

      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentConversation.type === 'group' ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentConversation.groupAvatar} />
                  <AvatarFallback showDefaultIcon={false} className="bg-primary text-primary-foreground">
                    {(currentConversation.groupName || t('common.unknown')).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOtherUser(currentConversation)?.avatar} />
                  <AvatarFallback showDefaultIcon={false} className="bg-primary text-primary-foreground">
                    {(getOtherUser(currentConversation)?.username || t('common.unknown')).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {currentConversation.type === 'group' 
                      ? currentConversation.groupName 
                      : getOtherUser(currentConversation)?.username
                    }
                  </h2>
                  {getGroupIcon(currentConversation)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {currentConversation.type === 'group' ? (
                    <button
                      onClick={() => setShowMembersDialog(true)}
                      className="flex items-center gap-2 hover:text-primary hover:underline cursor-pointer"
                    >
                      <Users className="h-4 w-4" />
                      <span>{currentConversation.participants.length} {t('chat.members')}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${getStatusColor(getOtherUser(currentConversation)?.status || 'offline')}`}
                      />
                      <span className="capitalize">{t(`chat.${getOtherUser(currentConversation)?.status || 'offline'}`)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('settings.profileSettings')}</DialogTitle>
                    <DialogDescription>{t('settings.updateProfileInfo')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t('settings.profileImage')}</Label>
                      <ImageUpload value={avatar} onChange={setAvatar} />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {chat.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {chat.error}
                </AlertDescription>
              </Alert>
            )}
            
            {chat.loading && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">{t('messages.loadingMessages')}</p>
              </div>
            )}

            {chat.currentMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('chat.startConversation')}</h3>
                <p className="text-muted-foreground">
                  {t('chat.firstMessagePrompt')}
                </p>
              </div>
            ) : (
              chat.currentMessages.map((msg, index) => {
                const isOwnMessage = msg.senderId === authUser.id;
                const sender = currentConversation.participants.find(p => p.id === msg.senderId);
                
                return (
                  <div
                    key={`${msg.id}-${index}`}
                    className={`group flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    {isOwnMessage ? (
                      <div className="flex items-end gap-2 max-w-xs">
                        <div className="flex flex-col items-end gap-1">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          
                          <div className="text-right">
                            {editingMessageId === msg.id ? (
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
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" onClick={saveMessageEdit} disabled={!editMessageContent.trim()}>
                                    <Check className="h-3 w-3 mr-1" />
                                    {t('common.save')}
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={cancelMessageEdit}>
                                    {t('common.cancel')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-primary/10 rounded-lg px-3 py-2">
                                {msg.content && <p className="text-sm text-foreground">{msg.content}</p>}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className={msg.content ? "mt-2 space-y-2" : "space-y-2"}>
                                    {msg.attachments.map((attachment) => {
                                      const attachmentType = attachment.type || '';
                                      if (attachmentType.startsWith('image/')) {
                                        return (
                                          <img
                                            key={attachment.id}
                                            src={attachment.url}
                                            alt={attachment.name}
                                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-80"
                                            onClick={() => setSelectedImage(attachment.url)}
                                          />
                                        );
                                      }
                                      return (
                                        <a
                                          key={attachment.id}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 bg-primary/20 rounded-lg cursor-pointer hover:bg-primary/30"
                                        >
                                          {getFileIcon(attachment.name, attachmentType)}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{attachment.name}</p>
                                            {attachment.size > 0 && <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>}
                                          </div>
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <p className="text-xs opacity-70">
                                    {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }) : new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingMessage(msg.id, msg.content)}
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  
                                  <DropdownMenu open={openMenuId === msg.id} onOpenChange={(open) => setOpenMenuId(open ? msg.id : null)}>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                      >
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem 
                                        onClick={() => deleteMessageFromApi(chat.currentConversationId!, msg.id)}
                                        disabled={deleteMessageLoading === msg.id}
                                        className="text-red-600 focus:text-red-600"
                                      >
                                        {deleteMessageLoading === msg.id ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        {t('common.delete')}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-muted text-muted-foreground">
                        {currentConversation.type === 'group' && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{sender?.username}</span>
                          </div>
                        )}
                        
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={msg.content ? "mt-2 space-y-2" : "space-y-2"}>
                            {msg.attachments.map((attachment) => {
                                      const attachmentType = attachment.type || '';
                                      if (attachmentType.startsWith('image/')) {
                                        return (
                                          <img
                                            key={attachment.id}
                                            src={attachment.url}
                                            alt={attachment.name}
                                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-80"
                                            onClick={() => setSelectedImage(attachment.url)}
                                          />
                                        );
                                      }
                                      return (
                                        <a
                                          key={attachment.id}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 bg-black/10 rounded-lg cursor-pointer hover:bg-black/20"
                                        >
                                          {getFileIcon(attachment.name, attachmentType)}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{attachment.name}</p>
                                            {attachment.size > 0 && <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>}
                                          </div>
                                        </a>
                                      );
                                    })}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-70">
                            {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border/50 bg-card/30 backdrop-blur-sm">
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
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                    placeholder={`${t('chat.typeMessage')} ${currentConversation.type === 'group' ? currentConversation.groupName : getOtherUser(currentConversation)?.username}...`}
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/webm,video/ogg,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
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

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          {selectedImage && (
                <img src={selectedImage} alt={t('common.fullSize')} className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      <SearchDialog 
        key={showSearch ? 'open' : 'closed'}
        open={showSearch}
        onOpenChange={setShowSearch}
        onSelectUser={(user) => {
          chat.createIndividualConversation(user.id);
          setShowSearch(false);
        }}
        onSelectGroup={(groupId) => {
          chat.selectConversation(`group-${groupId}`);
          setShowSearch(false);
        }}
        searchUsers={chat.searchUsers}
        searchGroups={chat.searchGroups}
        searchConversations={chat.searchConversations}
      />

      {currentConversation.type === 'group' && (
        <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Group Members ({currentConversation.participants.length})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-96">
              <div className="space-y-2 pr-4">
                {currentConversation.participants.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
