import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Printer, Download } from "lucide-react";
import { openPrintWindow, generateMessageAnalyticsHTML } from "@/lib/printUtils";

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

export const MessageAnalytics = ({ detailed = false }: MessageAnalyticsProps) => {
  const [messageData, setMessageData] = useState(initialMessageData);
  const [messageTypeData, setMessageTypeData] = useState(initialMessageTypeData);
  const [dailyStats, setDailyStats] = useState(initialDailyStats);

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

  useEffect(() => {
    const interval = setInterval(() => {
      // Update message data - add new point and shift
      setMessageData(prev => {
        const newData = [...prev];
        const lastTime = newData[newData.length - 1].time;
        const [hours] = lastTime.split(':').map(Number);
        const newHours = (hours + 4) % 24;
        const newTime = `${newHours.toString().padStart(2, '0')}:00`;
        const newMessages = Math.floor(Math.random() * 4000) + 500;
        newData.shift();
        newData.push({ time: newTime, messages: newMessages });
        return newData;
      });

      // Update message type data
      setMessageTypeData(prev =>
        prev.map(type => ({
          ...type,
          count: type.count + Math.floor(Math.random() * 101) - 50 // -50 to +50
        }))
      );

      // Update daily stats
      setDailyStats(prev =>
        prev.map(day => ({
          ...day,
          sent: day.sent + Math.floor(Math.random() * 201) - 100,
          delivered: day.delivered + Math.floor(Math.random() * 201) - 100,
          read: day.read + Math.floor(Math.random() * 201) - 100,
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Removed Message Volume and Message Types graphs as requested */}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Message Activity</CardTitle>
            <CardDescription>Real-time message flow</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
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
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
      </CardContent>
    </Card>
  );
};