import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertTriangle, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { moderationApi } from '@/lib/moderation-api';

interface SuspiciousActivity {
  id: string;
  ip_address: string;
  user?: { id: string; username: string };
  activity_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  timestamp: string;
}

export function ModerationPanel() {
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const activities = await moderationApi.getSuspiciousActivities();
      setSuspiciousActivities(activities);
    } catch (error) {
      console.error('Failed to load moderation data:', error);
      toast({ title: 'Error', description: 'Failed to load moderation data' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveActivity = async (activityId: string) => {
    try {
      const success = await moderationApi.resolveSuspiciousActivity(activityId);
      if (success) {
        toast({ title: 'Success', description: 'Activity marked as resolved' });
        loadData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resolve activity' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'dark:bg-red-950/30 bg-red-50';
      case 'high': return 'dark:bg-orange-950/30 bg-orange-50';
      case 'medium': return 'dark:bg-yellow-950/30 bg-yellow-50';
      default: return 'dark:bg-blue-950/30 bg-blue-50';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'outline';
    }
  };

  const unresolvedCount = suspiciousActivities.filter(a => !a.is_resolved).length;
  const criticalCount = suspiciousActivities.filter(a => a.severity === 'critical' && !a.is_resolved).length;
  const resolvedCount = suspiciousActivities.filter(a => a.is_resolved).length;

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Unresolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{unresolvedCount}</div>
            <p className="text-sm text-muted-foreground">Suspicious activities</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-sm text-muted-foreground">Critical severity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{resolvedCount}</div>
            <p className="text-sm text-muted-foreground">Resolved activities</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Suspicious Activities</CardTitle>
          <CardDescription>System detected suspicious activities</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {suspiciousActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No suspicious activities detected</p>
                </div>
              ) : (
                suspiciousActivities.map((activity) => (
                  <div key={activity.id} className={`border rounded-lg p-3 space-y-2 ${getSeverityColor(activity.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityBadgeColor(activity.severity)} className="text-xs">
                            {activity.severity.toUpperCase()}
                          </Badge>
                          {activity.is_resolved && (
                            <Badge variant="outline" className="text-xs">
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{activity.activity_type}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>IP: {activity.ip_address}</span>
                          {activity.user && <span>User: {activity.user.username}</span>}
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {!activity.is_resolved && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Mark Resolved
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Resolve Activity</AlertDialogTitle>
                            <AlertDialogDescription>
                              Mark this suspicious activity as resolved?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleResolveActivity(activity.id)}>
                              Resolve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
