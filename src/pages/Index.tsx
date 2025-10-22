import { Button } from "@/components/ui/button";
import { Shield, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            OffChat
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Offline Real-Time Messaging Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Secure, efficient messaging that works even when you're offline. 
            Connect with your team anytime.
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <Link to="/admin">
            <Button className="bg-admin-primary hover:bg-admin-primary/90 shadow-admin">
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Access the admin panel to manage users, monitor conversations, and view analytics
        </div>
      </div>
    </div>
  );
};

export default Index;
