import { Users, MessageSquare, Activity, Shield, Printer, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect, useCallback } from "react";
import { openPrintWindow, generateStatsCardsHTML } from "@/lib/printUtils";
import { apiService } from "@/lib/api";

const initialStats = [
  {
    title: "Total Users",
    value: 0,
    change: 0,
    icon: Users,
    color: "admin-primary",
  },
  {
    title: "Active Conversations",
    value: 0,
    change: 0,
    icon: MessageSquare,
    color: "admin-secondary",
  },
  {
    title: "Messages Today",
    value: 0,
    change: 0,
    icon: Activity,
    color: "admin-warning",
  },
  {
    title: "Online Users",
    value: 0,
    change: 0,
    icon: Shield,
    color: "admin-success",
  },
];

export const StatsCards = () => {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch users data to calculate stats
      const usersResponse = await apiService.getUsers();
      
      if (usersResponse.success && usersResponse.data) {
        const users = usersResponse.data;
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const onlineUsers = users.filter(u => u.online_status === 'online').length;
        const totalMessages = users.reduce((sum, u) => sum + (u.message_count || 0), 0);
        
        setStats([
          {
            title: "Total Users",
            value: totalUsers,
            change: 15.2, // Mock growth percentage
            icon: Users,
            color: "admin-primary",
          },
          {
            title: "Active Conversations",
            value: Math.floor(activeUsers / 2), // Estimate based on active users
            change: 8.5,
            icon: MessageSquare,
            color: "admin-secondary",
          },
          {
            title: "Messages Today",
            value: Math.floor(totalMessages / 10), // Estimate daily messages
            change: 23.1,
            icon: Activity,
            color: "admin-warning",
          },
          {
            title: "Online Users",
            value: onlineUsers,
            change: -2.4,
            icon: Shield,
            color: "admin-success",
          },
        ]);
      } else {
        throw new Error('Failed to fetch users data');
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      
      // Set stats to 0 if API fails
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Removed auto-refresh to prevent repeated API calls
    // Users can manually refresh using the refresh button
  }, [loadStats]);

  const handlePrintStats = () => {
    const printData = generateStatsCardsHTML(stats);
    openPrintWindow({
      ...printData,
      subtitle: "System Performance Overview"
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Print and Refresh Buttons */}
      <div className="flex justify-end gap-2">
        <Button 
          onClick={loadStats}
          variant="ghost"
          size="sm"
          disabled={loading}
          className="text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 mr-2 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          onClick={handlePrintStats}
          variant="outline"
          size="sm"
          className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Statistics
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card border-border/50 hover:shadow-card transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground/70">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-${stat.color}/20`}>
                <stat.icon className={`w-4 h-4 text-${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-card-foreground">{stat.value.toLocaleString()}</div>
                  <p className={`text-xs ${
                    stat.change >= 0 ? 'text-admin-success' : 'text-admin-error'
                  }`}>
                    {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}% from last month
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};