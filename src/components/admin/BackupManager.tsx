import React, { useEffect, useState } from "react";
import { Download, Calendar, Database, Users, MessageSquare, Settings, Printer, AlertCircle, HardDrive, BarChart3, Clock, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BackupMetadataDisplay } from "./BackupMetadataDisplay";
import { openPrintWindow, generateBackupReportHTML } from "@/lib/printUtils";
import { useTranslation } from "react-i18next";
import { apiService, API_BASE_URL } from "@/lib/api";

interface BackupManagerProps {
  detailed?: boolean;
}

export const BackupManager = ({ detailed = false }: BackupManagerProps) => {
  const { t } = useTranslation();
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [selectedMonth, setSelectedMonth] = React.useState("current");
  const [backupFormat, setBackupFormat] = React.useState("json");
  const [showFormatDialog, setShowFormatDialog] = React.useState(false);
  const [backupTypes, setBackupTypes] = React.useState({
    users: true,
    messages: false,
    settings: false,
    logs: false
  });
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [recentBackups, setRecentBackups] = React.useState<any[]>([]);

  useEffect(() => {
    checkBackupSetting();
    
    const handleSettingsUpdate = (event: any) => {
      if (event.detail?.backup_enabled !== undefined) {
        setBackupEnabled(event.detail.backup_enabled === 'true');
      } else {
        checkBackupSetting();
      }
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const checkBackupSetting = async () => {
    try {
      const response = await apiService.httpRequest('/admin/settings/');
      if (response.success && response.data) {
        const data = Array.isArray(response.data) ? response.data : [];
        const backupSetting = data.find((s: any) => s.key === 'backup_enabled');
        if (backupSetting) {
          setBackupEnabled(backupSetting.value === 'true');
        }
      }
    } catch (error) {
      console.error('Failed to check backup setting:', error);
    }
  };

  const loadRecentBackups = async () => {
    try {
      const resp = await apiService.httpRequest<any>('/admin/backups/');
      if (resp.success && resp.data) {
        const raw = (resp.data.results || resp.data) as any[];
        const mapped = raw.slice(0, 5).map((b: any) => {
          // Calculate size from multiple sources with better fallbacks
          let size = '0 MB';
          let sizeInBytes = 0;
          
          // Try size_mb first (from serializer)
          if (b.size_mb && b.size_mb > 0) {
            size = `${b.size_mb} MB`;
            sizeInBytes = b.size_mb * 1024 * 1024;
          } 
          // Try file_size (raw bytes from database)
          else if (b.file_size && b.file_size > 0) {
            const sizeMB = (Number(b.file_size) / (1024 * 1024)).toFixed(2);
            size = `${sizeMB} MB`;
            sizeInBytes = Number(b.file_size);
          } 
          // Try file.size (from Django FileField)
          else if (b.file && b.file.size) {
            const sizeMB = (Number(b.file.size) / (1024 * 1024)).toFixed(2);
            size = `${sizeMB} MB`;
            sizeInBytes = Number(b.file.size);
          }
          // If all else fails, estimate based on record count
          else if (b.record_count && b.record_count > 0) {
            const estimatedSize = b.record_count * 1024; // Rough estimate: 1KB per record
            const sizeMB = (estimatedSize / (1024 * 1024)).toFixed(2);
            size = `~${sizeMB} MB`;
            sizeInBytes = estimatedSize;
          }
          
          return {
            id: b.id,
            name: b.name,
            date: (b.created_at ? String(b.created_at).split('T')[0] : new Date().toISOString().split('T')[0]),
            size: size,
            sizeInBytes: sizeInBytes, // Store for potential future use
            status: b.status || 'completed',
            backup_type: b.backup_type || 'unknown',
            record_count: b.record_count || 0,
            file_path: b.file_path || (b.file ? b.file.name : null),
            created_at: b.created_at,
            completed_at: b.completed_at,
            metadata: b.metadata || {},
          };
        });
        setRecentBackups(mapped as any);
      }
    } catch (e) {
      console.error('Failed to load backups:', e);
    }
  };



  const convertToPDF = (data: any): string => {
    let pdf = '%PDF-1.4\n';
    pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
    
    let content = 'BT\n/F1 12 Tf\n50 750 Td\n(System Backup Report) Tj\n0 -20 Td\n';
    content += `(Timestamp: ${data.timestamp}) Tj\n0 -20 Td\n`;
    content += `(Month: ${data.month}) Tj\n0 -40 Td\n`;
    
    content += '(System Health) Tj\n0 -20 Td\n';
    if (data.systemHealth) {
      Object.entries(data.systemHealth).forEach(([key, value]: [string, any]) => {
        content += `(${key}: ${value.status}) Tj\n0 -15 Td\n`;
      });
    }
    
    content += '0 -20 Td\n(Data Summary) Tj\n0 -20 Td\n';
    if (data.data.users) {
      content += `(Users: ${data.data.users.length}) Tj\n0 -15 Td\n`;
    }
    if (data.data.messages) {
      content += `(Messages: ${data.data.messages.length}) Tj\n0 -15 Td\n`;
    }
    if (data.data.conversations) {
      content += `(Conversations: ${data.data.conversations.length}) Tj\n0 -15 Td\n`;
    }
    
    content += 'ET\n';
    
    pdf += `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`;
    pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    pdf += 'xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000273 00000 n\n0000000400 00000 n\n';
    pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF';
    
    return pdf;
  };

  const convertToCSV = (data: any): string => {
    let csv = 'System Backup Report\n';
    csv += `Timestamp,${data.timestamp}\n`;
    csv += `Month,${data.month}\n\n`;
    
    csv += 'System Health\n';
    csv += 'Component,Status,Count\n';
    if (data.systemHealth) {
      Object.entries(data.systemHealth).forEach(([key, value]: [string, any]) => {
        csv += `${key},${value.status},${value.count || 0}\n`;
      });
    }
    
    csv += '\nData Summary\n';
    if (data.data.users && Array.isArray(data.data.users)) {
      csv += 'Users\n';
      csv += 'ID,Username,Email,Status,Role\n';
      data.data.users.forEach((user: any) => {
        csv += `${user.id},${user.username},${user.email},${user.status},${user.role}\n`;
      });
    }
    
    return csv;
  };

  const convertToXML = (data: any): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<backup>\n';
    xml += `  <timestamp>${data.timestamp}</timestamp>\n`;
    xml += `  <month>${data.month}</month>\n`;
    
    xml += '  <systemHealth>\n';
    if (data.systemHealth) {
      Object.entries(data.systemHealth).forEach(([key, value]: [string, any]) => {
        xml += `    <component name="${key}">\n`;
        xml += `      <status>${value.status}</status>\n`;
        xml += `      <count>${value.count || 0}</count>\n`;
        xml += `    </component>\n`;
      });
    }
    xml += '  </systemHealth>\n';
    
    if (data.data.users && Array.isArray(data.data.users)) {
      xml += '  <users>\n';
      data.data.users.forEach((user: any) => {
        xml += `    <user>\n`;
        xml += `      <id>${user.id}</id>\n`;
        xml += `      <username>${user.username}</username>\n`;
        xml += `      <email>${user.email}</email>\n`;
        xml += `      <status>${user.status}</status>\n`;
        xml += `      <role>${user.role}</role>\n`;
        xml += `    </user>\n`;
      });
      xml += '  </users>\n';
    }
    
    xml += '</backup>';
    return xml;
  };

  const checkSystemHealth = async () => {
    const health = {
      database: { status: 'healthy', timestamp: new Date().toISOString() },
      users: { status: 'checking', count: 0 },
      settings: { status: 'checking', count: 0 },
      auditLogs: { status: 'checking', count: 0 }
    };

    try {
      const usersResponse = await apiService.getUsers();
      health.users.status = usersResponse.success ? 'healthy' : 'error';
      health.users.count = usersResponse.success ? usersResponse.data?.length || 0 : 0;
    } catch (error) {
      health.users.status = 'error';
    }

    try {
      const settingsResponse = await apiService.httpRequest('/admin/settings/');
      health.settings.status = settingsResponse.success ? 'healthy' : 'error';
      health.settings.count = settingsResponse.success ? (Array.isArray(settingsResponse.data) ? settingsResponse.data.length : 0) : 0;
    } catch (error) {
      health.settings.status = 'error';
    }

    try {
      const logsResponse = await apiService.httpRequest<any>('/admin/audit-logs/');
      health.auditLogs.status = logsResponse.success ? 'healthy' : 'error';
      const logsData = logsResponse.data;
      const logsCount = Array.isArray(logsData)
        ? logsData.length
        : Array.isArray(logsData?.results)
          ? logsData.results.length
          : 0;
      health.auditLogs.count = logsResponse.success ? logsCount : 0;
    } catch (error) {
      health.auditLogs.status = 'error';
    }

    return health;
  };

  const handleBackup = async (format: string = backupFormat) => {
    if (!backupEnabled) return;
    
    setIsBackingUp(true);
    setProgress(0);
    setShowFormatDialog(false);
    try {
      setProgress(10);

      const anySettingsOrLogs = backupTypes.settings || backupTypes.logs;
      let backupType: string = 'full';
      if (!anySettingsOrLogs) {
        if (backupTypes.users && !backupTypes.messages) backupType = 'users';
        else if (!backupTypes.users && backupTypes.messages) backupType = 'messages';
        else backupType = 'full';
      }

      const createResp = await apiService.httpRequest<any>('/admin/backups/', {
        method: 'POST',
        body: JSON.stringify({
          name: `Backup_${selectedMonth}_${new Date().toISOString().split('T')[0]}`,
          description: `Backup (${selectedMonth})`,
          backup_type: backupType,
        })
      });

      if (!createResp.success) {
        throw new Error(createResp.error || 'Failed to create backup');
      }

      setProgress(30);
      
      // Poll for backup completion
      const backupId = createResp.data.id;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait time
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResp = await apiService.httpRequest(`/admin/backups/${backupId}/status/`);
        if (statusResp.success && statusResp.data) {
          const data = statusResp.data as any;
          const backupStatus = data.status;
          const backupProgress = data.progress || 0;
          
          setProgress(30 + (backupProgress * 0.7)); // Scale to 30-100 range
          
          if (backupStatus === 'completed') {
            setProgress(100);
            
            // Download and convert backup to selected format
            const downloadResp = await apiService.httpRequest(`/admin/backups/${backupId}/download/`);
            if (downloadResp.success && downloadResp.data) {
              const backupData = downloadResp.data as any;
              
              // Get the actual backup file
              const token = localStorage.getItem('access_token');
              const fileResponse = await fetch(backupData.download_url, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (fileResponse.ok) {
                const blob = await fileResponse.blob();
                let finalBlob: Blob;
                let filename: string;
                
                if (format === 'pdf') {
                  // Convert backup data to PDF
                  const backupInfo = getBackupDetails({
                    id: backupId,
                    name: createResp.data.name,
                    backup_type: backupType,
                    status: 'completed',
                    size: backupData.file_size,
                    record_count: 0,
                    created_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    date: new Date().toISOString().split('T')[0],
                    metadata: {}
                  });
                  
                  const pdfContent = convertToPDF({
                    ...backupInfo,
                    timestamp: new Date().toLocaleString(),
                    format: 'PDF',
                    month: selectedMonth,
                    data: {
                      users: [], // We don't have the actual user data, but we can show the backup info
                      messages: [],
                      conversations: []
                    },
                    systemHealth: {
                      backup: { status: 'completed', count: 1 },
                      database: { status: 'healthy', count: 1 },
                      storage: { status: 'available', count: 1 }
                    }
                  });
                  
                  finalBlob = new Blob([pdfContent], { type: 'application/pdf' });
                  filename = `backup_${backupId}.pdf`;
                } else if (format === 'csv') {
                  // Convert to CSV
                  const csvContent = convertToCSV({
                    backup_id: backupId,
                    name: createResp.data.name,
                    type: backupType,
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    timestamp: new Date().toLocaleString(),
                    month: selectedMonth,
                    data: {
                      users: [],
                      messages: [],
                      conversations: []
                    },
                    systemHealth: {
                      backup: { status: 'completed', count: 1 },
                      database: { status: 'healthy', count: 1 },
                      storage: { status: 'available', count: 1 }
                    }
                  });
                  
                  finalBlob = new Blob([csvContent], { type: 'text/csv' });
                  filename = `backup_${backupId}.csv`;
                } else if (format === 'xml') {
                  // Convert to XML
                  const xmlContent = convertToXML({
                    backup_id: backupId,
                    name: createResp.data.name,
                    type: backupType,
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    timestamp: new Date().toLocaleString(),
                    month: selectedMonth,
                    data: {
                      users: [],
                      messages: [],
                      conversations: []
                    },
                    systemHealth: {
                      backup: { status: 'completed', count: 1 },
                      database: { status: 'healthy', count: 1 },
                      storage: { status: 'available', count: 1 }
                    }
                  });
                  
                  finalBlob = new Blob([xmlContent], { type: 'application/xml' });
                  filename = `backup_${backupId}.xml`;
                } else {
                  // Default to JSON or original format
                  finalBlob = blob;
                  filename = backupData.filename || `backup_${backupId}.zip`;
                }
                
                // Create download link
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(finalBlob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(link.href);
              }
            }
            
            break;
          } else if (backupStatus === 'failed') {
            throw new Error(data.error || 'Backup failed');
          }
        }
        
        attempts++;
      }
      
      await loadRecentBackups();
      setProgress(100);
    } catch (error) {
      console.error('Backup failed:', error);
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Backup failed';
      // You could add a toast notification here
      alert(`Backup failed: ${errorMessage}`);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsBackingUp(false);
      setProgress(0);
    }
  };

  const getBackupDetails = (backup: any) => {
    return {
      basic: {
        id: backup.id,
        name: backup.name,
        type: backup.backup_type,
        status: backup.status,
        size: backup.size,
        record_count: backup.record_count,
      },
      timing: {
        created_at: backup.created_at,
        completed_at: backup.completed_at,
        created_date: backup.date,
        duration: backup.completed_at ? 
          `${Math.round((new Date(backup.completed_at).getTime() - new Date(backup.created_at).getTime()) / 1000)}s` : 
          'In progress'
      },
      metadata: backup.metadata || {},
      system_info: {
        django_version: backup.metadata?.django_version || 'Unknown',
        database_engine: backup.metadata?.database_engine || 'SQLite',
        backup_version: backup.metadata?.backup_version || '1.0'
      }
    };
  };

  const formatFileSize = (sizeInMB: string) => {
    const size = parseFloat(sizeInMB);
    if (size < 1) {
      return `${(size * 1024).toFixed(0)} KB`;
    } else if (size > 1024) {
      return `${(size / 1024).toFixed(2)} GB`;
    }
    return sizeInMB;
  };

  const updateBackupType = (key: keyof typeof backupTypes, value: boolean) => {
    setBackupTypes(prev => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    loadRecentBackups();
  }, []);

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.httpRequest(`/admin/backups/${backupId}/`, {
        method: 'DELETE'
      });

      if (response.success) {
        await loadRecentBackups();
        // Show success message
        alert('Backup deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Delete backup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      alert(`Failed to delete backup: ${errorMessage}`);
    }
  };

  const handleDownloadBackup = async (backupId: string, backupName: string) => {
    try {
      // Create download URL directly to the endpoint
      const downloadUrl = `${API_BASE_URL}/admin/backups/${backupId}/download/`;
      
      // Get auth token
      const token = localStorage.getItem('access_token');
      
      // Create download link with authentication
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = backupName;
      link.style.display = 'none';
      
      // Add authentication headers if token exists
      if (token) {
        // For direct downloads, we need to use fetch and create a blob
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Download failed: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        
        // Clean up the object URL after download
        link.onclick = () => {
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        };
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download backup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      alert(`Failed to download backup: ${errorMessage}`);
    }
  };

  const handlePrintBackup = () => {
    const lastBackup = recentBackups[0];
    const backupInfo = {
      lastBackup: lastBackup?.date || new Date().toISOString().split('T')[0],
      nextScheduled: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      size: lastBackup?.size || "0 MB",
      status: lastBackup?.status || "",
      dataTypes: {
        users: backupTypes.users,
        messages: backupTypes.messages,
        settings: backupTypes.settings,
        logs: backupTypes.logs
      }
    };
    
    const printData = generateBackupReportHTML(backupInfo);
    openPrintWindow({
      ...printData,
      subtitle: `Backup Configuration: ${selectedMonth} - ${Object.values(backupTypes).filter(Boolean).length} data types selected`
    });
  };

  if (!backupEnabled) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="w-5 h-5 mr-2" />
            {t('messages.backup')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Backup is currently disabled. Enable it in Settings to use this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!detailed) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="w-5 h-5 mr-2" />
            {t('messages.backup')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Backup</span>
              <Badge variant="outline">{recentBackups[0]?.date || t('common.none')}</Badge>
            </div>
            {recentBackups[0] && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-purple-50/30 border border-blue-200 p-4">
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.1) 35px, rgba(59, 130, 246, 0.1) 70px)`,
                  }} />
                </div>
                
                <div className="relative space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Database className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800">Latest Backup</h4>
                    </div>
                    <Badge variant={recentBackups[0].status === 'completed' ? 'default' : 'secondary'} className="bg-white/80">
                      {recentBackups[0].status}
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/70 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 text-blue-600 mb-1">
                        <HardDrive className="w-3 h-3" />
                        <span className="text-xs font-medium">Size</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{formatFileSize(recentBackups[0].size)}</p>
                    </div>
                    <div className="bg-white/70 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 text-green-600 mb-1">
                        <BarChart3 className="w-3 h-3" />
                        <span className="text-xs font-medium">Records</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">{recentBackups[0].record_count.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/70 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 text-purple-600 mb-1">
                        <Database className="w-3 h-3" />
                        <span className="text-xs font-medium">Type</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800 capitalize">{recentBackups[0].backup_type}</p>
                    </div>
                    <div className="bg-white/70 p-3 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 text-orange-600 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-medium">Date</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">{new Date(recentBackups[0].created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Info className="w-3 h-3" />
                      <span>ID: {recentBackups[0].id.slice(0, 8)}...</span>
                    </div>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm">Next Scheduled</span>
              <Badge variant="secondary">{new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</Badge>
            </div>
            <Button size="sm" className="w-full" onClick={() => setShowFormatDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Quick Backup
            </Button>
          </div>
        </CardContent>

        <Dialog open={showFormatDialog} onOpenChange={setShowFormatDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Select Backup Format</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {[
                { value: 'json', label: 'JSON', description: 'Structured data format' },
                { value: 'csv', label: 'CSV', description: 'Spreadsheet compatible' },
                { value: 'xml', label: 'XML', description: 'Universal data format' },
                { value: 'pdf', label: 'PDF', description: 'Portable document format' }
              ].map(format => (
                <div
                  key={format.value}
                  onClick={() => setBackupFormat(format.value)}
                  className={`p-3 border rounded cursor-pointer transition ${
                    backupFormat === format.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{format.label}</div>
                  <div className="text-sm text-muted-foreground">{format.description}</div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFormatDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleBackup(backupFormat)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Database className="w-6 h-6 mr-2" />
              Backup Manager
            </CardTitle>
            <CardDescription>Create and manage system backups</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handlePrintBackup}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Backup Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-medium">Backup Configuration</h4>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Month</SelectItem>
                <SelectItem value="last1">Last 1 Month</SelectItem>
                <SelectItem value="last3">Last 3 Months</SelectItem>
                <SelectItem value="last6">Last 6 Months</SelectItem>
                <SelectItem value="last12">Last 12 Months</SelectItem>
                <SelectItem value="all">All Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Backup Format</label>
            <Select value={backupFormat} onValueChange={setBackupFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Data Types</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'users', label: 'User Data', icon: Users },
                { key: 'messages', label: 'Messages', icon: MessageSquare },
                { key: 'settings', label: 'Settings', icon: Settings },
                { key: 'logs', label: 'Audit Logs', icon: Calendar }
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={backupTypes[key as keyof typeof backupTypes]}
                    onCheckedChange={(checked) => updateBackupType(key as keyof typeof backupTypes, !!checked)}
                  />
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <label htmlFor={key} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isBackingUp && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Creating backup...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <Button 
          onClick={() => handleBackup(backupFormat)} 
          disabled={isBackingUp || !Object.values(backupTypes).some(Boolean)}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {isBackingUp ? "Creating Backup..." : "Create Backup"}
        </Button>

        <div className="space-y-3">
          <h4 className="font-medium">Recent Backups with Metadata</h4>
          <div className="space-y-4">
            {recentBackups.map((backup, index) => (
              <BackupMetadataDisplay key={index} backup={backup} compact={true} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
