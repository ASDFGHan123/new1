import { useAuth } from "@/contexts/AuthContext";
import { UnifiedChatInterface } from "@/components/chat/UnifiedChatInterface";
import { LoginForm } from "@/components/auth/LoginForm";

export const UnifiedChatPage = () => {
  const { user, isAuthenticated, isLoading, login, signup } = useAuth();

  // Wrapper functions to convert form parameters to credential objects
  const handleLogin = async (identifier: string, password: string) => {
    await login({ identifier, password });
  };

  const handleSignup = async (username: string, password: string) => {
    await signup({ username, email: username, password, confirmPassword: password });
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

  if (!isAuthenticated) {
    return (
      <LoginForm
        onToggleMode={() => {}}
        onLogin={handleLogin}
      />
    );
  }

  // User is authenticated, show the unified chat interface
  return <UnifiedChatInterface />;
};