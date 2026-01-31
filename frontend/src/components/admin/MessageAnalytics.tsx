import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { Printer, Download, Loader2, RefreshCw } from "lucide-react";
import { openPrintWindow, generateMessageAnalyticsHTML } from "@/lib/printUtils";
import { apiService } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface MessageAnalyticsProps {
  detailed?: boolean;
}

interface AnalyticsData {
  messageData: Array<{ time: string; messages: number }>;
  messageTypeData: Array<{ type: string; count: number; color: string }>;
  dailyStats: Array<{ day: string; sent: number; delivered: number; read: number }>;
  userStats?: {
    total?: number;
    active?: number;
    pending?: number;
    suspended?: number;
    banned?: number;
  };
  activityStats?: {
    totalMessages?: number;
    averageMessages?: number;
    totalReports?: number;
    totalActivities?: number;
  };
  onlineStats?: {
    online?: number;
    away?: number;
    offline?: number;
  };
}

export const MessageAnalytics = ({ detailed = false }: MessageAnalyticsProps) => {
  const [messageData, setMessageData] = useState<Array<{ time: string; messages: number }>>([]);
  const [messageTypeData, setMessageTypeData] = useState<Array<{ type: string; count: number; color: string }>>([]);
  const [dailyStats, setDailyStats] = useState<Array<{ day: string; sent: number; delivered: number; read: number }>>([]);
  const [summary, setSummary] = useState<{ activeUsers: number; averageMessages: number }>({
    activeUsers: 0,
    averageMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handlePrintAnalytics = () => {
    const analytics = {
      totalMessages: dailyStats.reduce((sum, day) => sum + day.sent, 0),
      messagesToday: messageData[messageData.length - 1]?.messages || 0,
      activeUsers: summary.activeUsers,
      averageMessages: summary.averageMessages,
      messageTypes: messageTypeData.reduce((acc, type) => ({ ...acc, [type.type]: type.count }), {})
    };
    
    const printData = generateMessageAnalyticsHTML(analytics);
    openPrintWindow({
      ...printData,
      subtitle: "Real-time Message Analytics"
    });
  };

  const handleBackupAnalytics = () => {
    const analyticsData = {
      timestamp: new Date().toISOString(),
      timeRange: "current",
      data: {
        messageData,
        messageTypeData,
        dailyStats,
        summary: {
          totalMessages: dailyStats.reduce((sum, day) => sum + day.sent, 0),
          messagesToday: messageData[messageData.length - 1]?.messages || 0,
          activeUsers: summary.activeUsers,
          averageMessages: summary.averageMessages,
          messageTypes: messageTypeData.reduce((acc, type) => ({ ...acc, [type.type]: type.count }), {})
        }
      }
    };
    
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-analytics-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadAnalyticsData = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }
      
      apiService.initializeAuth();
      const response = await apiService.getAnalytics();
      
      if (response.success && response.data) {
        const data = response.data as AnalyticsData;
        
        setMessageData(data.messageData || []);
        setMessageTypeData(data.messageTypeData || []);
        setDailyStats(data.dailyStats || []);
        setSummary({
          activeUsers: Number(data.userStats?.active ?? 0),
          averageMessages: Number(data.activityStats?.averageMessages ?? 0),
        });
        setLastUpdated(new Date());
        setError(null);
      } else {
        setMessageData([]);
        setMessageTypeData([]);
        setDailyStats([]);
        setSummary({ activeUsers: 0, averageMessages: 0 });
        setError(`Analytics API unavailable: ${response.error}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      
      setMessageData([]);
      setMessageTypeData([]);
      setDailyStats([]);
      setSummary({ activeUsers: 0, averageMessages: 0 });
      setError(`API connection failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  useEffect(() => {
    loadAnalyticsData();
    
    const refreshInterval = setInterval(() => {
      loadAnalyticsData(true);
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Removed Message Volume and Message Types graphs as requested */}
      </div>
    );
  }

  if (loading && !lastUpdated) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Message Activity</CardTitle>
              <CardDescription>Real-time message flow</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Message Activity</CardTitle>
            <CardDescription>
              Real-time message flow
              {lastUpdated && (
                <span className="text-xs ml-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <span>{error}</span>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        {messageData.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" minWidth="600px" height={300}>
              <LineChart data={messageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  label={{ value: 'Time (Kabul)', position: 'insideBottomRight', offset: -5 }}
                  tickFormatter={(time) => {
                    if (typeof time === 'string' && time.includes(':')) {
                      const [hours, minutes] = time.split(':');
                      let h = parseInt(hours);
                      let m = parseInt(minutes);
                      // Add 5 hours and 30 minutes for Kabul timezone
                      m += 30;
                      if (m >= 60) {
                        h += 1;
                        m -= 60;
                      }
                      h = (h + 5) % 24;
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 || 12;
                      return `${Math.floor(h12)}:${String(m).padStart(2, '0')} ${ampm}`;
                    }
                    return time;
                  }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  label={{ value: 'Message Count', angle: -90, position: 'insideLeft' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                  formatter={(value) => [Math.round(Number(value)), 'Messages']}
                  labelFormatter={(label) => {
                    if (typeof label === 'string' && label.includes(':')) {
                      const [hours, minutes] = label.split(':');
                      let h = parseInt(hours);
                      let m = parseInt(minutes);
                      m += 30;
                      if (m >= 60) {
                        h += 1;
                        m -= 60;
                      }
                      h = (h + 5) % 24;
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 || 12;
                      return `${Math.floor(h12)}:${String(m).padStart(2, '0')} ${ampm}`;
                    }
                    return label;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="hsl(var(--admin-primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--admin-primary))" }}
                  name="Messages"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No analytics data available</p>
              <p className="text-sm text-muted-foreground mt-2">Check API connection and try refreshing</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};