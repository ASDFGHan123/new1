import React from "react";
import { Download, Calendar, Database, Users, MessageSquare, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

interface BackupManagerProps {
  detailed?: boolean;
}

export const BackupManager = ({ detailed = false }: BackupManagerProps) => {
  const [selectedMonth, setSelectedMonth] = React.useState("current");
  const [backupTypes, setBackupTypes] = React.useState({
    users: true,
    messages: true,
    settings: false,
    logs: false
  });
  const [isBackingUp, setIsBackingUp] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setProgress(0);
    
    // Simulate backup progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }
    
    // Generate backup file
    const backupData = {
      timestamp: new Date().toISOString(),
      month: selectedMonth,
      types: backupTypes,
      data: {
        users: backupTypes.users ? JSON.parse(localStorage.getItem("offchat-users") || "[]") : null,
        messages: backupTypes.messages ? "Sample message data" : null,
        settings: backupTypes.settings ? "Sample settings data" : null,
        logs: backupTypes.logs ? "Sample log data" : null
      }
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offchat-backup-${selectedMonth}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsBackingUp(false);
    setProgress(0);
  };

  const updateBackupType = (key: keyof typeof backupTypes, value: boolean) => {
    setBackupTypes(prev => ({ ...prev, [key]: value }));
  };

  const recentBackups = [
    { date: "2024-01-20", size: "2.4 MB", status: "completed" },
    { date: "2024-01-15", size: "2.1 MB", status: "completed" },
    { date: "2024-01-10", size: "1.9 MB", status: "completed" }
  ];

  if (!detailed) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Backup Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Last Backup</span>
              <Badge variant="outline">2024-01-20</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Next Scheduled</span>
              <Badge variant="secondary">2024-01-25</Badge>
            </div>
            <Button size="sm" className="w-full" onClick={handleBackup}>
              <Download className="w-4 h-4 mr-2" />
              Quick Backup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Backup Manager
        </CardTitle>
        <CardDescription>Create and manage system backups</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backup Configuration */}
        <div className="space-y-4">
          <h4 className="font-medium">Backup Configuration</h4>
          
          {/* Month Selection */}
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

          {/* Data Types */}
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

        {/* Backup Progress */}
        {isBackingUp && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Creating backup...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Backup Action */}
        <Button 
          onClick={handleBackup} 
          disabled={isBackingUp || !Object.values(backupTypes).some(Boolean)}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {isBackingUp ? "Creating Backup..." : "Create Backup"}
        </Button>

        {/* Recent Backups */}
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