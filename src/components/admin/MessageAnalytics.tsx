import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Printer, Download, Loader2, RefreshCw } from "lucide-react";
import { openPrintWindow, generateMessageAnalyticsHTML } from "@/lib/printUtils";
import { apiService } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const initialMessageData = [
  { time: "00:00", messages: 1200 },
  { time: "04:00", messages: 800 },
  { time: "08:00", messages: 2400 },
  { time: "12:00", messages: 3200 },
  { time: "16:00", messages: 2800 },
  { time: "20:00", messages: 2000 },
];

const initialMessageTypeData = [
  { type: "Text", count: 45234, color: "#3b82f6" },
  { type: "Image", count: 12456, color: "#10b981" },
  { type: "File", count: 3234, color: "#f59e0b" },
  { type: "Voice", count: 1234, color: "#ef4444" },
];

const initialDailyStats = [
  { day: "Mon", sent: 12000, delivered: 11800, read: 11200 },
  { day: "Tue", sent: 15000, delivered: 14700, read: 14100 },
  { day: "Wed", sent: 18000, delivered: 17600, read: 17000 },
  { day: "Thu", sent: 16000, delivered: 15800, read: 15200 },
  { day: "Fri", sent: 22000, delivered: 21500, read: 20800 },
  { day: "Sat", sent: 8000, delivered: 7900, read: 7600 },
  { day: "Sun", sent: 6000, delivered: 5950, read: 5700 },
];

interface MessageAnalyticsProps {
  detailed?: boolean;
}

interface AnalyticsData {
  messageData: typeof initialMessageData;
  messageTypeData: typeof initialMessageTypeData;
  dailyStats: typeof initialDailyStats;
  totalMessages: number;
  messagesToday: number;
  activeUsers: number;
  averageMessages: number;
}

export const MessageAnalytics = ({ detailed = false }: MessageAnalyticsProps) => {
  const [messageData, setMessageData] = useState(initialMessageData);
  const [messageTypeData, setMessageTypeData] = useState(initialMessageTypeData);
  const [dailyStats, setDailyStats] = useState(initialDailyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handlePrintAnalytics = () => {
    const analytics = {
      totalMessages: dailyStats.reduce((sum, day) => sum + day.sent, 0),
      messagesToday: messageData[messageData.length - 1]?.messages || 0,
      activeUsers: 2847, // This would come from props or API
      averageMessages: Math.round(dailyStats.reduce((sum, day) => sum + day.sent, 0) / dailyStats.length),
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
          activeUsers: 2847,
          averageMessages: Math.round(dailyStats.reduce((sum, day) => sum + day.sent, 0) / dailyStats.length),
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

  // Load analytics data from API
  const loadAnalyticsData = async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }
      
      // Try to fetch analytics data from the API
      const response = await apiService.getAnalytics();
      
      if (response.success && response.data) {
        const data = response.data as AnalyticsData;
        
        setMessageData(data.messageData || initialMessageData);
        setMessageTypeData(data.messageTypeData || initialMessageTypeData);
        setDailyStats(data.dailyStats || initialDailyStats);
        setLastUpdated(new Date());
        setError(null);
        setRetryCount(0);
      } else {
        // If API fails, fall back to mock data with warning
        console.warn('Analytics API failed, using mock data:', response.error);
        setMessageData(initialMessageData);
        setMessageTypeData(initialMessageTypeData);
        setDailyStats(initialDailyStats);
        setLastUpdated(new Date());
        setError(`API unavailable, using demo data: ${response.error}`);
        setRetryCount(0);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      
      // Always fall back to mock data instead of failing completely
      console.warn('Analytics API error, falling back to mock data:', errorMessage);
      setMessageData(initialMessageData);
      setMessageTypeData(initialMessageTypeData);
      setDailyStats(initialDailyStats);
      setLastUpdated(new Date());
      setError(`Using demo data - API connection failed: ${errorMessage}`);
      setRetryCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Refresh analytics data
  const handleRefresh = () => {
    setRetryCount(0);
    loadAnalyticsData();
  };

  useEffect(() => {
    // Load initial data
    loadAnalyticsData();
    
    // Set up periodic refresh (every 30 seconds)
    const refreshInterval = setInterval(() => {
      loadAnalyticsData(true);
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [retryCount]);

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Removed Message Volume and Message Types graphs as requested */}
      </div>
    );
  }

  // Show loading state
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
            <Button 
              onClick={handleBackupAnalytics}
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Backup Data
            </Button>
            <Button 
              onClick={handlePrintAnalytics}
              variant="outline"
              size="sm"
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Analytics
            </Button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{error}</span>
                {retryCount > 0 && retryCount < maxRetries && (
                  <span className="text-sm">
                    Retry attempt {retryCount}/{maxRetries}
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" minWidth="600px" height={300}>
          <LineChart data={messageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="messages" 
              stroke="hsl(var(--admin-primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--admin-primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};