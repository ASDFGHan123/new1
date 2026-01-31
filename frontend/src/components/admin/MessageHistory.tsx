import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Eye, Trash2, Clock, Users, User, AlertTriangle, Plus, BarChart3, Printer, Download, Upload, FileText, Database, Shield, CheckCircle, XCircle, Loader2, Archive, RotateCcw, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { openPrintWindow, generateMessageHistoryHTML } from "@/lib/printUtils";
import { apiService } from "@/lib/api";

interface SentMessage {
  id: string;
  type: "system" | "broadcast" | "targeted";
  content: string;
  recipients: string[]; // user IDs or "all" for broadcast
  recipientCount: number;
  sentBy: string;
  sentAt: string;
  status: "sent" | "delivered" | "failed";
  priority: "low" | "normal" | "high" | "urgent";
}

interface MessageHistoryProps {
  initialMessages?: SentMessage[];
}

// No mock data - all data must come from backend API

export const MessageHistory = ({ initialMessages = [] }: MessageHistoryProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Component state
  const [messages, setMessages] = useState<SentMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  // Dialog states
  const [selectedMessage, setSelectedMessage] = useState<SentMessage | null>(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupFormat, setBackupFormat] = useState<"json" | "csv" | "xml">("json");
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showBackupOptions, setShowBackupOptions] = useState(false);
  
  // Backup options
  const [backupOptions, setBackupOptions] = useState({
    includeStatistics: true,
    includeFilters: true,
    compressData: false,
    validateIntegrity: true,
    includeMetadata: true
  });
  
  // Restore state
  const [restoreData, setRestoreData] = useState<string>("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  
  // Action states
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // API Functions
  const loadMessageHistory = async (retryAttempt = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.httpRequest<any>('/admin/message-history/');
      if (!response.success) {
        throw new Error(response.error || 'Failed to load message history');
      }

      const raw = (response.data?.results || response.data || []) as any[];
      const mapped: SentMessage[] = raw.map((m: any) => ({
        id: String(m.id),
        type: m.type,
        content: m.content,
        recipients: Array.isArray(m.recipients) ? m.recipients.map((r: any) => String(r)) : [],
        recipientCount: Number(m.recipient_count || 0),
        sentBy: m.sent_by ? String(m.sent_by) : 'admin',
        sentAt: m.sent_at || new Date().toISOString(),
        status: m.status || 'sent',
        priority: m.priority || 'normal',
      }));

      setMessages(mapped);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Failed to load message history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load message history';
      setError(errorMessage);
      
      // Retry logic (up to 3 attempts)
      if (retryAttempt < 3) {
        setTimeout(() => {
          loadMessageHistory(retryAttempt + 1);
          setRetryCount(retryAttempt + 1);
        }, Math.pow(2, retryAttempt) * 1000); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadMessageHistory();
  };

  // Load message history from API
  useEffect(() => {
    if (initialMessages.length === 0) {
      loadMessageHistory();
    }
  }, []);

  // Close backup options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showBackupOptions) {
        const target = event.target as Element;
        if (!target.closest('[data-backup-options]')) {
          setShowBackupOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBackupOptions]);

  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const matchesSearch = searchQuery === "" || (
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.sentBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.priority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.recipientCount.toString().includes(searchQuery) ||
        format(new Date(message.sentAt), "PPP").toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesType = typeFilter === "all" || message.type === typeFilter;
      const matchesStatus = statusFilter === "all" || message.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || message.priority === priorityFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [messages, searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Calculate statistics
  const messageStats = useMemo(() => {
    const total = messages.length;
    const byType = messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = messages.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = messages.reduce((acc, msg) => {
      acc[msg.priority] = (acc[msg.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRecipients = messages.reduce((sum, msg) => sum + msg.recipientCount, 0);

    return { total, byType, byStatus, byPriority, totalRecipients };
  }, [messages]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "broadcast":
        return <Users className="w-4 h-4" />;
      case "system":
        return <AlertTriangle className="w-4 h-4" />;
      case "targeted":
        return <User className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "broadcast":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "system":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "targeted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  // Function to add a new sent message to history
  const addSentMessage = async (content: string, type: "system" | "broadcast" | "targeted", priority: string, recipients: string[] = [], recipientCount: number = 0) => {
    try {
      const payload = {
        type,
        content,
        recipients,
        recipient_count: type === 'broadcast' ? recipientCount : recipients.length,
        status: 'sent',
        priority,
      };

      const resp = await apiService.httpRequest<any>('/admin/message-history/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!resp.success) {
        throw new Error(resp.error || 'Failed to send message');
      }

      await loadMessageHistory();
      toast({
        title: t('messages.sendMessage'),
        description: t('system.messageSent'),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failedToSend'),
        variant: "destructive"
      });
    }
  };

  // Function to view message details
  const handleViewMessage = (message: SentMessage) => {
    setSelectedMessage(message);
    setShowMessageDetail(true);
  };

  // Function to delete message from history (move to trash)
  const handleDeleteMessage = async (messageId: string) => {
    setActionLoading(prev => ({ ...prev, [messageId]: true }));
    
    try {
      const resp = await apiService.httpRequest<any>(`/admin/message-history/${messageId}/`, {
        method: 'DELETE',
      });

      if (!resp.success) {
        throw new Error(resp.error || 'Failed to delete message');
      }

      await loadMessageHistory();
      toast({
        title: t('trash.deletedItems'),
        description: t('trash.restoreItem'),
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failedToDelete'),
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [messageId]: false }));
    }
  };

  const handlePrintMessageHistory = () => {
    const printData = generateMessageHistoryHTML(filteredMessages);
    openPrintWindow({
      ...printData,
      subtitle: `Filtered Results: ${filteredMessages.length} of ${messages.length} messages`
    });
  };

  // Generate integrity hash for backup validation
  const generateIntegrityHash = (data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  // Convert messages to CSV format
  const convertToCSV = (messages: SentMessage[]): string => {
    const headers = ['ID', 'Type', 'Content', 'Recipients', 'Recipient Count', 'Sent By', 'Sent At', 'Status', 'Priority'];
    const rows = messages.map(msg => [
      msg.id,
      msg.type,
      `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes
      `"${msg.recipients.join(', ')}"`,
      msg.recipientCount.toString(),
      msg.sentBy,
      msg.sentAt,
      msg.status,
      msg.priority
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Convert messages to XML format
  const convertToXML = (messages: SentMessage[]): string => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const messageElements = messages.map(msg => `
    <message>
      <id>${msg.id}</id>
      <type>${msg.type}</type>
      <content><![CDATA[${msg.content}]]></content>
      <recipients>
        ${msg.recipients.map(recipient => `<recipient>${recipient}</recipient>`).join('')}
      </recipients>
      <recipientCount>${msg.recipientCount}</recipientCount>
      <sentBy>${msg.sentBy}</sentBy>
      <sentAt>${msg.sentAt}</sentAt>
      <status>${msg.status}</status>
      <priority>${msg.priority}</priority>
    </message>`).join('');
    
    return `${xmlHeader}
<messageHistory>
  <timestamp>${new Date().toISOString()}</timestamp>
  <statistics>
    <totalMessages>${messageStats.total}</totalMessages>
    <totalRecipients>${messageStats.totalRecipients}</totalRecipients>
    <byType>
      <broadcast>${messageStats.byType.broadcast || 0}</broadcast>
      <system>${messageStats.byType.system || 0}</system>
      <targeted>${messageStats.byType.targeted || 0}</targeted>
    </byType>
    <byStatus>
      <sent>${messageStats.byStatus.sent || 0}</sent>
      <delivered>${messageStats.byStatus.delivered || 0}</delivered>
      <failed>${messageStats.byStatus.failed || 0}</failed>
    </byStatus>
    <byPriority>
      <low>${messageStats.byPriority.low || 0}</low>
      <normal>${messageStats.byPriority.normal || 0}</normal>
      <high>${messageStats.byPriority.high || 0}</high>
      <urgent>${messageStats.byPriority.urgent || 0}</urgent>
    </byPriority>
  </statistics>
  ${messageElements}
</messageHistory>`;
  };

  // Enhanced backup function with multiple formats and features
  const handleBackupMessageHistory = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    try {
      // Step 1: Prepare data (10%)
      await new Promise(resolve => setTimeout(resolve, 100));
      setBackupProgress(10);
      
      const backupData: any = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        format: backupFormat,
        backupOptions: { ...backupOptions }
      };

      // Step 2: Add metadata (20%)
      if (backupOptions.includeMetadata) {
        backupData.metadata = {
          totalMessages: filteredMessages.length,
          filterApplied: {
            searchQuery,
            typeFilter,
            statusFilter,
            priorityFilter
          },
          backupGeneratedBy: "MessageHistory Component",
          systemInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        };
      }
      setBackupProgress(20);

      // Step 3: Add statistics (30%)
      if (backupOptions.includeStatistics) {
        backupData.statistics = messageStats;
      }
      setBackupProgress(30);

      // Step 4: Add filters (40%)
      if (backupOptions.includeFilters) {
        backupData.filters = {
          searchQuery,
          typeFilter,
          statusFilter,
          priorityFilter
        };
      }
      setBackupProgress(40);

      // Step 5: Add messages (60-90%)
      const messageData = backupFormat === "json" ? JSON.stringify(filteredMessages, null, 2) : 
                         backupFormat === "csv" ? convertToCSV(filteredMessages) :
                         convertToXML(filteredMessages);
      
      for (let i = 60; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setBackupProgress(i);
      }

      // Step 6: Add data and integrity check (95%)
      if (backupFormat === "json") {
        backupData.data = messageData;
        
        if (backupOptions.validateIntegrity) {
          backupData.integrity = {
            hash: generateIntegrityHash(messageData),
            algorithm: "simple-hash",
            timestamp: new Date().toISOString()
          };
        }
      } else {
        backupData.data = messageData;
        
        if (backupOptions.validateIntegrity) {
          backupData.integrity = {
            hash: generateIntegrityHash(messageData),
            algorithm: "simple-hash",
            timestamp: new Date().toISOString()
          };
        }
      }
      setBackupProgress(95);

      // Step 7: Generate and download file (100%)
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `message-history-backup-${timestamp}.${backupFormat}`;
      
      let blob: Blob;
      let mimeType: string;
      
      switch (backupFormat) {
        case "csv":
          blob = new Blob([messageData], { type: 'text/csv' });
          mimeType = 'text/csv';
          break;
        case "xml":
          blob = new Blob([messageData], { type: 'application/xml' });
          mimeType = 'application/xml';
          break;
        default:
          blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          mimeType = 'application/json';
      }

      // Apply compression if requested
      if (backupOptions.compressData && 'CompressionStream' in window) {
        try {
          const compressed = await compressData(blob);
          blob = compressed;
        } catch (error) {
          console.warn('Compression failed, using uncompressed data:', error);
        }
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      setBackupProgress(100);
      
      toast({
        title: t('messages.backupComplete'),
        description: t('messages.backupComplete'),
      });
      
      // Reset progress after a delay
      setTimeout(() => {
        setBackupProgress(0);
        setIsBackingUp(false);
      }, 1000);
      
    } catch (error) {
      console.error('Backup failed:', error);
      toast({
        title: t('messages.backupFailed'),
        description: t('messages.backupFailed'),
        variant: "destructive"
      });
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  // Simple compression function (fallback for browsers without CompressionStream)
  const compressData = async (blob: Blob): Promise<Blob> => {
    if ('CompressionStream' in window) {
      const compressionStream = new (window as any).CompressionStream('gzip');
      const compressedStream = blob.stream().pipeThrough(compressionStream);
      return new Response(compressedStream).blob();
    } else {
      // Fallback: return original blob
      return blob;
    }
  };

  // Restore/Import functionality
  const handleRestoreMessages = async () => {
    if (!restoreData.trim()) {
      toast({
        title: t('common.error'),
        description: t('messages.restoreData'),
        variant: "destructive"
      });
      return;
    }

    try {
      let parsedData: any;
      
      // Try to parse JSON first
      try {
        parsedData = JSON.parse(restoreData);
      } catch {
        // If JSON parsing fails, assume it's CSV or XML and inform user
        toast({
          title: t('common.error'),
          description: t('messages.restoreFailed'),
          variant: "destructive"
        });
        return;
      }

      // Validate backup structure
      if (!parsedData.data || !Array.isArray(parsedData.data)) {
        throw new Error("Invalid backup format: missing or invalid message data");
      }

      // Validate integrity if present
      if (parsedData.integrity && backupOptions.validateIntegrity) {
        const dataString = JSON.stringify(parsedData.data);
        const expectedHash = parsedData.integrity.hash;
        const actualHash = generateIntegrityHash(dataString);
        
        if (expectedHash !== actualHash) {
          throw new Error("Backup integrity check failed: data may be corrupted");
        }
      }

      // Confirm restore operation
      const confirmed = window.confirm(
        `This will restore ${parsedData.data.length} messages and replace current message history. Continue?`
      );
      
      if (confirmed) {
        setMessages(parsedData.data);
        setShowRestoreDialog(false);
        setRestoreData("");
        
        toast({
          title: "Restore Completed",
          description: `${parsedData.data.length} messages have been restored.`,
        });
      }
      
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Invalid backup data format.",
        variant: "destructive"
      });
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRestoreData(content);
      setShowRestoreDialog(true);
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('messages.messageHistory')}</CardTitle>
            <CardDescription>{t('messages.messageHistory')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mr-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={retryCount >= 3}
                    className="ml-2"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${retryCount > 0 ? 'animate-spin' : ''}`} />
                    {t('common.retry')} ({retryCount}/3)
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">{t('common.loading')}</span>
              </div>
            )}
            
            {/* Backup Progress */}
            {isBackingUp && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">{t('messages.backingUp')}</span>
                <Progress value={backupProgress} className="w-16 h-2" />
                <span className="text-xs text-blue-600">{backupProgress}%</span>
              </div>
            )}
            
            {/* Enhanced Backup Controls */}
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setShowBackupOptions(!showBackupOptions)}
                variant="outline"
                size="sm"
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <Archive className="w-4 h-4 mr-1" />
                {t('messages.backup')}
              </Button>
              
              {showBackupOptions && (
                <div data-backup-options className="absolute top-full right-0 mt-1 p-4 bg-white border rounded-lg shadow-lg z-50 min-w-[300px]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t('messages.backupFormat')}</Label>
                      <Select value={backupFormat} onValueChange={(value: "json" | "csv" | "xml") => setBackupFormat(value)}>
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t('messages.backupOptions')}</Label>
                      <div className="space-y-1">
                        {[
                          { key: 'includeStatistics', label: t('messages.includeStatistics') },
                          { key: 'includeFilters', label: t('messages.includeFilters') },
                          { key: 'compressData', label: t('messages.compressData') },
                          { key: 'validateIntegrity', label: t('messages.validateIntegrity') },
                          { key: 'includeMetadata', label: t('messages.includeMetadata') }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={backupOptions[key as keyof typeof backupOptions]}
                              onChange={(e) => setBackupOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="rounded"
                            />
                            <label className="text-xs">{label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          handleBackupMessageHistory();
                          setShowBackupOptions(false);
                        }}
                        disabled={isBackingUp}
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {t('backup.createBackup')}
                      </Button>
                      <Button
                        onClick={() => setShowBackupOptions(false)}
                        variant="outline"
                        size="sm"
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Restore/Import Button */}
            <div className="relative">
              <Button
                onClick={() => setShowRestoreDialog(true)}
                variant="outline"
                size="sm"
                className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
              >
                <Upload className="w-4 h-4 mr-1" />
                {t('messages.restore')}
              </Button>
            </div>

            {/* Print Button */}
            <Button
              onClick={handlePrintMessageHistory}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Printer className="w-4 h-4 mr-1" />
              {t('common.print')}
            </Button>

            <Badge variant="secondary" className="text-xs">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </Badge>

          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
// ... (rest of the code remains the same)
          {/* Message Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{messageStats.total}</div>
              <div className="text-sm text-muted-foreground">{t('messages.messageHistory')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{messageStats.byType.broadcast || 0}</div>
              <div className="text-sm text-muted-foreground">{t('messages.broadcast')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{messageStats.byStatus.delivered || 0}</div>
              <div className="text-sm text-muted-foreground">{t('messages.delivered')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{messageStats.totalRecipients}</div>
              <div className="text-sm text-muted-foreground">{t('messages.recipientCount')}</div>
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder={t('messages.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="system">{t('messages.system')}</SelectItem>
                <SelectItem value="broadcast">{t('messages.broadcast')}</SelectItem>
                <SelectItem value="targeted">{t('messages.targeted')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="sent">{t('messages.sent')}</SelectItem>
                <SelectItem value="delivered">{t('messages.delivered')}</SelectItem>
                <SelectItem value="failed">{t('messages.failed')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder={t('messages.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="low">{t('messages.low')}</SelectItem>
                <SelectItem value="normal">{t('messages.normal')}</SelectItem>
                <SelectItem value="high">{t('messages.high')}</SelectItem>
                <SelectItem value="urgent">{t('messages.urgent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages Table */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('messages.type')}</TableHead>
                  <TableHead>{t('messages.content')}</TableHead>
                  <TableHead>{t('messages.recipient')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('messages.priority')}</TableHead>
                  <TableHead>{t('messages.sentAt')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(message.type)}
                        <Badge className={`text-xs ${getTypeColor(message.type)}`}>
                          {message.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm truncate" title={message.content}>
                          {truncateContent(message.content)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {message.type === "broadcast" ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {message.recipientCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                        {message.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(message.sentAt), "MMM dd, HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewMessage(message)}
                          disabled={loading || actionLoading[message.id]}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              disabled={loading || actionLoading[message.id]}
                            >
                              {actionLoading[message.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('trash.deletedItems')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('trash.deleteWarning')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={actionLoading[message.id]}>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMessage(message.id)}
                                disabled={actionLoading[message.id]}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                {actionLoading[message.id] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('common.loading')}
                                  </>
                                ) : (
                                  t('trash.deletedItems')
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('messages.noMessages')}</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>

      {/* Message Detail Modal */}
      <Dialog open={showMessageDetail} onOpenChange={setShowMessageDetail}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && getTypeIcon(selectedMessage.type)}
              {t('messages.messageDetails')}
            </DialogTitle>
            <DialogDescription>
              {t('messages.messageDetails')}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('messages.type')}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedMessage.type)}
                    <Badge className={`text-xs ${getTypeColor(selectedMessage.type)}`}>
                      {t(`messages.${selectedMessage.type}`)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('messages.priority')}</Label>
                  <div className="mt-1">
                    <Badge className={`text-xs ${getPriorityColor(selectedMessage.priority)}`}>
                      {t(`messages.${selectedMessage.priority}`)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('common.status')}</Label>
                  <div className="mt-1">
                    <Badge className={`text-xs ${getStatusColor(selectedMessage.status)}`}>
                      {t(`messages.${selectedMessage.status}`)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('messages.sentBy')}</Label>
                  <p className="text-sm mt-1">{selectedMessage.sentBy}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t('messages.recipient')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedMessage.type === "broadcast" ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {selectedMessage.recipientCount} {t('messages.recipient')}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t('messages.sentAt')}</Label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {format(new Date(selectedMessage.sentAt), "PPP 'at' pp")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">{t('messages.content')}</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>

              {selectedMessage.recipients.length > 0 && selectedMessage.recipients[0] !== "all" && (
                <div>
                  <Label className="text-sm font-medium">Recipient List</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedMessage.recipients.slice(0, 10).map((recipient, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {recipient}
                      </Badge>
                    ))}
                    {selectedMessage.recipients.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedMessage.recipients.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDetail(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore/Import Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Restore Message History
            </DialogTitle>
            <DialogDescription>
              Restore message history from a backup file or paste backup data below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <Label className="text-sm font-medium">Upload Backup File</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Backup File
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or paste backup data</span>
              </div>
            </div>

            {/* Paste Area */}
            <div>
              <Label className="text-sm font-medium">Backup Data</Label>
              <Textarea
                placeholder="Paste your backup JSON data here..."
                value={restoreData}
                onChange={(e) => setRestoreData(e.target.value)}
                className="mt-2 min-h-[200px] font-mono text-xs"
              />
            </div>

            {/* Restore Options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Restore Options</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={backupOptions.validateIntegrity}
                  onChange={(e) => setBackupOptions(prev => ({ ...prev, validateIntegrity: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-xs">Validate backup integrity before restore</label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRestoreDialog(false);
                setRestoreData("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreMessages}
              disabled={!restoreData.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};