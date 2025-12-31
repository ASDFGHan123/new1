import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, MessageCircle, AlertCircle } from "lucide-react";

interface LoginFormProps {
  onToggleMode: () => void;
  onLogin: (identifier: string, password: string) => Promise<boolean>;
  error?: string | null;
}


export const LoginForm = ({ onToggleMode, onLogin, error }: LoginFormProps) => {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim() || !password.trim()) {
      setLocalError(t('auth.emailPasswordRequired'));
      return;
    }
    
    setIsLoading(true);
    setLocalError(null);
    
    try {
      const success = await onLogin(identifier, password);
      if (success) {
        navigate("/chat");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('auth.loginFailed');
      if (errorMsg.includes('pending')) {
        setLocalError(t('auth.accountPending'));
      } else if (errorMsg.includes('suspended')) {
        setLocalError(t('auth.accountSuspended'));
      } else if (errorMsg.includes('banned')) {
        setLocalError(t('auth.accountBanned'));
      } else {
        setLocalError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-lg border-border/50 shadow-elevated">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <MessageCircle className="h-10 w-10 text-primary" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              OffChat
            </h1>
          </div>
          <div>
            <CardTitle className="text-2xl">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('auth.signInContinue')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {displayError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t('auth.emailOrUsername')}</Label>
              <Input
                id="identifier"
                type="text"
                placeholder={t('auth.enterEmailOrUsername')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                required
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10 transition-all duration-300 focus:shadow-glow"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
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
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.dontHaveAccount')}{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary-glow transition-colors"
                onClick={() => navigate("/signup")}
              >
                {t('auth.signUp')}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};