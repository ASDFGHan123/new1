import { Users, MessageSquare, Activity, Shield, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { openPrintWindow, generateStatsCardsHTML } from "@/lib/printUtils";

const initialStats = [
  {
    title: "Total Users",
    value: 12847,
    change: 8.2,
    icon: Users,
    color: "admin-primary",
  },
  {
    title: "Active Conversations",
    value: 3456,
    change: 12.5,
    icon: MessageSquare,
    color: "admin-secondary",
  },
  {
    title: "Messages Today",
    value: 89234,
    change: 23.1,
    icon: Activity,
    color: "admin-warning",
  },
  {
    title: "Online Users",
    value: 2847,
    change: -2.4,
    icon: Shield,
    color: "admin-success",
  },
];

export const StatsCards = () => {
  const [stats, setStats] = useState(initialStats);

  const handlePrintStats = () => {
    const printData = generateStatsCardsHTML(stats);
    openPrintWindow({
      ...printData,
      subtitle: "System Performance Overview"
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats =>
        prevStats.map(stat => {
          // Randomly update values and changes
          const valueChange = Math.floor(Math.random() * 21) - 10; // -10 to +10
          const changeChange = (Math.random() * 2 - 1) * 0.5; // -0.5 to +0.5
          return {
            ...stat,
            value: Math.max(0, stat.value + valueChange),
            change: Math.max(-50, Math.min(50, stat.change + changeChange)),
          };
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Print Button */}
      <div className="flex justify-end">
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
              <div className="text-2xl font-bold text-card-foreground">{stat.value.toLocaleString()}</div>
              <p className={`text-xs ${
                stat.change >= 0 ? 'text-admin-success' : 'text-admin-error'
              }`}>
                {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};