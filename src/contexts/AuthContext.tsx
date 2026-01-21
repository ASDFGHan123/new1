import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthUser, LoginCredentials, SignupCredentials } from "@/types/chat";
import { apiService } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  signup: (credentials: SignupCredentials) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.initializeAuth();
    
    apiService.setAuthExpiredCallback(() => {
      setUser(null);
      setError('Session expired. Please log in again.');
      navigate('/admin-login');
    });
    
    const savedUser = localStorage.getItem("offchat_user");
    let accessToken = localStorage.getItem("access_token") || 
                      localStorage.getItem("chat_access_token") || 
                      localStorage.getItem("admin_access_token");
    
    if (savedUser && accessToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("offchat_user");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("chat_access_token");
        localStorage.removeItem("chat_refresh_token");
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
      }
    } else if (savedUser || accessToken) {
      localStorage.removeItem("offchat_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("chat_access_token");
      localStorage.removeItem("chat_refresh_token");
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
    }
    setIsLoading(false);
  }, [navigate]);

  const clearError = () => {
    setError(null);
  };

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!credentials.identifier?.trim() || !credentials.password?.trim()) {
        throw new Error('Email/username and password are required');
      }
      
      const response = await apiService.login({
        username: credentials.identifier,
        password: credentials.password
      });
      
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        const authUser: AuthUser = {
          ...response.data.user,
          status: "online"
        };
        
        setUser(authUser);
        localStorage.setItem("offchat_user", JSON.stringify(authUser));
        
        // Store tokens with admin prefix if user is admin
        if (authUser.role === 'admin' || authUser.is_staff) {
          localStorage.setItem("admin_access_token", response.data.access);
          localStorage.setItem("admin_refresh_token", response.data.refresh);
        } else {
          localStorage.setItem("chat_access_token", response.data.access);
          localStorage.setItem("chat_refresh_token", response.data.refresh);
        }
        
        return authUser;
      } else {
        const errorMessage = response.error || 'Login failed';
        console.error('Login failed:', errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!credentials.username?.trim() || !credentials.email?.trim() || !credentials.password?.trim()) {
        throw new Error('All fields are required');
      }
      
      const response = await apiService.signup({
        username: credentials.username,
        email: credentials.email,
        password: credentials.password
      });
      
      console.log('Signup response:', response);
      
      if (response.success && response.data) {
        const authUser: AuthUser = {
          ...response.data.user,
          status: "online"
        };
        
        setUser(authUser);
        localStorage.setItem("offchat_user", JSON.stringify(authUser));
        
        // Store tokens with admin prefix if user is admin
        if (authUser.role === 'admin' || authUser.is_staff) {
          localStorage.setItem("admin_access_token", response.data.access);
          localStorage.setItem("admin_refresh_token", response.data.refresh);
        } else {
          localStorage.setItem("chat_access_token", response.data.access);
          localStorage.setItem("chat_refresh_token", response.data.refresh);
        }
        
        return authUser;
      } else {
        const errorMessage = response.error || 'Signup failed';
        console.error('Signup failed:', errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      console.error('Signup error:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem("offchat_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("chat_access_token");
      localStorage.removeItem("chat_refresh_token");
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("offchat_user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    signup,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
