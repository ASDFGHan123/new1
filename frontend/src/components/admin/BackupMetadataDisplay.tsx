import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Database, 
  FileText, 
  Clock, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Activity,
  Server,
  Shield,
  Zap,
  TrendingUp,
  Info,
  Download,
  Upload,
  BarChart3,
  Users,
  MessageSquare,
  Settings
} from 'lucide-react';

interface BackupMetadataDisplayProps {
  backup: {
    id: string;
    name: string;
    backup_type: string;
    status: string;
    size: string;
    record_count: number;
    created_at: string;
    completed_at?: string;
    file_path?: string;
    metadata?: {
      django_version?: string;
      database_engine?: string;
      backup_version?: string;
    };
  };
  compact?: boolean;
}

export const BackupMetadataDisplay: React.FC<BackupMetadataDisplayProps> = ({ 
  backup, 
  compact = false 
}) => {
  const formatFileSize = (sizeInMB: string) => {
    const size = parseFloat(sizeInMB);
    if (size < 1) {
      return `${(size * 1024).toFixed(0)} KB`;
    } else if (size > 1024) {
      return `${(size / 1024).toFixed(2)} GB`;
    }
    return sizeInMB;
  };

  const getDuration = () => {
    if (!backup.completed_at) return 'In progress';
    const duration = Math.round((new Date(backup.completed_at).getTime() - new Date(backup.created_at).getTime()) / 1000);
    return `${duration}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return <Database className="w-4 h-4" />;
      case 'users': return <FileText className="w-4 h-4" />;
      case 'messages': return <FileText className="w-4 h-4" />;
      case 'settings': return <Database className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  if (compact) {
    const statusConfig = {
      completed: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50 border-green-200' },
      in_progress: { icon: Activity, color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200' },
      failed: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50 border-red-200' },
      pending: { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200' }
    };

    const statusInfo = statusConfig[backup.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = statusInfo.icon;

    const typeConfig = {
      full: { icon: Database, label: 'Full System', color: 'text-purple-500' },
      users: { icon: Users, label: 'Users', color: 'text-blue-500' },
      messages: { icon: MessageSquare, label: 'Messages', color: 'text-green-500' },
      settings: { icon: Settings, label: 'Settings', color: 'text-orange-500' },
      logs: { icon: FileText, label: 'Logs', color: 'text-gray-500' }
    };

    const typeInfo = typeConfig[backup.backup_type as keyof typeof typeConfig] || typeConfig.full;
    const TypeIcon = typeInfo.icon;

    return (
      <div className={`relative overflow-hidden rounded-xl border-2 ${statusInfo.bgColor} bg-gradient-to-br from-white to-gray-50/50 p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
        {/* Status Indicator */}
        <div className="absolute top-3 right-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${statusInfo.bgColor} border`}>
            <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
            <span className={`text-xs font-medium capitalize ${statusInfo.color}`}>{backup.status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-white shadow-sm ${typeInfo.color}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{backup.name}</h3>
              <p className="text-sm text-gray-600">{typeInfo.label} Backup</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-blue-600">
                <HardDrive className="w-3 h-3" />
                <span className="text-xs font-medium">{formatFileSize(backup.size)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Size</p>
            </div>
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-green-600">
                <BarChart3 className="w-3 h-3" />
                <span className="text-xs font-medium">{backup.record_count.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Records</p>
            </div>
            <div className="text-center p-2 bg-white/60 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-purple-600">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium">{getDuration()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Duration</p>
            </div>
          </div>

          {/* Progress Bar for In-Progress */}
          {backup.status === 'in_progress' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Creating backup...</span>
                <span>65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(backup.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                <Info className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Animated Border Effect */}
        <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 hover:opacity-20 transition-opacity duration-300" />
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-0 shadow-xl">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.1) 35px, rgba(59, 130, 246, 0.1) 70px)`,
        }} />
      </div>

      <CardHeader className="relative pb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              {getTypeIcon(backup.backup_type)}
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{backup.name}</CardTitle>
              <p className="text-blue-100 text-sm capitalize">{backup.backup_type} Backup</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={getStatusColor(backup.status)} 
              className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors"
            >
              {backup.status.replace('_', ' ')}
            </Badge>
            <div className="text-right">
              <p className="text-xs text-blue-100">Backup ID</p>
              <p className="font-mono text-xs bg-white/20 px-2 py-1 rounded">{backup.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6 p-6">
        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-blue-600 font-medium">Size</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{formatFileSize(backup.size)}</p>
            <div className="mt-2">
              <div className="w-full bg-blue-200 rounded-full h-1">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-green-600 font-medium">Records</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{backup.record_count.toLocaleString()}</p>
            <div className="mt-2">
              <div className="w-full bg-green-200 rounded-full h-1">
                <div className="bg-green-500 h-1 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-purple-600 font-medium">Duration</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{getDuration()}</p>
            <div className="mt-2">
              <div className="w-full bg-purple-200 rounded-full h-1">
                <div className="bg-purple-500 h-1 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-orange-600 font-medium">Performance</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">98%</p>
            <div className="mt-2">
              <div className="w-full bg-orange-200 rounded-full h-1">
                <div className="bg-orange-500 h-1 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Backup Timeline
          </h5>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full ring-4 ring-green-100" />
                <div className="w-0.5 h-16 bg-green-200" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Backup Started</p>
                <p className="text-sm text-gray-600">{new Date(backup.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            {backup.completed_at && (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full ring-4 ring-blue-100" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Backup Completed</p>
                  <p className="text-sm text-gray-600">{new Date(backup.completed_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        {backup.metadata && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
            <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2 text-indigo-600" />
              System Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {backup.metadata.django_version && (
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-1">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs text-gray-500">Django Version</span>
                  </div>
                  <p className="font-mono text-sm font-medium">{backup.metadata.django_version}</p>
                </div>
              )}
              {backup.metadata.database_engine && (
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-1">
                    <Database className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs text-gray-500">Database</span>
                  </div>
                  <p className="font-mono text-sm font-medium">{backup.metadata.database_engine}</p>
                </div>
              )}
              {backup.metadata.backup_version && (
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs text-gray-500">Backup Version</span>
                  </div>
                  <p className="font-mono text-sm font-medium">{backup.metadata.backup_version}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Important Data */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border border-red-200">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Info className="w-5 h-5 mr-2 text-red-600" />
            Critical Information
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Backup Identifier</p>
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded break-all">{backup.id}</p>
            </div>
            {backup.file_path && (
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">File Location</p>
                <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded break-all">{backup.file_path}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Restore</span>
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </CardContent>

      {/* Animated Corner Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-bl-full" />
    </Card>
  );
};
