import React from "react";
import { Shield, Lock, User, Eye, EyeOff, Bug } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { testEnvironmentAndAPI } from "@/utils/testEnv";

interface AdminLoginProps {
  onLogin: (identifier: string, password: string) => Promise<boolean>;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!identifier || !password) {
      setError("Please enter both email/username and password");
      setLoading(false);
      return;
    }

    try {
      const success = await onLogin(identifier, password);
      if (success) {
        navigate("/admin");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-admin-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-admin-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Access the OffChat admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="identifier">Email or Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-admin-primary hover:bg-admin-primary/90">
              <Shield className="w-4 h-4 mr-2" />
              Login to Admin Panel
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Default: admin or admin@example.com / admin123
          </div>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('=== DEBUG INFO ===');
                console.log('Environment:', import.meta.env);
                console.log('API URL:', import.meta.env.VITE_API_URL);
                console.log('Use Real Data:', import.meta.env.VITE_USE_REAL_DATA);
                testEnvironmentAndAPI();
              }}
              className="text-xs"
            >
              <Bug className="w-3 h-3 mr-2" />
              Debug Info
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;