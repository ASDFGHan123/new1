import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UnifiedChatInterface } from "@/components/chat/UnifiedChatInterface";
import { LoginForm } from "@/components/auth/LoginForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export const UnifiedChatPage = () => {
  const { user, isAuthenticated, isLoading, error, login, signup, clearError } = useAuth();

  // API Integration states
  const [authRetries, setAuthRetries] = useState(0);
  const [isRetryingAuth, setIsRetryingAuth] = useState(false);

  // Wrapper functions to convert form parameters to credential objects
  const handleLogin = async (identifier: string, password: string) => {
    try {
      setAuthRetries(0);
      const result = await login({ identifier, password });
      if (!result?.success) {
        throw new Error(result?.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw to be handled by LoginForm
    }
  };

  const handleSignup = async (username: string, password: string) => {
    try {
      setAuthRetries(0);
      const result = await signup({ username, email: username, password, confirmPassword: password });
      if (!result?.success) {
        throw new Error(result?.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error; // Re-throw to be handled by LoginForm
    }
  };

  const handleRetry = async () => {
    setIsRetryingAuth(true);
    clearError?.();
    
    try {
      // Try to verify existing session first
      const token = localStorage.getItem('access_token');
      if (token) {
        // Let AuthContext handle token verification
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.warn('Retry failed, clearing auth state:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setIsRetryingAuth(false);
      setAuthRetries(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading OffChat...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>{error}</p>
                {authRetries > 0 && (
                  <p className="text-sm text-red-600">
                    Retry attempts: {authRetries}/3
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={handleRetry} 
              variant="outline"
              disabled={isRetryingAuth || authRetries >= 3}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetryingAuth ? 'animate-spin' : ''}`} />
              {isRetryingAuth ? 'Retrying...' : 'Retry'}
            </Button>
            <Button 
              onClick={() => {
                clearError?.();
                setAuthRetries(0);
              }}
            >
              Try Login
            </Button>
          </div>
          {authRetries >= 3 && (
            <p className="text-sm text-center text-muted-foreground">
              Too many retries. Please check your network connection and try again later.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm
        onToggleMode={() => {}}
        onLogin={handleLogin}
        error={error}
      />
    );
  }

  // User is authenticated, show the unified chat interface
  return <UnifiedChatInterface />;
};
