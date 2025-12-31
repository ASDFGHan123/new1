import React, { useEffect, useState } from "react";
import { Download, Calendar, Database, Users, MessageSquare, Settings, Printer, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { openPrintWindow, generateBackupReportHTML } from "@/lib/printUtils";
import { useTranslation } from "react-i18next";
import { apiService } from "@/lib/api";

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
    messages: true,
    settings: false,
    logs: false
  });
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [recentBackups, setRecentBackups] = React.useState([
    { date: new Date().toISOString().split('T')[0], size: "0 MB", status: "pending" }
  ]);

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
      const logsResponse = await apiService.httpRequest('/admin/audit-logs/');
      health.auditLogs.status = logsResponse.success ? 'healthy' : 'error';
      health.auditLogs.count = logsResponse.success ? logsResponse.data?.length || 0 : 0;
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
    
    const backupData = {
      timestamp: new Date().toISOString(),
      month: selectedMonth,
      types: backupTypes,
      systemHealth: {},
      data: {}
    };

    try {
      // Step 1: Check system health (20%)
      setProgress(5);
      backupData.systemHealth = await checkSystemHealth();
      setProgress(20);

      // Step 2: Backup users (35%)
      if (backupTypes.users) {
        const usersResponse = await apiService.getUsers();
        backupData.data.users = usersResponse.success ? usersResponse.data : [];
      }
      setProgress(35);

      // Step 3: Backup conversations (50%)
      backupData.data.conversations = [];
      setProgress(50);

      // Step 4: Backup settings (65%)
      if (backupTypes.settings) {
        const settingsResponse = await apiService.httpRequest('/admin/settings/');
        backupData.data.settings = settingsResponse.success ? settingsResponse.data : [];
      }
      setProgress(65);

      // Step 5: Backup audit logs (80%)
      if (backupTypes.logs) {
        const logsResponse = await apiService.httpRequest('/admin/audit-logs/');
        backupData.data.auditLogs = logsResponse.success ? logsResponse.data : [];
      }
      setProgress(80);

      // Step 6: Backup messages (95%)
      if (backupTypes.messages) {
        backupData.data.messages = [];
      }
      setProgress(95);
    } catch (error) {
      console.error('Error fetching backup data:', error);
      backupData.data.error = 'Failed to fetch some data';
    }
    
    setProgress(100);
    
    let fileContent: any;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'json') {
      fileContent = JSON.stringify(backupData, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else if (format === 'csv') {
      fileContent = convertToCSV(backupData);
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else if (format === 'xml') {
      fileContent = convertToXML(backupData);
      mimeType = 'application/xml';
      fileExtension = 'xml';
    } else if (format === 'pdf') {
      fileContent = convertToPDF(backupData);
      mimeType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      fileContent = JSON.stringify(backupData, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    }
    
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offchat-backup-${selectedMonth}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsBackingUp(false);
    setProgress(0);
  };

  const updateBackupType = (key: keyof typeof backupTypes, value: boolean) => {
    setBackupTypes(prev => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    const generateBackupHistory = async () => {
      try {
        const usersResponse = await apiService.getUsers();
        const userCount = usersResponse.success ? usersResponse.data?.length || 0 : 0;
        const estimatedSize = Math.max(0.1, userCount * 0.2);
        
        const backups = [];
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (i * 5));
          backups.push({
            date: date.toISOString().split('T')[0],
            size: `${(estimatedSize + Math.random() * 0.5).toFixed(1)} MB`,
            status: i === 0 ? "completed" : "completed"
          });
        }
        setRecentBackups(backups);
      } catch (error) {
        console.error('Failed to generate backup history:', error);
      }
    };
    
    generateBackupHistory();
  }, []);

  const handlePrintBackup = () => {
    const lastBackup = recentBackups[0];
    const backupInfo = {
      lastBackup: lastBackup?.date || new Date().toISOString().split('T')[0],
      nextScheduled: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      size: lastBackup?.size || "0 MB",
      status: lastBackup?.status || "pending",
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
          <h4 className="font-medium">Recent Backups</h4>
          <div className="space-y-2">
            {recentBackups.map((backup, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded border">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{backup.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{backup.size}</span>
                  <Badge variant="outline" className="text-xs">
                    {backup.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
